#!/usr/bin/env python3
"""
Demo script to show 3D planet visualizations
This shows what the 3D planets look like for different classifications
"""

import pandas as pd
import numpy as np
import plotly.graph_objects as go
from datetime import datetime

def create_3d_planet_demo(class_name, planetary_radius, stellar_radius, equilibrium_temp):
    """Create 3D planet visualization demo"""
    
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
    
    # Scale planet size based on planetary radius
    planet_size = max(0.5, min(3.0, planetary_radius))
    
    # Create 3D sphere for planet
    phi = np.linspace(0, 2*np.pi, 50)
    theta = np.linspace(0, np.pi, 50)
    
    x_sphere = planet_size * np.outer(np.cos(phi), np.sin(theta))
    y_sphere = planet_size * np.outer(np.sin(phi), np.sin(theta))
    z_sphere = planet_size * np.outer(np.ones(np.size(phi)), np.cos(theta))
    
    # Create surface with texture effect
    if planet_texture == 'earth-like':
        texture = np.sin(3*x_sphere) * np.cos(2*y_sphere) * np.sin(4*z_sphere) * 0.1
    elif planet_texture == 'rocky':
        texture = np.sin(5*x_sphere) * np.cos(3*y_sphere) * np.sin(6*z_sphere) * 0.15
    else:  # asteroid
        texture = np.sin(8*x_sphere) * np.cos(6*y_sphere) * np.sin(10*z_sphere) * 0.2
    
    x_surface = x_sphere + texture
    y_surface = y_sphere + texture
    z_surface = z_sphere + texture
    
    # Create the 3D plot
    fig = go.Figure()
    
    # Add planet surface
    fig.add_trace(go.Surface(
        x=x_surface,
        y=y_surface,
        z=z_surface,
        colorscale=[[0, planet_color], [1, planet_color]],
        opacity=0.8,
        name=class_name,
        showscale=False
    ))
    
    # Add atmosphere if present
    if atmosphere:
        atmosphere_size = planet_size * 1.2
        x_atm = atmosphere_size * np.outer(np.cos(phi), np.sin(theta))
        y_atm = atmosphere_size * np.outer(np.sin(phi), np.sin(theta))
        z_atm = atmosphere_size * np.outer(np.ones(np.size(phi)), np.cos(theta))
        
        fig.add_trace(go.Surface(
            x=x_atm,
            y=y_atm,
            z=z_atm,
            colorscale=[[0, 'rgba(135, 206, 235, 0.3)'], [1, 'rgba(135, 206, 235, 0.1)']],
            opacity=0.3,
            name='Atmosphere',
            showscale=False
        ))
    
    # Add rings for gas giants/candidates
    if rings:
        ring_radius = planet_size * 1.5
        ring_phi = np.linspace(0, 2*np.pi, 100)
        ring_x = ring_radius * np.cos(ring_phi)
        ring_y = ring_radius * np.sin(ring_phi)
        ring_z = np.zeros_like(ring_phi)
        
        fig.add_trace(go.Scatter3d(
            x=ring_x,
            y=ring_y,
            z=ring_z,
            mode='lines',
            line=dict(color='#C0C0C0', width=3),
            name='Rings'
        ))
    
    # Add star in background
    star_size = stellar_radius * 0.5
    fig.add_trace(go.Scatter3d(
        x=[8], y=[0], z=[0],
        mode='markers',
        marker=dict(
            size=star_size * 10,
            color='#FFD700',
            opacity=0.6,
            symbol='diamond'
        ),
        name='Host Star'
    ))
    
    # Update layout
    fig.update_layout(
        title=f"🌍 {class_name} Planet<br>Radius: {planetary_radius:.1f} Earth radii<br>Temp: {equilibrium_temp:.0f} K",
        scene=dict(
            xaxis=dict(showbackground=False, showticklabels=False, title=""),
            yaxis=dict(showbackground=False, showticklabels=False, title=""),
            zaxis=dict(showbackground=False, showticklabels=False, title=""),
            camera=dict(eye=dict(x=1.5, y=1.5, z=1.5)),
            aspectmode='cube'
        ),
        showlegend=True,
        height=500,
        margin=dict(l=0, r=0, t=50, b=0)
    )
    
    return fig

def main():
    print("🌍 3D Planet Visualization Demo")
    print("=" * 50)
    
    # Demo planets for each classification
    demo_planets = [
        ("CONFIRMED", 1.2, 0.95, 288),      # Earth-like
        ("CONFIRMED", 3.8, 1.1, 650),       # Super-Earth
        ("CANDIDATE", 8.5, 1.3, 1200),      # Gas giant
        ("FALSE POSITIVE", 0.3, 0.8, 1800), # Asteroid
        ("CANDIDATE", 5.2, 0.9, 450)        # Neptune-like
    ]
    
    for i, (class_name, radius, star_radius, temp) in enumerate(demo_planets):
        print(f"\n{i+1}. Creating {class_name} planet...")
        fig = create_3d_planet_demo(class_name, radius, star_radius, temp)
        fig.write_html(f"demo_planet_{class_name.lower().replace(' ', '_')}_{i+1}.html")
        print(f"   Saved as: demo_planet_{class_name.lower().replace(' ', '_')}_{i+1}.html")
    
    print(f"\n✅ Demo completed! Check the HTML files to see 3D planets.")
    print("🌐 Open them in your browser to interact with the 3D models!")

if __name__ == "__main__":
    main()

