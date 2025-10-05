#!/usr/bin/env python3
"""
Kepler Objects of Interest (KOI) Dataset Analysis
NASA Exoplanet Archive Dataset Analysis Script
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

def load_and_explore_dataset():
    """Load the Kepler KOI dataset and perform initial exploration"""
    
    # Load the dataset
    df = pd.read_csv('kepler_koi_dataset.csv')
    
    print("🔭 KEPLER OBJECTS OF INTEREST (KOI) DATASET ANALYSIS")
    print("=" * 60)
    
    # Basic dataset information
    print(f"📊 Dataset Shape: {df.shape[0]:,} rows × {df.shape[1]} columns")
    print(f"📅 Total KOI entries: {len(df):,}")
    
    # Key columns analysis
    key_columns = ['kepoi_name', 'koi_period', 'koi_duration', 'koi_depth', 
                   'koi_prad', 'koi_srad', 'koi_teq', 'koi_disposition']
    
    print(f"\n🔍 Key Columns Available:")
    for col in key_columns:
        status = "✓" if col in df.columns else "✗"
        print(f"  {status} {col}")
    
    return df, key_columns

def analyze_dispositions(df):
    """Analyze the disposition distribution"""
    
    print(f"\n🏷️  DISPOSITION ANALYSIS")
    print("-" * 40)
    
    disposition_counts = df['koi_disposition'].value_counts()
    disposition_percentages = (disposition_counts / len(df) * 100).round(2)
    
    print("Distribution of exoplanet classifications:")
    for disposition, count in disposition_counts.items():
        percentage = disposition_percentages[disposition]
        print(f"  {disposition:15}: {count:5,} ({percentage:5.1f}%)")
    
    return disposition_counts, disposition_percentages

def analyze_planetary_parameters(df):
    """Analyze planetary and stellar parameters"""
    
    print(f"\n🪐 PLANETARY & STELLAR PARAMETERS")
    print("-" * 40)
    
    # Key parameters for analysis
    params = {
        'koi_period': 'Orbital Period (days)',
        'koi_duration': 'Transit Duration (hours)',
        'koi_depth': 'Transit Depth (ppm)',
        'koi_prad': 'Planetary Radius (Earth radii)',
        'koi_srad': 'Stellar Radius (Solar radii)',
        'koi_teq': 'Equilibrium Temperature (K)'
    }
    
    # Statistical summary
    available_params = {k: v for k, v in params.items() if k in df.columns}
    
    print("Statistical Summary:")
    print(df[list(available_params.keys())].describe().round(3))
    
    # Missing data analysis
    print(f"\n📋 Missing Data Analysis:")
    missing_data = df[list(available_params.keys())].isnull().sum()
    for param, missing_count in missing_data.items():
        percentage = (missing_count / len(df) * 100)
        print(f"  {param:15}: {missing_count:4,} missing ({percentage:4.1f}%)")
    
    return available_params

def analyze_by_disposition(df):
    """Analyze parameters grouped by disposition"""
    
    print(f"\n🔬 ANALYSIS BY DISPOSITION")
    print("-" * 40)
    
    # Group by disposition and analyze key parameters
    disposition_groups = df.groupby('koi_disposition')
    
    key_params = ['koi_period', 'koi_prad', 'koi_teq', 'koi_srad']
    available_key_params = [p for p in key_params if p in df.columns]
    
    for param in available_key_params:
        print(f"\n{param.upper()} by Disposition:")
        summary = disposition_groups[param].agg(['count', 'mean', 'median', 'std']).round(3)
        print(summary)
    
    return disposition_groups

def create_visualizations(df, disposition_counts):
    """Create visualizations of the dataset"""
    
    print(f"\n📈 CREATING VISUALIZATIONS")
    print("-" * 40)
    
    # Set up the plotting style
    plt.style.use('default')
    sns.set_palette("husl")
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    fig.suptitle('Kepler Objects of Interest (KOI) Dataset Analysis', fontsize=16, fontweight='bold')
    
    # 1. Disposition distribution pie chart
    ax1 = axes[0, 0]
    colors = ['#ff9999', '#66b3ff', '#99ff99']
    disposition_counts.plot(kind='pie', ax=ax1, autopct='%1.1f%%', colors=colors)
    ax1.set_title('Distribution of KOI Dispositions')
    ax1.set_ylabel('')
    
    # 2. Orbital period distribution
    ax2 = axes[0, 1]
    # Use log scale for better visualization
    df['koi_period'].hist(bins=50, ax=ax2, alpha=0.7)
    ax2.set_xlabel('Orbital Period (days)')
    ax2.set_ylabel('Frequency')
    ax2.set_title('Distribution of Orbital Periods')
    ax2.set_yscale('log')
    
    # 3. Planetary radius distribution
    ax3 = axes[0, 2]
    df['koi_prad'].dropna().hist(bins=50, ax=ax3, alpha=0.7)
    ax3.set_xlabel('Planetary Radius (Earth radii)')
    ax3.set_ylabel('Frequency')
    ax3.set_title('Distribution of Planetary Radii')
    
    # 4. Equilibrium temperature vs orbital period
    ax4 = axes[1, 0]
    confirmed = df[df['koi_disposition'] == 'CONFIRMED']
    candidates = df[df['koi_disposition'] == 'CANDIDATE']
    false_positives = df[df['koi_disposition'] == 'FALSE POSITIVE']
    
    ax4.scatter(confirmed['koi_period'], confirmed['koi_teq'], 
               alpha=0.6, label='Confirmed', s=20)
    ax4.scatter(candidates['koi_period'], candidates['koi_teq'], 
               alpha=0.6, label='Candidate', s=20)
    ax4.scatter(false_positives['koi_period'], false_positives['koi_teq'], 
               alpha=0.6, label='False Positive', s=20)
    
    ax4.set_xlabel('Orbital Period (days)')
    ax4.set_ylabel('Equilibrium Temperature (K)')
    ax4.set_title('Temperature vs Orbital Period')
    ax4.legend()
    ax4.set_xscale('log')
    
    # 5. Planetary radius vs stellar radius
    ax5 = axes[1, 1]
    ax5.scatter(df['koi_srad'], df['koi_prad'], alpha=0.6, s=20)
    ax5.set_xlabel('Stellar Radius (Solar radii)')
    ax5.set_ylabel('Planetary Radius (Earth radii)')
    ax5.set_title('Planetary vs Stellar Radius')
    
    # 6. Transit depth distribution
    ax6 = axes[1, 2]
    df['koi_depth'].dropna().hist(bins=50, ax=ax6, alpha=0.7)
    ax6.set_xlabel('Transit Depth (ppm)')
    ax6.set_ylabel('Frequency')
    ax6.set_title('Distribution of Transit Depths')
    
    plt.tight_layout()
    plt.savefig('kepler_analysis_plots.png', dpi=300, bbox_inches='tight')
    print("📊 Visualizations saved as 'kepler_analysis_plots.png'")
    
    return fig

def generate_summary_report(df, disposition_counts, disposition_percentages):
    """Generate a comprehensive summary report"""
    
    print(f"\n📝 GENERATING SUMMARY REPORT")
    print("-" * 40)
    
    report_content = f"""
KEPLER OBJECTS OF INTEREST (KOI) DATASET SUMMARY
{'=' * 60}

DATASET OVERVIEW:
- Total entries: {len(df):,}
- Total columns: {df.shape[1]}
- Date accessed: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

DISPOSITION DISTRIBUTION:
"""
    
    for disposition, count in disposition_counts.items():
        percentage = disposition_percentages[disposition]
        report_content += f"- {disposition:15}: {count:5,} entries ({percentage:5.1f}%)\\n"
    
    report_content += f"""
KEY PARAMETERS SUMMARY:
- Orbital Period: {df['koi_period'].min():.2f} - {df['koi_period'].max():.2f} days
- Planetary Radius: {df['koi_prad'].min():.2f} - {df['koi_prad'].max():.2f} Earth radii
- Stellar Radius: {df['koi_srad'].min():.2f} - {df['koi_srad'].max():.2f} Solar radii
- Equilibrium Temperature: {df['koi_teq'].min():.0f} - {df['koi_teq'].max():.0f} K

DATA QUALITY:
- Missing values in key parameters: {df[['koi_depth', 'koi_prad', 'koi_srad', 'koi_teq']].isnull().sum().sum()} total
- Complete records: {len(df.dropna(subset=['koi_depth', 'koi_prad', 'koi_srad', 'koi_teq'])):,}

UNIQUE IDENTIFIERS:
- Unique KOI names: {df['kepoi_name'].nunique():,}
- Unique Kepler names: {df['kepler_name'].nunique():,}
- Unique stellar IDs: {df['kepid'].nunique():,}

DATASET SOURCE:
- NASA Exoplanet Archive
- Kepler Objects of Interest (KOI) Cumulative Table
- DOI: 10.26133/NEA4
"""
    
    # Save the report
    with open('kepler_dataset_report.txt', 'w') as f:
        f.write(report_content)
    
    print("📄 Summary report saved as 'kepler_dataset_report.txt'")
    
    return report_content

def main():
    """Main analysis function"""
    
    try:
        # Load and explore the dataset
        df, key_columns = load_and_explore_dataset()
        
        # Analyze dispositions
        disposition_counts, disposition_percentages = analyze_dispositions(df)
        
        # Analyze planetary parameters
        available_params = analyze_planetary_parameters(df)
        
        # Analyze by disposition
        disposition_groups = analyze_by_disposition(df)
        
        # Create visualizations
        fig = create_visualizations(df, disposition_counts)
        
        # Generate summary report
        report = generate_summary_report(df, disposition_counts, disposition_percentages)
        
        print(f"\n✅ ANALYSIS COMPLETE!")
        print("=" * 60)
        print("Generated files:")
        print("  📊 kepler_analysis_plots.png - Data visualizations")
        print("  📄 kepler_dataset_report.txt - Summary report")
        print("  📈 kepler_koi_dataset.csv - Original dataset")
        
        return df
        
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        return None

if __name__ == "__main__":
    df = main()


