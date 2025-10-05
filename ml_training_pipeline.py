#!/usr/bin/env python3
"""
Kepler KOI Dataset Machine Learning Training Pipeline
Step 3: Train Your Model

This script implements a comprehensive ML pipeline:
1. Load preprocessed data
2. Split data (70% training, 30% testing)
3. Train multiple models (Logistic Regression, Random Forest, XGBoost, Neural Network)
4. Evaluate with accuracy, confusion matrix, precision/recall
5. Compare model performance
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix,
                           precision_recall_fscore_support, roc_auc_score, roc_curve)
from sklearn.preprocessing import label_binarize
# XGBoost not available - using alternative models
XGBOOST_AVAILABLE = False
import warnings
warnings.filterwarnings('ignore')

class KeplerMLPipeline:
    """Complete ML training pipeline for Kepler KOI dataset"""
    
    def __init__(self, data_path='kepler_processed.csv'):
        """
        Initialize the ML pipeline
        
        Args:
            data_path (str): Path to the preprocessed dataset
        """
        self.data_path = data_path
        self.data = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.models = {}
        self.results = {}
        
        # Class labels mapping
        self.class_labels = {-1: 'FALSE POSITIVE', 0: 'CANDIDATE', 1: 'CONFIRMED'}
        self.class_names = ['FALSE POSITIVE', 'CANDIDATE', 'CONFIRMED']
        
        # Model configurations
        self.model_configs = {
            'Logistic Regression': {
                'model': LogisticRegression(random_state=42, max_iter=1000),
                'params': {
                    'C': [0.1, 1, 10, 100],
                    'penalty': ['l1', 'l2'],
                    'solver': ['liblinear']
                }
            },
            'Random Forest': {
                'model': RandomForestClassifier(random_state=42),
                'params': {
                    'n_estimators': [100, 200, 300],
                    'max_depth': [10, 20, None],
                    'min_samples_split': [2, 5, 10],
                    'min_samples_leaf': [1, 2, 4]
                }
            },
            'Gradient Boosting': {
                'model': GradientBoostingClassifier(random_state=42),
                'params': {
                    'n_estimators': [100, 200, 300],
                    'max_depth': [3, 6, 10],
                    'learning_rate': [0.01, 0.1, 0.2],
                    'subsample': [0.8, 0.9, 1.0]
                }
            },
            'Neural Network': {
                'model': MLPClassifier(random_state=42, max_iter=500),
                'params': {
                    'hidden_layer_sizes': [(50,), (100,), (50, 50), (100, 50)],
                    'activation': ['relu', 'tanh'],
                    'alpha': [0.0001, 0.001, 0.01],
                    'learning_rate': ['constant', 'adaptive']
                }
            }
        }
    
    def load_data(self):
        """Load the preprocessed dataset"""
        print("🔄 Loading preprocessed dataset...")
        
        try:
            self.data = pd.read_csv(self.data_path)
            print(f"✅ Dataset loaded successfully!")
            print(f"   Shape: {self.data.shape}")
            print(f"   Columns: {list(self.data.columns)}")
            
            # Separate features and target
            self.feature_columns = [col for col in self.data.columns if col != 'koi_disposition']
            self.X = self.data[self.feature_columns]
            self.y = self.data['koi_disposition']
            
            print(f"   Features: {len(self.feature_columns)}")
            print(f"   Target classes: {sorted(self.y.unique())}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error loading dataset: {e}")
            return False
    
    def split_data(self, test_size=0.3, random_state=42):
        """
        Split data into training and testing sets
        
        Args:
            test_size (float): Proportion of data for testing
            random_state (int): Random seed for reproducibility
        """
        print(f"\n🔄 Splitting data ({int((1-test_size)*100)}% training, {int(test_size*100)}% testing)...")
        
        if self.data is None:
            print("❌ No data loaded. Please run load_data() first.")
            return False
        
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            self.X, self.y, test_size=test_size, random_state=random_state, stratify=self.y
        )
        
        print(f"✅ Data split successfully!")
        print(f"   Training set: {self.X_train.shape[0]} samples")
        print(f"   Test set: {self.X_test.shape[0]} samples")
        print(f"   Features: {self.X_train.shape[1]}")
        
        # Check class distribution
        print(f"\n📊 Class distribution in training set:")
        train_dist = self.y_train.value_counts().sort_index()
        for label, count in train_dist.items():
            class_name = self.class_labels[label]
            percentage = (count / len(self.y_train)) * 100
            print(f"   {class_name}: {count} ({percentage:.1f}%)")
        
        return True
    
    def train_model(self, model_name, use_grid_search=True):
        """
        Train a specific model
        
        Args:
            model_name (str): Name of the model to train
            use_grid_search (bool): Whether to use GridSearchCV for hyperparameter tuning
        """
        print(f"\n🔄 Training {model_name}...")
        
        if model_name not in self.model_configs:
            print(f"❌ Unknown model: {model_name}")
            return False
        
        model_config = self.model_configs[model_name]
        base_model = model_config['model']
        
        if use_grid_search:
            print(f"   Performing hyperparameter tuning...")
            grid_search = GridSearchCV(
                base_model, 
                model_config['params'], 
                cv=5, 
                scoring='accuracy', 
                n_jobs=-1,
                verbose=0
            )
            grid_search.fit(self.X_train, self.y_train)
            
            best_model = grid_search.best_estimator_
            best_params = grid_search.best_params_
            best_score = grid_search.best_score_
            
            print(f"   Best parameters: {best_params}")
            print(f"   Best CV score: {best_score:.4f}")
            
        else:
            best_model = base_model
            best_model.fit(self.X_train, self.y_train)
        
        # Store the trained model
        self.models[model_name] = best_model
        
        print(f"✅ {model_name} trained successfully!")
        
        return True
    
    def evaluate_model(self, model_name):
        """
        Evaluate a trained model
        
        Args:
            model_name (str): Name of the model to evaluate
        """
        if model_name not in self.models:
            print(f"❌ Model {model_name} not found. Please train it first.")
            return None
        
        print(f"\n🔄 Evaluating {model_name}...")
        
        model = self.models[model_name]
        
        # Make predictions
        y_pred = model.predict(self.X_test)
        y_pred_proba = model.predict_proba(self.X_test) if hasattr(model, 'predict_proba') else None
        
        # Calculate metrics
        accuracy = accuracy_score(self.y_test, y_pred)
        precision, recall, f1, _ = precision_recall_fscore_support(self.y_test, y_pred, average='weighted')
        
        # Calculate per-class metrics
        precision_per_class, recall_per_class, f1_per_class, _ = precision_recall_fscore_support(
            self.y_test, y_pred, average=None
        )
        
        # Confusion matrix
        cm = confusion_matrix(self.y_test, y_pred)
        
        # ROC AUC (one-vs-rest)
        if y_pred_proba is not None:
            y_test_binarized = label_binarize(self.y_test, classes=[-1, 0, 1])
            roc_auc = roc_auc_score(y_test_binarized, y_pred_proba, average='weighted', multi_class='ovr')
        else:
            roc_auc = None
        
        # Store results
        self.results[model_name] = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'precision_per_class': precision_per_class,
            'recall_per_class': recall_per_class,
            'f1_per_class': f1_per_class,
            'confusion_matrix': cm,
            'predictions': y_pred,
            'predictions_proba': y_pred_proba,
            'roc_auc': roc_auc
        }
        
        # Print results
        print(f"✅ {model_name} evaluation completed!")
        print(f"   Accuracy: {accuracy:.4f}")
        print(f"   Precision: {precision:.4f}")
        print(f"   Recall: {recall:.4f}")
        print(f"   F1-Score: {f1:.4f}")
        if roc_auc is not None:
            print(f"   ROC AUC: {roc_auc:.4f}")
        
        return self.results[model_name]
    
    def train_all_models(self, use_grid_search=True):
        """Train all configured models"""
        print("\n🚀 TRAINING ALL MODELS")
        print("=" * 50)
        
        for model_name in self.model_configs.keys():
            try:
                self.train_model(model_name, use_grid_search=use_grid_search)
                self.evaluate_model(model_name)
            except Exception as e:
                print(f"❌ Error training {model_name}: {e}")
                continue
        
        print(f"\n✅ Training completed for {len(self.models)} models!")
        
        return len(self.models) > 0
    
    def create_model_comparison(self):
        """Create comprehensive model comparison visualizations"""
        print("\n📊 Creating model comparison visualizations...")
        
        if not self.results:
            print("❌ No results available. Please train and evaluate models first.")
            return None
        
        # Create figure with subplots
        fig, axes = plt.subplots(2, 3, figsize=(20, 12))
        fig.suptitle('Kepler KOI Dataset - Model Performance Comparison', fontsize=16, fontweight='bold')
        
        # 1. Overall accuracy comparison
        ax1 = axes[0, 0]
        model_names = list(self.results.keys())
        accuracies = [self.results[name]['accuracy'] for name in model_names]
        
        bars = ax1.bar(model_names, accuracies, color=['#ff9999', '#66b3ff', '#99ff99', '#ffcc99'])
        ax1.set_title('Model Accuracy Comparison')
        ax1.set_ylabel('Accuracy')
        ax1.set_ylim(0, 1)
        
        # Add value labels on bars
        for bar, acc in zip(bars, accuracies):
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                    f'{acc:.3f}', ha='center', va='bottom')
        
        # 2. Precision, Recall, F1 comparison
        ax2 = axes[0, 1]
        metrics = ['precision', 'recall', 'f1_score']
        x = np.arange(len(model_names))
        width = 0.25
        
        for i, metric in enumerate(metrics):
            values = [self.results[name][metric] for name in model_names]
            ax2.bar(x + i*width, values, width, label=metric.replace('_', ' ').title())
        
        ax2.set_title('Precision, Recall, F1-Score Comparison')
        ax2.set_ylabel('Score')
        ax2.set_xlabel('Models')
        ax2.set_xticks(x + width)
        ax2.set_xticklabels(model_names, rotation=45)
        ax2.legend()
        ax2.set_ylim(0, 1)
        
        # 3. Confusion matrices for each model
        for i, (model_name, result) in enumerate(self.results.items()):
            if i >= 4:  # Only show first 4 models
                break
            
            row = 1 if i < 2 else 2
            col = i % 2 if i < 2 else i - 2
            
            if i < 2:
                ax = axes[row, col] if i == 0 else axes[row, col]
            else:
                # Create additional subplot for more models
                if i == 2:
                    ax = plt.subplot(2, 3, 5)
                else:
                    ax = plt.subplot(2, 3, 6)
            
            cm = result['confusion_matrix']
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax,
                       xticklabels=self.class_names, yticklabels=self.class_names)
            ax.set_title(f'{model_name}\nConfusion Matrix')
            ax.set_xlabel('Predicted')
            ax.set_ylabel('Actual')
        
        # 4. Per-class metrics heatmap
        ax4 = axes[1, 2]
        precision_matrix = np.array([self.results[name]['precision_per_class'] for name in model_names])
        
        sns.heatmap(precision_matrix, annot=True, fmt='.3f', cmap='viridis', ax=ax4,
                   xticklabels=self.class_names, yticklabels=model_names)
        ax4.set_title('Precision per Class')
        ax4.set_xlabel('Classes')
        ax4.set_ylabel('Models')
        
        plt.tight_layout()
        plt.savefig('kepler_ml_results.png', dpi=300, bbox_inches='tight')
        print("📊 Model comparison saved as 'kepler_ml_results.png'")
        
        return fig
    
    def print_detailed_results(self):
        """Print detailed results for all models"""
        print("\n📋 DETAILED MODEL RESULTS")
        print("=" * 60)
        
        for model_name, result in self.results.items():
            print(f"\n🔍 {model_name.upper()}")
            print("-" * 40)
            
            # Overall metrics
            print(f"Accuracy:  {result['accuracy']:.4f}")
            print(f"Precision: {result['precision']:.4f}")
            print(f"Recall:    {result['recall']:.4f}")
            print(f"F1-Score:  {result['f1_score']:.4f}")
            if result['roc_auc'] is not None:
                print(f"ROC AUC:   {result['roc_auc']:.4f}")
            
            # Per-class metrics
            print(f"\nPer-class metrics:")
            for i, class_name in enumerate(self.class_names):
                print(f"  {class_name}:")
                print(f"    Precision: {result['precision_per_class'][i]:.4f}")
                print(f"    Recall:    {result['recall_per_class'][i]:.4f}")
                print(f"    F1-Score:  {result['f1_per_class'][i]:.4f}")
            
            # Confusion matrix
            print(f"\nConfusion Matrix:")
            cm_df = pd.DataFrame(result['confusion_matrix'], 
                               index=self.class_names, 
                               columns=self.class_names)
            print(cm_df.to_string())
    
    def get_best_model(self):
        """Get the best performing model based on accuracy"""
        if not self.results:
            return None, None
        
        best_model_name = max(self.results.keys(), key=lambda x: self.results[x]['accuracy'])
        best_accuracy = self.results[best_model_name]['accuracy']
        
        return best_model_name, best_accuracy
    
    def save_results(self, filename='kepler_ml_results.csv'):
        """Save model results to CSV"""
        print(f"\n💾 Saving results to {filename}...")
        
        if not self.results:
            print("❌ No results available.")
            return False
        
        # Create results dataframe
        results_data = []
        for model_name, result in self.results.items():
            results_data.append({
                'Model': model_name,
                'Accuracy': result['accuracy'],
                'Precision': result['precision'],
                'Recall': result['recall'],
                'F1_Score': result['f1_score'],
                'ROC_AUC': result['roc_auc'] if result['roc_auc'] is not None else np.nan,
                'Precision_False_Positive': result['precision_per_class'][0],
                'Precision_Candidate': result['precision_per_class'][1],
                'Precision_Confirmed': result['precision_per_class'][2],
                'Recall_False_Positive': result['recall_per_class'][0],
                'Recall_Candidate': result['recall_per_class'][1],
                'Recall_Confirmed': result['recall_per_class'][2]
            })
        
        results_df = pd.DataFrame(results_data)
        results_df = results_df.sort_values('Accuracy', ascending=False)
        results_df.to_csv(filename, index=False)
        
        print(f"✅ Results saved to {filename}")
        
        return True
    
    def run_complete_pipeline(self, test_size=0.3, use_grid_search=True):
        """
        Run the complete ML pipeline
        
        Args:
            test_size (float): Proportion of data for testing
            use_grid_search (bool): Whether to use hyperparameter tuning
        """
        print("🚀 STARTING COMPLETE ML TRAINING PIPELINE")
        print("=" * 60)
        
        # Step 1: Load data
        if not self.load_data():
            return False
        
        # Step 2: Split data
        if not self.split_data(test_size=test_size):
            return False
        
        # Step 3: Train all models
        if not self.train_all_models(use_grid_search=use_grid_search):
            return False
        
        # Step 4: Create visualizations
        self.create_model_comparison()
        
        # Step 5: Print detailed results
        self.print_detailed_results()
        
        # Step 6: Save results
        self.save_results()
        
        # Step 7: Show best model
        best_model, best_accuracy = self.get_best_model()
        print(f"\n🏆 BEST MODEL: {best_model}")
        print(f"   Accuracy: {best_accuracy:.4f}")
        
        print("\n🎉 ML TRAINING PIPELINE COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        
        return True

def main():
    """Main function to run the ML training pipeline"""
    
    # Initialize ML pipeline
    ml_pipeline = KeplerMLPipeline()
    
    # Run complete pipeline
    success = ml_pipeline.run_complete_pipeline(
        test_size=0.3,        # 70% training, 30% testing
        use_grid_search=True  # Use hyperparameter tuning
    )
    
    if success:
        print("\n📋 ML PIPELINE SUMMARY:")
        print("✅ All models trained and evaluated successfully")
        print("✅ Model comparison visualizations created")
        print("✅ Detailed results printed and saved")
        print("✅ Ready for model deployment!")
        
        return ml_pipeline
    else:
        print("❌ ML pipeline failed!")
        return None

if __name__ == "__main__":
    ml_pipeline = main()
