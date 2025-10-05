#!/usr/bin/env python3
"""
Kepler KOI Dataset Preprocessing Pipeline
Step 2: Preprocess the Data for Machine Learning

This script implements the complete preprocessing pipeline:
1. Load the dataset
2. Drop unnecessary columns
3. Handle missing values
4. Normalize numerical features
5. Encode categorical labels
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

class KeplerPreprocessor:
    """Complete preprocessing pipeline for Kepler KOI dataset"""
    
    def __init__(self, dataset_path='kepler_koi_dataset.csv'):
        """
        Initialize the preprocessor
        
        Args:
            dataset_path (str): Path to the Kepler KOI dataset
        """
        self.dataset_path = dataset_path
        self.raw_data = None
        self.processed_data = None
        self.feature_columns = None
        self.target_column = None
        self.scaler = None
        self.label_encoder = None
        
        # Define columns to keep for analysis
        self.feature_columns_to_keep = [
            'koi_period',           # Orbital period (days)
            'koi_duration',         # Transit duration (hours)
            'koi_depth',            # Transit depth (ppm)
            'koi_prad',             # Planetary radius (Earth radii)
            'koi_srad',             # Stellar radius (Solar radii)
            'koi_teq',              # Equilibrium temperature (K)
            'koi_insol',            # Insolation flux (Earth flux)
            'koi_impact',           # Impact parameter
            'koi_model_snr',        # Model signal-to-noise ratio
            'koi_steff',            # Stellar effective temperature (K)
            'koi_slogg',            # Stellar surface gravity (log10(cm/s²))
            'koi_kepmag'            # Kepler magnitude
        ]
        
        # Define target column
        self.target_column = 'koi_disposition'
        
        # Label mapping for encoding
        self.label_mapping = {
            'CONFIRMED': 1,
            'CANDIDATE': 0,
            'FALSE POSITIVE': -1
        }
    
    def load_dataset(self):
        """Step 1: Load the dataset into Python"""
        print("🔄 Step 1: Loading dataset...")
        
        try:
            self.raw_data = pd.read_csv(self.dataset_path)
            print(f"✅ Dataset loaded successfully!")
            print(f"   Shape: {self.raw_data.shape}")
            print(f"   Columns: {len(self.raw_data.columns)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error loading dataset: {e}")
            return False
    
    def drop_columns(self):
        """Step 2: Drop unnecessary columns (names/IDs)"""
        print("\n🔄 Step 2: Dropping unnecessary columns...")
        
        if self.raw_data is None:
            print("❌ No data loaded. Please run load_dataset() first.")
            return False
        
        # Columns to drop (names, IDs, and non-feature columns)
        columns_to_drop = [
            'kepid',                # Kepler ID
            'kepoi_name',           # KOI name
            'kepler_name',          # Kepler name
            'ra_str',               # Right ascension (string)
            'dec_str',              # Declination (string)
            'koi_tce_plnt_num',     # TCE planet number
            'koi_tce_delivname',    # TCE delivery name
            'koi_period_err1',      # Period error 1
            'koi_period_err2',      # Period error 2
            'koi_time0bk',          # Time of first transit
            'koi_time0bk_err1',     # Time error 1
            'koi_time0bk_err2',     # Time error 2
            'koi_impact_err1',      # Impact error 1
            'koi_impact_err2',      # Impact error 2
            'koi_duration_err1',    # Duration error 1
            'koi_duration_err2',    # Duration error 2
            'koi_depth_err1',       # Depth error 1
            'koi_depth_err2',       # Depth error 2
            'koi_prad_err1',        # Planetary radius error 1
            'koi_prad_err2',        # Planetary radius error 2
            'koi_teq_err1',         # Temperature error 1
            'koi_teq_err2',         # Temperature error 2
            'koi_insol_err1',       # Insolation error 1
            'koi_insol_err2',       # Insolation error 2
            'koi_steff_err1',       # Stellar temperature error 1
            'koi_steff_err2',       # Stellar temperature error 2
            'koi_slogg_err1',       # Stellar gravity error 1
            'koi_slogg_err2',       # Stellar gravity error 2
            'koi_srad_err1',        # Stellar radius error 1
            'koi_srad_err2',        # Stellar radius error 2
            'koi_kepmag_err',       # Kepler magnitude error
            'koi_score',            # KOI score
            'koi_pdisposition',     # Previous disposition
            'koi_fpflag_nt',        # False positive flag - not transit-like
            'koi_fpflag_ss',        # False positive flag - stellar eclipse
            'koi_fpflag_co',        # False positive flag - centroid offset
            'koi_fpflag_ec'         # False positive flag - ephemeris match
        ]
        
        # Keep only the columns we want for analysis
        available_feature_columns = [col for col in self.feature_columns_to_keep 
                                   if col in self.raw_data.columns]
        
        # Create the processed dataset with selected columns + target
        columns_to_keep = available_feature_columns + [self.target_column]
        
        self.processed_data = self.raw_data[columns_to_keep].copy()
        
        print(f"✅ Columns dropped successfully!")
        print(f"   Original columns: {len(self.raw_data.columns)}")
        print(f"   Remaining columns: {len(self.processed_data.columns)}")
        print(f"   Feature columns: {available_feature_columns}")
        
        self.feature_columns = available_feature_columns
        
        return True
    
    def handle_missing_values(self, strategy='drop'):
        """
        Step 3: Handle missing values
        
        Args:
            strategy (str): 'drop' to remove rows with missing values,
                          'impute' to fill missing values with median/mean
        """
        print(f"\n🔄 Step 3: Handling missing values (strategy: {strategy})...")
        
        if self.processed_data is None:
            print("❌ No processed data available. Please run drop_columns() first.")
            return False
        
        # Check missing values before processing
        missing_before = self.processed_data.isnull().sum()
        total_missing_before = missing_before.sum()
        
        print(f"   Missing values before processing:")
        for col, missing_count in missing_before.items():
            if missing_count > 0:
                percentage = (missing_count / len(self.processed_data)) * 100
                print(f"     {col}: {missing_count} ({percentage:.1f}%)")
        
        if strategy == 'drop':
            # Drop rows with any missing values
            self.processed_data = self.processed_data.dropna()
            
        elif strategy == 'impute':
            # Impute missing values with median for numerical columns
            for col in self.feature_columns:
                if self.processed_data[col].isnull().any():
                    median_val = self.processed_data[col].median()
                    self.processed_data[col].fillna(median_val, inplace=True)
                    print(f"     Imputed {col} with median: {median_val:.3f}")
        
        # Check missing values after processing
        missing_after = self.processed_data.isnull().sum().sum()
        
        print(f"✅ Missing values handled successfully!")
        print(f"   Missing values before: {total_missing_before}")
        print(f"   Missing values after: {missing_after}")
        print(f"   Rows removed: {len(self.raw_data) - len(self.processed_data)}")
        print(f"   Final dataset shape: {self.processed_data.shape}")
        
        return True
    
    def normalize_features(self, method='standard'):
        """
        Step 4: Normalize numerical features
        
        Args:
            method (str): 'standard' for StandardScaler, 'minmax' for MinMaxScaler
        """
        print(f"\n🔄 Step 4: Normalizing numerical features (method: {method})...")
        
        if self.processed_data is None:
            print("❌ No processed data available. Please run previous steps first.")
            return False
        
        if method == 'standard':
            self.scaler = StandardScaler()
            print("   Using StandardScaler (mean=0, std=1)")
        elif method == 'minmax':
            self.scaler = MinMaxScaler()
            print("   Using MinMaxScaler (range=[0,1])")
        else:
            print("❌ Invalid method. Use 'standard' or 'minmax'.")
            return False
        
        # Fit and transform the features
        feature_data = self.processed_data[self.feature_columns].copy()
        
        # Store original statistics for reference
        self.original_stats = {
            'mean': feature_data.mean(),
            'std': feature_data.std(),
            'min': feature_data.min(),
            'max': feature_data.max()
        }
        
        # Apply normalization
        normalized_features = self.scaler.fit_transform(feature_data)
        
        # Update the processed data with normalized features
        for i, col in enumerate(self.feature_columns):
            self.processed_data[col] = normalized_features[:, i]
        
        print(f"✅ Features normalized successfully!")
        print(f"   Normalized features: {len(self.feature_columns)}")
        print(f"   Normalization method: {method}")
        
        return True
    
    def encode_labels(self):
        """Step 5: Encode categorical labels"""
        print("\n🔄 Step 5: Encoding categorical labels...")
        
        if self.processed_data is None:
            print("❌ No processed data available. Please run previous steps first.")
            return False
        
        # Check current label distribution
        print("   Original label distribution:")
        label_counts = self.processed_data[self.target_column].value_counts()
        for label, count in label_counts.items():
            percentage = (count / len(self.processed_data)) * 100
            print(f"     {label}: {count} ({percentage:.1f}%)")
        
        # Apply label encoding
        self.processed_data[self.target_column] = self.processed_data[self.target_column].map(self.label_mapping)
        
        # Verify encoding
        print("\n   Encoded label distribution:")
        encoded_counts = self.processed_data[self.target_column].value_counts().sort_index()
        for encoded_label, count in encoded_counts.items():
            original_label = [k for k, v in self.label_mapping.items() if v == encoded_label][0]
            percentage = (count / len(self.processed_data)) * 100
            print(f"     {original_label} ({encoded_label}): {count} ({percentage:.1f}%)")
        
        print(f"✅ Labels encoded successfully!")
        print(f"   Encoding mapping: {self.label_mapping}")
        
        return True
    
    def create_train_test_split(self, test_size=0.2, random_state=42):
        """Create train-test split for machine learning"""
        print(f"\n🔄 Creating train-test split (test_size={test_size})...")
        
        if self.processed_data is None:
            print("❌ No processed data available.")
            return None, None, None, None
        
        X = self.processed_data[self.feature_columns]
        y = self.processed_data[self.target_column]
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        print(f"✅ Train-test split created successfully!")
        print(f"   Training set: {X_train.shape[0]} samples")
        print(f"   Test set: {X_test.shape[0]} samples")
        print(f"   Features: {X_train.shape[1]}")
        
        return X_train, X_test, y_train, y_test
    
    def save_processed_data(self, filename='kepler_processed.csv'):
        """Save the processed dataset"""
        print(f"\n💾 Saving processed data to {filename}...")
        
        if self.processed_data is None:
            print("❌ No processed data available.")
            return False
        
        self.processed_data.to_csv(filename, index=False)
        print(f"✅ Processed data saved successfully!")
        
        return True
    
    def visualize_preprocessing_results(self):
        """Create visualizations of preprocessing results"""
        print("\n📊 Creating preprocessing visualizations...")
        
        if self.processed_data is None:
            print("❌ No processed data available.")
            return
        
        # Create figure with subplots
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Kepler KOI Dataset Preprocessing Results', fontsize=16, fontweight='bold')
        
        # 1. Label distribution
        ax1 = axes[0, 0]
        label_counts = self.processed_data[self.target_column].value_counts().sort_index()
        label_names = ['False Positive\n(-1)', 'Candidate\n(0)', 'Confirmed\n(1)']
        colors = ['#ff9999', '#66b3ff', '#99ff99']
        
        bars = ax1.bar(label_names, label_counts.values, color=colors)
        ax1.set_title('Encoded Label Distribution')
        ax1.set_ylabel('Count')
        
        # Add value labels on bars
        for bar, count in zip(bars, label_counts.values):
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                    f'{count:,}', ha='center', va='bottom')
        
        # 2. Feature correlation heatmap
        ax2 = axes[0, 1]
        correlation_matrix = self.processed_data[self.feature_columns].corr()
        sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0,
                   square=True, fmt='.2f', ax=ax2, cbar_kws={'shrink': 0.8})
        ax2.set_title('Feature Correlation Matrix')
        
        # 3. Feature distributions (before vs after normalization)
        ax3 = axes[1, 0]
        # Select a few key features for visualization
        key_features = ['koi_period', 'koi_prad', 'koi_teq']
        available_features = [f for f in key_features if f in self.feature_columns]
        
        for feature in available_features:
            ax3.hist(self.processed_data[feature], bins=30, alpha=0.7, label=feature)
        
        ax3.set_title('Normalized Feature Distributions')
        ax3.set_xlabel('Normalized Value')
        ax3.set_ylabel('Frequency')
        ax3.legend()
        
        # 4. Feature importance (variance)
        ax4 = axes[1, 1]
        feature_variance = self.processed_data[self.feature_columns].var().sort_values(ascending=False)
        ax4.barh(range(len(feature_variance)), feature_variance.values)
        ax4.set_yticks(range(len(feature_variance)))
        ax4.set_yticklabels(feature_variance.index, fontsize=8)
        ax4.set_title('Feature Variance (Post-Normalization)')
        ax4.set_xlabel('Variance')
        
        plt.tight_layout()
        plt.savefig('kepler_preprocessing_results.png', dpi=300, bbox_inches='tight')
        print("📊 Visualizations saved as 'kepler_preprocessing_results.png'")
        
        return fig
    
    def run_complete_pipeline(self, missing_strategy='drop', normalization='standard', 
                            test_size=0.2, save_data=True):
        """
        Run the complete preprocessing pipeline
        
        Args:
            missing_strategy (str): Strategy for handling missing values
            normalization (str): Normalization method
            test_size (float): Test set size for train-test split
            save_data (bool): Whether to save processed data
        """
        print("🚀 STARTING COMPLETE PREPROCESSING PIPELINE")
        print("=" * 60)
        
        # Step 1: Load dataset
        if not self.load_dataset():
            return False
        
        # Step 2: Drop columns
        if not self.drop_columns():
            return False
        
        # Step 3: Handle missing values
        if not self.handle_missing_values(strategy=missing_strategy):
            return False
        
        # Step 4: Normalize features
        if not self.normalize_features(method=normalization):
            return False
        
        # Step 5: Encode labels
        if not self.encode_labels():
            return False
        
        # Create train-test split
        X_train, X_test, y_train, y_test = self.create_train_test_split(test_size=test_size)
        
        # Save processed data
        if save_data:
            self.save_processed_data()
        
        # Create visualizations
        self.visualize_preprocessing_results()
        
        print("\n🎉 PREPROCESSING PIPELINE COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("Summary:")
        print(f"  📊 Final dataset shape: {self.processed_data.shape}")
        print(f"  🔢 Features: {len(self.feature_columns)}")
        print(f"  🎯 Target classes: {len(self.processed_data[self.target_column].unique())}")
        print(f"  📈 Train set: {X_train.shape[0]} samples")
        print(f"  📉 Test set: {X_test.shape[0]} samples")
        
        return X_train, X_test, y_train, y_test

def main():
    """Main function to run the preprocessing pipeline"""
    
    # Initialize preprocessor
    preprocessor = KeplerPreprocessor()
    
    # Run complete pipeline
    result = preprocessor.run_complete_pipeline(
        missing_strategy='drop',      # or 'impute'
        normalization='standard',     # or 'minmax'
        test_size=0.2,
        save_data=True
    )
    
    if result:
        X_train, X_test, y_train, y_test = result
        
        print("\n📋 PREPROCESSING SUMMARY:")
        print(f"✅ Dataset loaded and preprocessed successfully")
        print(f"✅ {len(preprocessor.feature_columns)} features selected")
        print(f"✅ Labels encoded: {preprocessor.label_mapping}")
        print(f"✅ Train-test split created")
        print(f"✅ Ready for machine learning!")
        
        return preprocessor, X_train, X_test, y_train, y_test
    else:
        print("❌ Preprocessing failed!")
        return None, None, None, None, None

if __name__ == "__main__":
    preprocessor, X_train, X_test, y_train, y_test = main()


