# 🔭 Kepler Exoplanet Classifier Web App

A complete machine learning web application for classifying Kepler Objects of Interest (KOI) into confirmed exoplanets, candidates, or false positives.

## 🎯 Features

### 🔮 Single Prediction
- Interactive form for entering planetary and stellar parameters
- Real-time classification with confidence scores
- Probability distribution visualization

### 📊 Batch Prediction
- Upload CSV files with multiple exoplanet data
- Bulk classification with summary statistics
- Download results as CSV

### 📈 Model Performance
- Model accuracy metrics (77.3% accuracy, 0.912 ROC AUC)
- Feature importance analysis
- Performance visualization charts

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Virtual environment (recommended)

### Installation

1. **Clone or download the project files**

2. **Create and activate virtual environment**
   ```bash
   python -m venv kepler_env
   source kepler_env/bin/activate  # On Windows: kepler_env\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the web application**

   **Option 1: Start both servers automatically**
   ```bash
   python start_webapp.py
   ```

   **Option 2: Start servers manually**
   ```bash
   # Terminal 1 - Start Flask API backend
   python app.py
   
   # Terminal 2 - Start Streamlit frontend  
   streamlit run streamlit_app.py
   ```

   This will start both:
   - Flask Backend: http://localhost:5001
   - Streamlit Frontend: http://localhost:8503

## 📁 Project Structure

```
kepler_exoplanet_classifier/
├── app.py                    # Flask backend API
├── streamlit_app.py          # Streamlit frontend
├── start_webapp.py           # Application launcher
├── preprocessing_pipeline.py # Data preprocessing script
├── ml_training_pipeline.py   # ML training script
├── kepler_processed.csv      # Preprocessed dataset
├── best_model.pkl           # Trained model file
├── sample_exoplanets.csv    # Sample data for testing
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🔧 API Endpoints

### Flask Backend (http://localhost:5001)

- `GET /health` - Health check
- `GET /model_info` - Model information and performance metrics
- `POST /predict` - Single exoplanet prediction
- `POST /predict_batch` - Batch prediction from CSV

### Example API Usage

**Single Prediction:**
```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "koi_period": 10.5,
    "koi_duration": 2.8,
    "koi_depth": 850,
    "koi_prad": 1.8,
    "koi_srad": 0.95,
    "koi_teq": 650,
    "koi_insol": 1.2,
    "koi_impact": 0.3,
    "koi_model_snr": 12.5,
    "koi_steff": 5800,
    "koi_slogg": 4.4,
    "koi_kepmag": 14.2
  }'
```

**Response:**
```json
{
  "prediction": {
    "class_id": 1,
    "class_name": "CONFIRMED",
    "confidence": 0.85
  },
  "probabilities": {
    "FALSE POSITIVE": 0.10,
    "CANDIDATE": 0.05,
    "CONFIRMED": 0.85
  }
}
```

## 📊 Required Features

The model requires these 12 features:

| Feature | Description | Units |
|---------|-------------|-------|
| `koi_period` | Orbital period | days |
| `koi_duration` | Transit duration | hours |
| `koi_depth` | Transit depth | ppm |
| `koi_prad` | Planetary radius | Earth radii |
| `koi_srad` | Stellar radius | Solar radii |
| `koi_teq` | Equilibrium temperature | Kelvin |
| `koi_insol` | Insolation flux | Earth flux |
| `koi_impact` | Impact parameter | dimensionless |
| `koi_model_snr` | Model signal-to-noise ratio | dimensionless |
| `koi_steff` | Stellar effective temperature | Kelvin |
| `koi_slogg` | Stellar surface gravity | log10(cm/s²) |
| `koi_kepmag` | Kepler magnitude | mag |

## 🎯 Classification Categories

- **✅ CONFIRMED** (Class ID: 1) - Validated exoplanets
- **❓ CANDIDATE** (Class ID: 0) - Potential exoplanets requiring validation
- **❌ FALSE POSITIVE** (Class ID: -1) - Objects that are not actual planets

## 📈 Model Performance

| Metric | Value |
|--------|-------|
| **Accuracy** | 77.3% |
| **ROC AUC** | 0.912 |
| **Cross-Validation** | 77.7% ± 1.5% |

### Top Feature Importance
1. **Model SNR** (0.170) - Signal-to-noise ratio
2. **Planetary Radius** (0.130) - Planet size
3. **Transit Depth** (0.103) - Brightness decrease
4. **Impact Parameter** (0.092) - Orbital alignment

## 🧪 Testing

Use the provided `sample_exoplanets.csv` file to test batch predictions, or try the single prediction form with these sample values:

- **Orbital Period**: 10.5 days
- **Transit Duration**: 2.8 hours
- **Transit Depth**: 850 ppm
- **Planetary Radius**: 1.8 Earth radii
- **Stellar Radius**: 0.95 Solar radii
- **Equilibrium Temperature**: 650 K

## 🛠️ Development

### Running Components Separately

**Backend only:**
```bash
python app.py
```

**Frontend only:**
```bash
streamlit run streamlit_app.py
```

### Training New Models

1. **Preprocess data:**
   ```bash
   python preprocessing_pipeline.py
   ```

2. **Train models:**
   ```bash
   python ml_training_pipeline.py
   ```

## 📚 Data Source

This application uses the **NASA Kepler Objects of Interest (KOI) dataset** from the NASA Exoplanet Archive:

- **Source**: [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)
- **DOI**: 10.26133/NEA4
- **Dataset**: Kepler KOI Cumulative Table
- **Entries**: 9,564 KOI objects

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.

## 📄 License

This project is open source and available under the MIT License.

---

**🔭 Happy exoplanet hunting!**

---

## 👤 Portfolio

This repository also hosts my personal portfolio site (source in [`docs/`](docs/)):
**https://mhammaddiranyeng-cell.github.io/kepler-exoplanet-classifier/**

See [`docs/README.md`](docs/README.md) for how to publish and edit it.
