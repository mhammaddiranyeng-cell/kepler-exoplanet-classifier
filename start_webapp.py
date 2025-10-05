#!/usr/bin/env python3
"""
Kepler Exoplanet Classifier Web App Launcher
This script starts both the Flask backend and Streamlit frontend
"""

import subprocess
import sys
import time
import webbrowser
from threading import Thread
import os

def start_flask_backend():
    """Start the Flask backend server"""
    print("🚀 Starting Flask backend...")
    try:
        subprocess.run([sys.executable, "app.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Flask backend failed to start: {e}")
    except KeyboardInterrupt:
        print("🛑 Flask backend stopped")

def start_streamlit_frontend():
    """Start the Streamlit frontend"""
    print("🚀 Starting Streamlit frontend...")
    try:
        # Wait a bit for Flask to start
        time.sleep(3)
        
        # Open browser after another delay
        def open_browser():
            time.sleep(5)
            webbrowser.open("http://localhost:8501")
        
        browser_thread = Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        # Start Streamlit
        subprocess.run([
            sys.executable, "-m", "streamlit", "run", "streamlit_app.py",
            "--server.port", "8501",
            "--server.address", "localhost"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Streamlit frontend failed to start: {e}")
    except KeyboardInterrupt:
        print("🛑 Streamlit frontend stopped")

def main():
    """Main launcher function"""
    print("🔭 Kepler Exoplanet Classifier Web App")
    print("=" * 50)
    
    # Check if required files exist
    required_files = ["app.py", "streamlit_app.py", "best_model.pkl", "kepler_processed.csv"]
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        print("Please ensure all files are present before starting the web app.")
        return
    
    print("✅ All required files found!")
    print("\n📋 Starting components:")
    print("   - Flask Backend: http://localhost:5000")
    print("   - Streamlit Frontend: http://localhost:8501")
    print("\n⏳ Starting in 3 seconds...")
    print("   Press Ctrl+C to stop both servers")
    
    time.sleep(3)
    
    try:
        # Start Flask backend in a separate thread
        flask_thread = Thread(target=start_flask_backend)
        flask_thread.daemon = True
        flask_thread.start()
        
        # Start Streamlit frontend (main thread)
        start_streamlit_frontend()
        
    except KeyboardInterrupt:
        print("\n🛑 Web app stopped by user")
    except Exception as e:
        print(f"❌ Error starting web app: {e}")

if __name__ == "__main__":
    main()

