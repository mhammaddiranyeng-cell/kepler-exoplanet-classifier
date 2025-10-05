#!/usr/bin/env python3
"""
Kepler Exoplanet Classifier Web App
Streamlit Frontend

This Streamlit app provides a user-friendly interface for:
- Single exoplanet prediction form
- Batch CSV upload and prediction
- Model performance visualization
- Results display with confidence scores
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.figure_factory as ff
import plotly.io as pio
import pydeck as pdk
import requests
import json
import io
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Page configuration
st.set_page_config(
    page_title="Kepler Exoplanet Classifier",
    page_icon="🌌",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ---------------------------------- THEME ENHANCEMENTS ----------------------------------
st.markdown(
    """
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
      html, body, [class*="css"]  {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 100%);
        color: #e2e8f0;
        line-height: 1.6;
      }
      /* animated space background */
      #space-bg { position: fixed; inset: 0; z-index: -1; overflow: hidden; }
      #space-bg .stars, #space-bg .stars2, #space-bg .nebula {
        position: absolute; inset: -50%; pointer-events: none;
        background-repeat: repeat; will-change: transform, background-position;
        filter: drop-shadow(0 0 2px rgba(255,255,255,.2));
      }
      /* tiny stars layer */
      #space-bg .stars {
        background-image:
          radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,.6) 0, rgba(255,255,255,0) 60%),
          radial-gradient(1px 1px at 80% 70%, rgba(255,255,255,.5) 0, rgba(255,255,255,0) 60%),
          radial-gradient(1.5px 1.5px at 40% 60%, rgba(255,255,255,.35) 0, rgba(255,255,255,0) 60%),
          radial-gradient(1px 1px at 65% 20%, rgba(255,255,255,.4) 0, rgba(255,255,255,0) 60%);
        animation: drift1 120s linear infinite;
        opacity: .35;
      }
      /* larger sparse stars */
      #space-bg .stars2 {
        background-image:
          radial-gradient(2px 2px at 10% 80%, rgba(255,255,255,.4) 0, rgba(255,255,255,0) 60%),
          radial-gradient(2px 2px at 55% 45%, rgba(255,255,255,.5) 0, rgba(255,255,255,0) 60%),
          radial-gradient(3px 3px at 75% 25%, rgba(255,255,255,.35) 0, rgba(255,255,255,0) 60%);
        animation: drift2 180s linear infinite;
        opacity: .25;
      }
      /* soft nebula */
      #space-bg .nebula {
        background: radial-gradient(600px 400px at 20% 30%, rgba(147,197,253,.12), rgba(0,0,0,0) 60%),
                    radial-gradient(700px 500px at 80% 70%, rgba(192,132,252,.10), rgba(0,0,0,0) 60%),
                    radial-gradient(500px 350px at 60% 20%, rgba(110,231,183,.08), rgba(0,0,0,0) 60%);
        animation: float 60s ease-in-out infinite alternate;
        filter: blur(1px);
      }
      @keyframes drift1 { from { transform: translate3d(0,0,0);} to { transform: translate3d(-200px,-150px,0);} }
      @keyframes drift2 { from { transform: translate3d(0,0,0);} to { transform: translate3d(150px,120px,0);} }
      @keyframes float  { from { transform: translate3d(0,0,0) scale(1);} to { transform: translate3d(0,-30px,0) scale(1.05);} }

      .main-header {
        font-size: 2.5rem; font-weight: 700; text-align: center; margin: 0 0 2rem 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        letter-spacing: -0.02em;
        text-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }
      .metric-card {
        background: rgba(255,255,255,0.05);
        backdrop-filter: blur(10px);
        padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
      }
      .prediction-result { 
        padding: 2rem; border-radius: 20px; text-align: center;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      }
      .success { 
        border: 1px solid rgba(34, 197, 94, 0.3); 
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
        box-shadow: 0 8px 32px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255,255,255,0.1);
      }
      .warning { 
        border: 1px solid rgba(245, 158, 11, 0.3); 
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
        box-shadow: 0 8px 32px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255,255,255,0.1);
      }
      .danger  { 
        border: 1px solid rgba(239, 68, 68, 0.3); 
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
        box-shadow: 0 8px 32px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255,255,255,0.1);
      }

      
     
      
    </style>
    """,
    unsafe_allow_html=True,
)

# background layers container
st.markdown(
    """
    <div id="space-bg">
      <div class="stars"></div>
      <div class="stars2"></div>
      <div class="nebula"></div>
    </div>
    """,
    unsafe_allow_html=True,
)

# Use dark template for Plotly visuals by default
px.defaults.template = "plotly_dark"
pio.templates.default = "plotly_dark"

# API Configuration
API_BASE_URL = "http://localhost:5001"

def check_api_health():
    """Check if the API is running"""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def get_model_info():
    """Get model information from API"""
    try:
        response = requests.get(f"{API_BASE_URL}/model_info")
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None

def predict_single(data):
    """Make single prediction via API"""
    try:
        response = requests.post(f"{API_BASE_URL}/predict", json=data)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": response.json().get("error", "Unknown error")}
    except Exception as e:
        return {"error": f"API connection error: {str(e)}"}

def predict_batch(file):
    """Make batch prediction via API"""
    try:
        files = {"file": file}
        response = requests.post(f"{API_BASE_URL}/predict_batch", files=files)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": response.json().get("error", "Unknown error")}
    except Exception as e:
        return {"error": f"API connection error: {str(e)}"}

def create_feature_importance_chart(feature_importance):
    """Create feature importance visualization"""
    fig = px.bar(
        x=list(feature_importance.values()),
        y=list(feature_importance.keys()),
        orientation='h',
        title="Feature Importance",
        labels={'x': 'Importance', 'y': 'Features'},
        color=list(feature_importance.values()),
        color_continuous_scale='Blues'
    )
    fig.update_layout(height=400, showlegend=False)
    return fig

def create_prediction_probability_chart(probabilities):
    """Create prediction probability chart"""
    fig = go.Figure(data=[
        go.Bar(
            x=list(probabilities.keys()),
            y=list(probabilities.values()),
            marker_color=['#dc3545', '#ffc107', '#28a745']
        )
    ])
    fig.update_layout(
        title="Prediction Probabilities",
        xaxis_title="Classification",
        yaxis_title="Probability",
        height=300
    )
    return fig

# ---------------------------------- 3D PLANET POLISH ----------------------------------
def create_3d_planet(prediction_result, planetary_radius, stellar_radius, equilibrium_temp):
    """Create 3D planet visualization based on prediction"""
    
    class_name = prediction_result['class_name']
    confidence = prediction_result['confidence']
    
    # Define planet properties based on classification
    if class_name == 'CONFIRMED':
        planet_color = '#4CAF50'  # Green for confirmed
        planet_texture = 'earth-like'
        atmosphere = True
        rings = False
    elif class_name == 'CANDIDATE':
        planet_color = '#FFC107'  # Yellow for candidate
        planet_texture = 'rocky'
        atmosphere = False
        rings = True
    else:  # FALSE POSITIVE
        planet_color = '#F44336'  # Red for false positive
        planet_texture = 'asteroid'
        atmosphere = False
        rings = False
    
    # Scale planet size based on planetary radius (Earth radii)
    planet_size = max(0.5, min(3.0, planetary_radius))  # Scale between 0.5 and 3.0
    
    # Create 3D sphere for planet
    phi = np.linspace(0, 2*np.pi, 50)
    theta = np.linspace(0, np.pi, 50)
    
    x_sphere = planet_size * np.outer(np.cos(phi), np.sin(theta))
    y_sphere = planet_size * np.outer(np.sin(phi), np.sin(theta))
    z_sphere = planet_size * np.outer(np.ones(np.size(phi)), np.cos(theta))
    
    # Create surface with texture effect
    if planet_texture == 'earth-like':
        # Add continents-like patterns
        texture = np.sin(3*x_sphere) * np.cos(2*y_sphere) * np.sin(4*z_sphere) * 0.1
    elif planet_texture == 'rocky':
        # Add rocky surface patterns
        texture = np.sin(5*x_sphere) * np.cos(3*y_sphere) * np.sin(6*z_sphere) * 0.15
    else:  # asteroid
        # Add rough asteroid surface
        texture = np.sin(8*x_sphere) * np.cos(6*y_sphere) * np.sin(10*z_sphere) * 0.2
    
    x_surface = x_sphere + texture
    y_surface = y_sphere + texture
    z_surface = z_sphere + texture
    
    # Create the 3D plot
    fig = go.Figure()
    
    # Build a simple mono-hue colorscale for subtle shading
    def _shade(hex_color, f):
        hc = hex_color.lstrip('#')
        r,g,b = int(hc[0:2],16), int(hc[2:4],16), int(hc[4:6],16)
        r = max(0,min(255,int(r*f))); g = max(0,min(255,int(g*f))); b = max(0,min(255,int(b*f)))
        return f"rgb({r},{g},{b})"

    colorscale = [
        [0.0, _shade(planet_color, 0.5)],
        [0.5, _shade(planet_color, 0.9)],
        [1.0, _shade(planet_color, 1.2)],
    ]
    # Normalize texture for surfacecolor
    tmin, tmax = texture.min(), texture.max()
    tnorm = (texture - tmin) / (tmax - tmin + 1e-9)

    # Provide hover info via customdata
    custom = np.stack([
        np.full_like(tnorm, planetary_radius, dtype=float),
        np.full_like(tnorm, equilibrium_temp, dtype=float),
        np.full_like(tnorm, stellar_radius, dtype=float),
    ], axis=-1)
    fig.add_trace(
        go.Surface(
            x=x_surface, y=y_surface, z=z_surface,
            surfacecolor=tnorm,
            colorscale=colorscale,
            opacity=0.95,
            lighting=dict(ambient=0.4, diffuse=0.8, specular=0.5, roughness=0.6, fresnel=0.2),
            lightposition=dict(x=8, y=3, z=5),
            name=class_name, showscale=False,
            customdata=custom,
            hovertemplate=(
                "<b>Planet Surface</b><br>"
                "Radius: %{customdata[0]:.2f} Re<br>"
                "Equilibrium T: %{customdata[1]:.0f} K<br>"
                "Host Star Radius: %{customdata[2]:.2f} Rs<br>"
                "<extra></extra>"
            ),
        )
    )
    
    # Add atmosphere if present
    if atmosphere:
        atmosphere_size = planet_size * 1.2
        x_atm = atmosphere_size * np.outer(np.cos(phi), np.sin(theta))
        y_atm = atmosphere_size * np.outer(np.sin(phi), np.sin(theta))
        z_atm = atmosphere_size * np.outer(np.ones(np.size(phi)), np.cos(theta))
        
        fig.add_trace(
            go.Surface(
                x=x_atm, y=y_atm, z=z_atm,
                surfacecolor=np.ones_like(x_atm),
                colorscale=[[0,'rgba(147,197,253,0.15)'],[1,'rgba(147,197,253,0.05)']],
                opacity=0.35, showscale=False, name='Atmosphere',
            )
        )
    
    # Add rings for gas giants/candidates
    if rings:
        ring_radius = planet_size * 1.5
        ring_phi = np.linspace(0, 2*np.pi, 100)
        ring_x = ring_radius * np.cos(ring_phi)
        ring_y = ring_radius * np.sin(ring_phi)
        ring_z = np.zeros_like(ring_phi)
        
        # Draw multiple concentric ring lines for thickness effect
        for f in [1.0, 0.92, 0.84, 0.76]:
            rx = (ring_radius*f) * np.cos(ring_phi)
            ry = (ring_radius*f) * np.sin(ring_phi)
            fig.add_trace(
                go.Scatter3d(
                    x=rx, y=ry, z=ring_z,
                    mode='lines', line=dict(color='rgba(192,192,192,0.6)', width=2), name='Rings'
                )
            )
    
    # Add star in background
    star_size = stellar_radius * 0.5
    fig.add_trace(
        go.Scatter3d(
            x=[8], y=[0], z=[0],
            mode='markers',
            marker=dict(size=max(6, star_size*9), color='#ffd166', opacity=0.9),
            name='Host Star'
        )
    )
    
    # Update layout
    fig.update_layout(
        title=f"{class_name} Planet<br>Confidence: {confidence:.1%}<br>Radius: {planetary_radius:.1f} Earth radii",
        scene=dict(
            xaxis=dict(showbackground=False, showticklabels=False, title=""),
            yaxis=dict(showbackground=False, showticklabels=False, title=""),
            zaxis=dict(showbackground=False, showticklabels=False, title=""),
            camera=dict(
                eye=dict(x=1.5, y=1.5, z=1.5)
            ),
            aspectmode='cube'
        ),
        showlegend=True,
        height=560,
        margin=dict(l=0, r=0, t=50, b=0)
    )
    
    return fig

# ---------------------------------- HOME CTA BUTTONS ----------------------------------
def show_home_page(model_info):
    """Display home page with model overview"""
    
    st.header("Welcome to the Kepler Exoplanet Classifier")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Model Overview")
        st.markdown(f"""
        <div class="metric-card">
            <h4>Model Type</h4>
            <p>{model_info['model_info']['name']}</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown(f"""
        <div class="metric-card">
            <h4>Accuracy</h4>
            <p>{model_info['model_info']['accuracy']:.1%}</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown(f"""
        <div class="metric-card">
            <h4>ROC AUC Score</h4>
            <p>{model_info['model_info']['roc_auc']:.3f}</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.subheader("Classification Categories")
        categories = model_info['class_labels']
        
        for class_id, class_name in categories.items():
            if class_id == 1:
                color = "success"
                icon = "CONFIRMED"
            elif class_id == 0:
                color = "warning"
                icon = "CANDIDATE"
            else:
                color = "danger"
                icon = "FALSE POSITIVE"
            
            st.markdown(f"""
            <div class="metric-card {color}">
                <h4>{class_name}</h4>
                <p>Class ID: {class_id}</p>
            </div>
            """, unsafe_allow_html=True)
    
    st.subheader("Required Features")
    st.info("The model requires the following 12 features for prediction:")
    
    feature_cols = st.columns(3)
    features = model_info['model_info']['features']
    
    for i, feature in enumerate(features):
        with feature_cols[i % 3]:
            st.write(f"• {feature}")

    st.markdown("\n")

def show_single_prediction_page(model_info):
    """Display single prediction form"""
    
    st.header("Single Exoplanet Prediction")
    
    st.markdown("Enter the planetary and stellar parameters to classify an exoplanet:")
    
    # Create form
    with st.form("prediction_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Planetary Parameters")
            koi_period = st.number_input(
                "Orbital Period (days)", 
                min_value=0.1, 
                max_value=100000.0, 
                value=10.0,
                help="Time for planet to orbit its star"
            )
            koi_duration = st.number_input(
                "Transit Duration (hours)", 
                min_value=0.1, 
                max_value=100.0, 
                value=3.0,
                help="Duration of planetary transit"
            )
            koi_depth = st.number_input(
                "Transit Depth (ppm)", 
                min_value=0.0, 
                max_value=1000000.0, 
                value=1000.0,
                help="Brightness decrease during transit"
            )
            koi_prad = st.number_input(
                "Planetary Radius (Earth radii)", 
                min_value=0.1, 
                max_value=1000.0, 
                value=2.0,
                help="Planet size relative to Earth"
            )
            koi_impact = st.number_input(
                "Impact Parameter", 
                min_value=0.0, 
                max_value=1.0, 
                value=0.5,
                help="Orbital alignment parameter"
            )
            koi_model_snr = st.number_input(
                "Model Signal-to-Noise Ratio", 
                min_value=0.0, 
                max_value=1000.0, 
                value=10.0,
                help="Signal strength relative to noise"
            )
        
        with col2:
            st.subheader("Stellar Parameters")
            koi_srad = st.number_input(
                "Stellar Radius (Solar radii)", 
                min_value=0.1, 
                max_value=1000.0, 
                value=1.0,
                help="Star size relative to Sun"
            )
            koi_teq = st.number_input(
                "Equilibrium Temperature (K)", 
                min_value=10.0, 
                max_value=10000.0, 
                value=500.0,
                help="Planet's theoretical temperature"
            )
            koi_insol = st.number_input(
                "Insolation Flux (Earth flux)", 
                min_value=0.0, 
                max_value=10000.0, 
                value=1.0,
                help="Stellar energy received by planet"
            )
            koi_steff = st.number_input(
                "Stellar Effective Temperature (K)", 
                min_value=1000.0, 
                max_value=10000.0, 
                value=6000.0,
                help="Star's surface temperature"
            )
            koi_slogg = st.number_input(
                "Stellar Surface Gravity (log10 cm/s²)", 
                min_value=0.0, 
                max_value=10.0, 
                value=4.4,
                help="Star's gravitational acceleration"
            )
            koi_kepmag = st.number_input(
                "Kepler Magnitude", 
                min_value=0.0, 
                max_value=20.0, 
                value=15.0,
                help="Star's brightness in Kepler band"
            )
        
        submitted = st.form_submit_button("Classify Exoplanet", use_container_width=True)
        
        if submitted:
            # Prepare input data
            input_data = {
                'koi_period': koi_period,
                'koi_duration': koi_duration,
                'koi_depth': koi_depth,
                'koi_prad': koi_prad,
                'koi_srad': koi_srad,
                'koi_teq': koi_teq,
                'koi_insol': koi_insol,
                'koi_impact': koi_impact,
                'koi_model_snr': koi_model_snr,
                'koi_steff': koi_steff,
                'koi_slogg': koi_slogg,
                'koi_kepmag': koi_kepmag
            }
            
            # Make prediction
            with st.spinner("Making prediction..."):
                result = predict_single(input_data)
            
            if "error" in result:
                st.error(f"Prediction failed: {result['error']}")
            else:
                # Display results
                st.success("Prediction completed successfully")
                
                prediction = result['prediction']
                probabilities = result['probabilities']
                
                # Main result
                col1, col2, col3 = st.columns([1, 2, 1])
                with col2:
                    class_name = prediction['class_name']
                    confidence = prediction['confidence']
                    
                    if prediction['class_id'] == 1:
                        css_class = "success"
                        icon = "CONFIRMED"
                    elif prediction['class_id'] == 0:
                        css_class = "warning"
                        icon = "CANDIDATE"
                    else:
                        css_class = "danger"
                        icon = "FALSE POSITIVE"
                    
                    st.markdown(f"""
                    <div class="prediction-result {css_class}">
                        <h2>{class_name}</h2>
                        <h3>Confidence: {confidence:.1%}</h3>
                    </div>
                    """, unsafe_allow_html=True)
                
                # 3D Planet Visualization
                st.subheader("3D Planet Visualization")
                planet_3d = create_3d_planet(
                    prediction, 
                    input_data['koi_prad'], 
                    input_data['koi_srad'], 
                    input_data['koi_teq']
                )
                st.plotly_chart(planet_3d, use_container_width=True)
                
                # Probability chart
                st.subheader("Prediction Probabilities")
                prob_chart = create_prediction_probability_chart(probabilities)
                st.plotly_chart(prob_chart, use_container_width=True)
                
                # Detailed probabilities
                st.subheader("Detailed Results")
                prob_cols = st.columns(3)
                for i, (class_name, prob) in enumerate(probabilities.items()):
                    with prob_cols[i]:
                        st.metric(class_name, f"{prob:.1%}")
                
                # Planet characteristics
                st.subheader("Planet Characteristics")
                char_cols = st.columns(4)
                with char_cols[0]:
                    st.metric("Planetary Radius", f"{input_data['koi_prad']:.1f} Earth radii")
                with char_cols[1]:
                    st.metric("Orbital Period", f"{input_data['koi_period']:.1f} days")
                with char_cols[2]:
                    st.metric("Equilibrium Temp", f"{input_data['koi_teq']:.0f} K")
                with char_cols[3]:
                    st.metric("Stellar Radius", f"{input_data['koi_srad']:.1f} Solar radii")

def show_batch_prediction_page(model_info):
    """Display batch prediction page"""
    
    st.header("Batch Prediction from CSV")
    
    st.markdown("""
    Upload a CSV file with exoplanet data to classify multiple objects at once.
    The CSV should contain the following columns:
    """)
    
    # Show required columns
    st.code(", ".join(model_info['model_info']['features']), language="text")
    
    # File upload
    uploaded_file = st.file_uploader(
        "Choose a CSV file",
        type="csv",
        help="Upload a CSV file with exoplanet data"
    )
    
    if uploaded_file is not None:
        # Show file preview
        try:
            df_preview = pd.read_csv(uploaded_file)
            st.subheader("File Preview")
            st.write(f"Shape: {df_preview.shape}")
            st.dataframe(df_preview.head())
            
            # Check required columns
            required_cols = model_info['model_info']['features']
            missing_cols = [col for col in required_cols if col not in df_preview.columns]
            
            if missing_cols:
                st.error(f"Missing required columns: {missing_cols}")
            else:
                st.success("All required columns present")
                
                # Make predictions
                if st.button("Classify All Exoplanets", use_container_width=True):
                    with st.spinner("Processing predictions..."):
                        # Reset file pointer
                        uploaded_file.seek(0)
                        result = predict_batch(uploaded_file)
                    
                    if "error" in result:
                        st.error(f"Prediction failed: {result['error']}")
                    else:
                        st.success("Batch prediction completed successfully")
                        
                        # Show summary
                        summary = result['summary']
                        st.subheader("Prediction Summary")
                        
                        col1, col2, col3, col4 = st.columns(4)
                        with col1:
                            st.metric("Total Objects", summary['total_predictions'])
                        
                        for class_name, count in summary['prediction_counts'].items():
                            if class_name == "CONFIRMED":
                                with col2:
                                    st.metric("Confirmed", count)
                            elif class_name == "CANDIDATE":
                                with col3:
                                    st.metric("Candidates", count)
                            elif class_name == "FALSE POSITIVE":
                                with col4:
                                    st.metric("False Positives", count)
                        
                        # Show 3D planet gallery for first few results
                        if len(result['predictions']) <= 5:
                            st.subheader("3D Planet Gallery")
                            planet_cols = st.columns(len(result['predictions']))
                            
                            for i, pred in enumerate(result['predictions']):
                                with planet_cols[i]:
                                    # Get original data for this prediction
                                    if i < len(df_preview):
                                        row_data = df_preview.iloc[i]
                                        planet_3d = create_3d_planet(
                                            pred['prediction'],
                                            row_data.get('koi_prad', 1.0),
                                            row_data.get('koi_srad', 1.0),
                                            row_data.get('koi_teq', 500)
                                        )
                                        st.plotly_chart(planet_3d, use_container_width=True)
                        
                        # Show detailed results
                        st.subheader("Detailed Results")
                        
                        # Create results DataFrame
                        results_data = []
                        for pred in result['predictions']:
                            results_data.append({
                                'Index': pred['index'],
                                'Prediction': pred['prediction']['class_name'],
                                'Confidence': f"{pred['prediction']['confidence']:.1%}",
                                'False Positive': f"{pred['probabilities']['FALSE POSITIVE']:.1%}",
                                'Candidate': f"{pred['probabilities']['CANDIDATE']:.1%}",
                                'Confirmed': f"{pred['probabilities']['CONFIRMED']:.1%}"
                            })
                        
                        results_df = pd.DataFrame(results_data)
                        st.dataframe(results_df, use_container_width=True)
                        
                        # Download results
                        csv = results_df.to_csv(index=False)
                        st.download_button(
                            label="Download Results as CSV",
                            data=csv,
                            file_name=f"kepler_predictions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                            mime="text/csv"
                        )
        
        except Exception as e:
            st.error(f"Error reading file: {str(e)}")

def show_model_performance_page(model_info):
    """Display model performance metrics"""
    
    st.header("Model Performance")
    
    # Model metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Accuracy", f"{model_info['model_info']['accuracy']:.1%}")
    
    with col2:
        st.metric("ROC AUC", f"{model_info['model_info']['roc_auc']:.3f}")
    
    with col3:
        st.metric("CV Score", model_info['model_info']['cv_score'])
    
    with col4:
        st.metric("Features", len(model_info['model_info']['features']))
    
    # Feature importance
    st.subheader("Feature Importance")
    feature_importance = model_info['feature_importance']
    
    importance_chart = create_feature_importance_chart(feature_importance)
    st.plotly_chart(importance_chart, use_container_width=True)
    
    # Model description
    st.subheader("Model Description")
    st.markdown("""
    The Kepler Exoplanet Classifier uses a **Gradient Boosting** algorithm trained on 
    NASA's Kepler Objects of Interest (KOI) dataset. The model analyzes 12 key features 
    of planetary and stellar systems to classify exoplanets into three categories:
    
    - **CONFIRMED**: Validated exoplanets with high confidence
    - **CANDIDATE**: Potential exoplanets requiring further validation  
    - **FALSE POSITIVE**: Objects that are not actual planets
    
    The model achieves **77.3% accuracy** and **0.912 ROC AUC**, making it highly 
    reliable for exoplanet classification tasks.
    """)

# ---------- Public Website Pages (PS dataset) ----------
def load_ps_dataset():
    try:
        df = pd.read_csv('exoplanets_ps.csv')
    except Exception:
        df = pd.DataFrame(columns=['pl_name','hostname','disc_year','discoverymethod','pl_orbper','sy_dist','pl_rade','pl_eqt','ra','dec'])
    # Drop rows without coords
    df = df.dropna(subset=['ra','dec'])
    # Compute habitability index (simple heuristic 0-1)
    df['habit_radius'] = 1 - np.minimum(1, np.abs(df['pl_rade'] - 1.0) / 0.8)
    df['habit_temp'] = 1 - np.minimum(1, np.abs(df['pl_eqt'] - 288) / 150)
    df['habitability'] = (0.5*df['habit_radius'] + 0.5*df['habit_temp']).clip(0,1)
    # Convert RA/Dec to lon/lat
    df['lon'] = df['ra'] - 180.0
    df['lat'] = df['dec']
    return df

def show_3d_map_page():
    st.header("3D Exoplanet Map")
    df = load_ps_dataset()
    if df.empty:
        st.warning("No PS dataset found. Run data fetch step first.")
        return

    # Filters
    colf1, colf2, colf3 = st.columns(3)
    with colf1:
        year_min, year_max = int(df['disc_year'].min()), int(df['disc_year'].max())
        years = st.slider("Discovery Year", year_min, year_max, (max(year_min, year_max-10), year_max))
    with colf2:
        methods = ["All"] + sorted(df['discoverymethod'].dropna().unique().tolist())
        method = st.selectbox("Discovery Method", methods)
    with colf3:
        habit_min = st.slider("Min Habitability", 0.0, 1.0, 0.5, 0.05)

    mask = (df['disc_year'] >= years[0]) & (df['disc_year'] <= years[1]) & (df['habitability'] >= habit_min)
    if method != "All":
        mask &= (df['discoverymethod'] == method)
    dff = df[mask].copy()

    # Side stats
    st.sidebar.subheader("Live Stats")
    st.sidebar.metric("Planets shown", f"{len(dff):,}")
    st.sidebar.metric("Avg Radius (Re)", f"{dff['pl_rade'].mean():.2f}")
    st.sidebar.metric("Avg Distance (pc)", f"{dff['sy_dist'].mean():.0f}")
    st.sidebar.metric("Avg Distance (ly)", f"{dff['sy_dist'].mean() * 3.26:.0f}")
    st.sidebar.caption("Distance from Earth to host star")

    # Deck.gl layer
    color_expr = "[habitability * 255, (1 - habitability) * 180, 200]"
    layer = pdk.Layer(
        "ScatterplotLayer",
        dff,
        get_position='[lon, lat]',
        get_fill_color=color_expr,
        get_radius='(pl_rade || 1) * 15000',
        pickable=True,
        auto_highlight=True,
    )

    tooltip = {
        "html": "<b>{pl_name}</b><br/>Host: {hostname}<br/>Method: {discoverymethod}<br/>Year: {disc_year}<br/>Period: {pl_orbper} d<br/>Distance: {sy_dist} pc<br/>Radius: {pl_rade} Re<br/>Temp: {pl_eqt} K<br/><b>Habitability:</b> {habitability}",
        "style": {"backgroundColor": "#111827", "color": "white"}
    }

    view_state = pdk.ViewState(latitude=0, longitude=0, zoom=0.8)
    r = pdk.Deck(
        layers=[layer], initial_view_state=view_state,
        map_style="mapbox://styles/mapbox/dark-v10", tooltip=tooltip
    )
    st.pydeck_chart(r, use_container_width=True)

    st.caption("Color encodes habitability score (bluer=higher)")

def show_data_insights_page():
    st.header("Exoplanet Data Insights")
    df = load_ps_dataset()
    if df.empty:
        st.warning("No PS dataset found. Run data fetch step first.")
        return

    c1, c2 = st.columns(2)
    with c1:
        by_year = df.groupby('disc_year').size().reset_index(name='count')
        fig = px.bar(by_year, x='disc_year', y='count', title='Discoveries per Year', template='plotly_dark')
        st.plotly_chart(fig, use_container_width=True)
    with c2:
        by_method = df['discoverymethod'].value_counts().reset_index()
        by_method.columns = ['method','count']
        fig2 = px.pie(by_method, names='method', values='count', title='Discovery Methods', template='plotly_dark')
        st.plotly_chart(fig2, use_container_width=True)

    fig3 = px.scatter(
        df.dropna(subset=['pl_rade','pl_orbper']),
        x='pl_orbper', y='pl_rade', color='discoverymethod',
        hover_data=['pl_name','hostname','disc_year'],
        title='Planet Radius vs Orbital Period',
        labels={'pl_orbper':'Orbital Period (days)','pl_rade':'Radius (Re)'},
        template='plotly_dark', log_x=True
    )
    st.plotly_chart(fig3, use_container_width=True)

    # Download CSV
    st.subheader("Download Dataset")
    st.download_button(
        label="Download Exoplanets CSV",
        data=pd.read_csv('exoplanets_ps.csv').to_csv(index=False),
        file_name='exoplanets_ps.csv',
        mime='text/csv'
    )

def show_about_page():
    st.header("About Apollo Reborn")
    st.markdown(
        """
        ### Project Goals
        Apollo Reborn makes exoplanet discovery accessible by blending NASA Open Data with interactive 3D visualizations.
        We combine a classification model (Kepler KOI) with a public-facing globe and rich insights (Exoplanet Archive PS).

        ### Team
        - **Mhammad Dirany** - CCE Student, AUST
        - **Khaled Ajam** - CCE Student, AUST
        - **Debora Khalab** - CSI Student, AUST

        ### Footer
        Created by Team Apollo Reborn - NASA Space Apps Beirut 2025.  
        This site uses NASA Open Data. Not affiliated with NASA.
        """
    )

# ---------------------------------- PLANET BUILDER PAGE ----------------------------------
def show_planet_builder_page():
    st.header("Planet Builder")
    st.markdown("Enter parameters to generate a 3D planet. We’ll classify it and only render the planet if it’s a CONFIRMED exoplanet.")

    api_ok = check_api_health()
    if not api_ok:
        st.error("API not running. Start backend: `python app.py`")
        return

    with st.form("builder_form"):
        c1, c2 = st.columns(2)
        with c1:
            koi_period = st.number_input("Orbital Period (days)", 0.1, 100000.0, 12.3)
            koi_duration = st.number_input("Transit Duration (hours)", 0.05, 100.0, 3.1)
            koi_depth = st.number_input("Transit Depth (ppm)", 0.0, 1_500_000.0, 900.0)
            koi_prad = st.number_input("Planetary Radius (Earth radii)", 0.1, 1000.0, 1.7)
            koi_impact = st.number_input("Impact Parameter", 0.0, 1.0, 0.4)
            koi_model_snr = st.number_input("Model SNR", 0.0, 5000.0, 14.0)
        with c2:
            koi_srad = st.number_input("Stellar Radius (Solar radii)", 0.1, 1000.0, 1.0)
            koi_teq = st.number_input("Equilibrium Temperature (K)", 10.0, 20000.0, 550.0)
            koi_insol = st.number_input("Insolation (Earth flux)", 0.0, 10000.0, 1.1)
            koi_steff = st.number_input("Stellar Teff (K)", 1000.0, 15000.0, 5800.0)
            koi_slogg = st.number_input("Stellar log g", 0.0, 10.0, 4.4)
            koi_kepmag = st.number_input("Kepler Magnitude", 0.0, 25.0, 14.8)

        submitted = st.form_submit_button("Generate & Classify", use_container_width=True)

    if submitted:
        payload = {
            'koi_period': koi_period,
            'koi_duration': koi_duration,
            'koi_depth': koi_depth,
            'koi_prad': koi_prad,
            'koi_srad': koi_srad,
            'koi_teq': koi_teq,
            'koi_insol': koi_insol,
            'koi_impact': koi_impact,
            'koi_model_snr': koi_model_snr,
            'koi_steff': koi_steff,
            'koi_slogg': koi_slogg,
            'koi_kepmag': koi_kepmag,
        }
        with st.spinner("Classifying..."):
            res = predict_single(payload)
        if "error" in res:
            st.error(f"Classification failed: {res['error']}")
        else:
            pred = res['prediction']
            probs = res['probabilities']
            cols = st.columns(3)
            with cols[0]: st.metric("Prediction", pred['class_name'])
            with cols[1]: st.metric("Confidence", f"{pred['confidence']:.1%}")
            with cols[2]: st.metric("Planet Radius", f"{koi_prad:.2f} Re")

            if pred['class_id'] == 1:
                st.success("CONFIRMED - rendering 3D planet. Hover the surface for details.")
                fig = create_3d_planet(pred, koi_prad, koi_srad, koi_teq)
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.warning("Not confirmed - 3D planet not rendered. Adjust parameters and try again.")

    st.divider()
    st.subheader("Upload CSV to Generate Multiple Planets")
    st.caption("Headers required: koi_period,koi_duration,koi_depth,koi_prad,koi_srad,koi_teq,koi_insol,koi_impact,koi_model_snr,koi_steff,koi_slogg,koi_kepmag")
    uploaded = st.file_uploader("Choose a CSV file", type=["csv"]) 
    if uploaded is not None:
        try:
            df = pd.read_csv(uploaded)
        except Exception as e:
            st.error(f"Failed to read CSV: {e}")
            return

        required = [
            'koi_period','koi_duration','koi_depth','koi_prad','koi_srad','koi_teq',
            'koi_insol','koi_impact','koi_model_snr','koi_steff','koi_slogg','koi_kepmag'
        ]
        missing = [c for c in required if c not in df.columns]
        if missing:
            st.error(f"Missing required columns: {missing}")
            return

        st.write(f"Rows: {len(df)}")
        st.dataframe(df.head(), use_container_width=True)

        if st.button("Classify & Render", use_container_width=True):
            results = []
            figs = []
            with st.spinner("Processing..."):
                for idx, row in df.iterrows():
                    payload = {k: float(row[k]) for k in required}
                    res = predict_single(payload)
                    if "error" in res:
                        results.append({"row": idx, "status": "error", "message": res["error"]})
                        continue
                    pred = res['prediction']
                    results.append({
                        "row": idx,
                        "prediction": pred['class_name'],
                        "confidence": pred['confidence']
                    })
                    if pred['class_id'] == 1 and len(figs) < 6:
                        figs.append(create_3d_planet(pred, row['koi_prad'], row['koi_srad'], row['koi_teq']))

            # Render up to 6 confirmed planets
            if figs:
                st.subheader("Confirmed Planets (Preview)")
                cols = st.columns(3)
                for i, fig in enumerate(figs):
                    with cols[i % 3]:
                        st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No CONFIRMED planets in this batch.")

            res_df = pd.DataFrame(results)
            st.subheader("Results")
            st.dataframe(res_df, use_container_width=True)
            st.download_button(
                label="Download Results CSV",
                data=res_df.to_csv(index=False),
                file_name="planet_builder_results.csv",
                mime="text/csv"
            )

def main():
    st.markdown('<h1 class="main-header">Kepler Exoplanet Classifier</h1>', unsafe_allow_html=True)

    # Ensure backend is up for ML pages, but allow public pages to load regardless
    api_ok = check_api_health()

    st.sidebar.title("Navigation")
    page = st.sidebar.radio(
        "Navigation",
        [
            "Home",
            "Single Prediction",
            "Batch Prediction",
            "Model Performance",
            "3D Map",
            "Data Insights",
            "Planet Builder",
            "About",
        ],
    )

    model_info = None
    if page in {"Home", "Single Prediction", "Batch Prediction", "Model Performance"}:
        if not api_ok:
            st.error("API is not running. Please start the Flask backend: `python app.py`")
            st.info("💡 **Quick Fix:** The API needs to be running on port 5001. Make sure no other services are using this port.")
            # Allow user to navigate to public pages
            with st.sidebar:
                st.info("Public pages are available below")
        else:
            model_info = get_model_info()
            if not model_info:
                st.error("Failed to load model information from API")

    if page == "Home":
        if model_info:
            show_home_page(model_info)
        else:
            st.info("Model info unavailable. You can still explore the public pages from the sidebar.")
    elif page == "Single Prediction":
        if model_info:
            show_single_prediction_page(model_info)
    elif page == "Batch Prediction":
        if model_info:
            show_batch_prediction_page(model_info)
    elif page == "Model Performance":
        if model_info:
            show_model_performance_page(model_info)
    elif page == "3D Map":
        show_3d_map_page()
    elif page == "Data Insights":
        show_data_insights_page()
    elif page == "Planet Builder":
        show_planet_builder_page()
    elif page == "About":
        show_about_page()

if __name__ == "__main__":
    main()
