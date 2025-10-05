#!/usr/bin/env python3
"""
Kepler Exoplanet Classifier Web App
Flask Backend API

This Flask app provides endpoints for:
- Single exoplanet prediction
- Batch CSV prediction
- Model information
- Health check
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pandas as pd
import numpy as np
import pickle
import json
import os
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Global variables
model = None
feature_columns = None
class_labels = {-1: 'FALSE POSITIVE', 0: 'CANDIDATE', 1: 'CONFIRMED'}
model_info = {
    'name': 'Gradient Boosting Classifier',
    'accuracy': 0.7725,
    'roc_auc': 0.912,
    'cv_score': '77.7% ± 1.5%',
    'features': [
        'koi_period', 'koi_duration', 'koi_depth', 'koi_prad', 
        'koi_srad', 'koi_teq', 'koi_insol', 'koi_impact', 
        'koi_model_snr', 'koi_steff', 'koi_slogg', 'koi_kepmag'
    ]
}

def load_model():
    """Load the trained model and feature information"""
    global model, feature_columns
    
    try:
        # Load the trained model
        with open('best_model.pkl', 'rb') as f:
            model = pickle.load(f)
        
        # Load feature columns from processed data
        df_sample = pd.read_csv('kepler_processed.csv', nrows=1)
        feature_columns = [col for col in df_sample.columns if col != 'koi_disposition']
        
        print(f"✅ Model loaded successfully!")
        print(f"   Model type: {type(model).__name__}")
        print(f"   Features: {len(feature_columns)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

def validate_input_data(data):
    """Validate input data format and values"""
    required_features = model_info['features']
    
    # Check if all required features are present
    missing_features = [f for f in required_features if f not in data]
    if missing_features:
        return False, f"Missing features: {missing_features}"
    
    # Check for valid numeric values
    for feature in required_features:
        value = data[feature]
        if pd.isna(value) or not isinstance(value, (int, float)) or np.isinf(value):
            return False, f"Invalid value for {feature}: {value}"
    
    return True, "Valid"

def preprocess_single_input(data):
    """Preprocess single input data for prediction"""
    try:
        # Create DataFrame with single row
        df = pd.DataFrame([data])
        
        # Ensure correct column order
        df = df[feature_columns]
        
        # Convert to numpy array
        return df.values
        
    except Exception as e:
        raise Exception(f"Preprocessing error: {e}")

@app.route('/')
def home():
    """Home page with API documentation"""
    return jsonify({
        'message': 'Kepler Exoplanet Classifier API',
        'version': '1.0.0',
        'endpoints': {
            '/predict': 'POST - Single prediction',
            '/predict_batch': 'POST - Batch prediction from CSV',
            '/model_info': 'GET - Model information',
            '/health': 'GET - Health check'
        },
        'model_info': model_info
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': model is not None
    })

@app.route('/model_info')
def get_model_info():
    """Get model information and performance metrics"""
    return jsonify({
        'model_info': model_info,
        'feature_importance': {
            'koi_model_snr': 0.170,
            'koi_prad': 0.130,
            'koi_depth': 0.103,
            'koi_impact': 0.092,
            'koi_period': 0.089,
            'koi_duration': 0.081,
            'koi_insol': 0.076,
            'koi_teq': 0.074
        },
        'class_labels': class_labels
    })

@app.route('/predict', methods=['POST'])
def predict_single():
    """Predict single exoplanet classification"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate input
        is_valid, message = validate_input_data(data)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Preprocess data
        X = preprocess_single_input(data)
        
        # Make prediction
        prediction = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0]
        
        # Get class probabilities
        class_probs = {}
        for i, (class_id, class_name) in enumerate(class_labels.items()):
            class_probs[class_name] = float(probabilities[i])
        
        # Format response
        result = {
            'prediction': {
                'class_id': int(prediction),
                'class_name': class_labels[prediction],
                'confidence': float(max(probabilities))
            },
            'probabilities': class_probs,
            'input_data': data,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    """Predict batch of exoplanets from CSV data"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read CSV file
        try:
            df = pd.read_csv(file)
        except Exception as e:
            return jsonify({'error': f'Error reading CSV: {str(e)}'}), 400
        
        # Validate required columns
        missing_features = [f for f in model_info['features'] if f not in df.columns]
        if missing_features:
            return jsonify({
                'error': f'Missing required columns: {missing_features}',
                'required_columns': model_info['features']
            }), 400
        
        # Preprocess data
        X = df[feature_columns].values
        
        # Make predictions
        predictions = model.predict(X)
        probabilities = model.predict_proba(X)
        
        # Format results
        results = []
        for i, (pred, probs) in enumerate(zip(predictions, probabilities)):
            class_probs = {}
            for j, (class_id, class_name) in enumerate(class_labels.items()):
                class_probs[class_name] = float(probs[j])
            
            results.append({
                'index': i,
                'prediction': {
                    'class_id': int(pred),
                    'class_name': class_labels[pred],
                    'confidence': float(max(probs))
                },
                'probabilities': class_probs
            })
        
        # Add summary statistics
        prediction_counts = {name: sum(1 for r in results if r['prediction']['class_name'] == name) 
                           for name in class_labels.values()}
        
        response = {
            'predictions': results,
            'summary': {
                'total_predictions': len(results),
                'prediction_counts': prediction_counts
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

def main():
    """Main function to run the Flask app"""
    print("🚀 Starting Kepler Exoplanet Classifier API...")
    
    # Load model
    if not load_model():
        print("❌ Failed to load model. Exiting.")
        return
    
    # Run app
    print("✅ API ready!")
    print("📡 Available endpoints:")
    print("   - GET  /health")
    print("   - GET  /model_info") 
    print("   - POST /predict")
    print("   - POST /predict_batch")
    
    app.run(host='0.0.0.0', port=5001, debug=True)

if __name__ == '__main__':
    main()

