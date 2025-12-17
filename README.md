# 📈 Time Series Forecasting Application - ROMARIN Project

<div align="center">

![Project Banner](https://img.shields.io/badge/USTHB-Computer_Science-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)

**A comprehensive web application for time series analysis and forecasting**

*USTHB - Faculty of Computer Science | Master ROMARIN 2025/2026*

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation)

</div>

---

## 🎯 Project Overview

This application provides an end-to-end solution for time series forecasting, implementing multiple statistical models and machine learning techniques. Developed as part of the ROMARIN Master's program , it addresses real-world challenges in economic forecasting, demand prediction, and trend analysis. ( made for a friend <3 by love )

### 🎓 Academic Context

- **Institution**: USTHB (Université des Sciences et de la Technologie Houari Boumediene)
- **Faculty**: Computer Science
- **Program**: Master ROMARIN
- **Academic Year**: 2025/2026

---

## ✨ Features

### 📊 Data Management
- **CSV File Import**: Seamless upload and parsing of time series data
- **Automatic Data Validation**: Detects and handles invalid entries
- **Flexible Train/Test Split**: Configurable ratio (50% to 90%)
- **Real-time Data Visualization**: Interactive charts with Recharts library

### 🔍 Exploratory Analysis
- **Comprehensive Statistics**: Mean, median, standard deviation, variance
- **Distribution Metrics**: Skewness and kurtosis calculations
- **Seasonality Detection**: Automatic identification of periodic patterns using autocorrelation
- **Trend Analysis**: Visual and statistical trend identification

### 🤖 Forecasting Models

#### Classic Models
1. **Moving Average (MA)**
   - Simple rolling window averaging
   - Configurable window size
   - Effective for smoothing short-term fluctuations

2. **Linear Regression**
   - Least squares optimization
   - Trend line fitting
   - Suitable for data with linear trends

#### Exponential Smoothing Models
3. **Simple Exponential Smoothing (SES)**
   - Optimal for data without trend or seasonality
   - Single smoothing parameter α
   - Weighted average giving more importance to recent observations

4. **Holt's Linear Method**
   - Extends SES to handle linear trends
   - Two parameters: level (α) and trend (β)
   - Forecasts follow the trend direction

5. **Holt-Winters Seasonal Method**
   - **Additive Model**: For constant seasonal variations
   - **Multiplicative Model**: For proportional seasonal variations
   - Three parameters: level (α), trend (β), seasonality (γ)
   - Automatic seasonal period detection

### 📏 Model Evaluation

The application implements multiple performance metrics:

```
MSE  = (1/n) Σ(yₜ - ŷₜ)²           Mean Squared Error
RMSE = √MSE                        Root Mean Squared Error
MAE  = (1/n) Σ|yₜ - ŷₜ|           Mean Absolute Error
MAPE = (100%/n) Σ|yₜ - ŷₜ|/yₜ     Mean Absolute Percentage Error
AIC  = n·log(MSE) + 2k            Akaike Information Criterion
BIC  = n·log(MSE) + k·log(n)      Bayesian Information Criterion
```

### 📈 Visualization Tools

1. **Time Series Chart**: Displays actual data with multiple model predictions
2. **Residual Analysis**: Bar chart showing prediction errors
3. **Autocorrelation Function (ACF)**: Identifies seasonal patterns
4. **Model Comparison Table**: Side-by-side performance metrics

### 📋 Output & Export

- **Detailed Output Log**: Timestamped execution journal
- **JSON Export**: Complete analysis results in structured format
- **Session Information**: Configuration parameters and metadata
- **Best Model Selection**: Automatic identification based on RMSE

---
```

### Sample Output Log

```
════════════════════════════════════════
🚀 DÉBUT DE L'ANALYSE
📅 Session: 2024-12-17T14:30:00Z
🔢 Nombre d'observations: 144
════════════════════════════════════════

📊 ANALYSE EXPLORATOIRE
─────────────────────────────────────────
   Moyenne: 142.53 | Médiane: 138.20
   Écart-type: 24.67 | Variance: 608.43
   Min: 89.50 | Max: 198.30
   Skewness: 0.234 | Kurtosis: -0.567
   🔄 Saisonnalité détectée: Période = 12

🔧 MODÉLISATION EN COURS
─────────────────────────────────────────
   Split: Train=115 (80%) | Test=29 (20%)
   ✓ Moyenne Mobile - RMSE: 18.4523
   ✓ Régression Linéaire - RMSE: 21.3456
   ✓ Lissage Exp. Simple - RMSE: 15.2341
   ✓ Lissage de Holt - RMSE: 12.8976
   ✓ Holt-Winters Additif - RMSE: 8.3421
   ✓ Holt-Winters Mult. - RMSE: 7.9234

🏆 RÉSULTATS FINAUX
─────────────────────────────────────────
   🥇 Meilleur modèle: Holt-Winters Multiplicatif
   📉 RMSE: 7.9234
   📊 MAE: 6.2341
   📈 MAPE: 4.21%

════════════════════════════════════════
✅ ANALYSE TERMINÉE AVEC SUCCÈS
════════════════════════════════════════
```

---

## 🚀 Installation

### Prerequisites

- **Node.js**: v16.x or higher
- **npm**: v8.x or higher (comes with Node.js)
- **Git**: For version control

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/romarin-forecasting.git

# Navigate to project directory
cd romarin-forecasting

# Install dependencies
npm install
```

### Dependencies

The project uses the following main libraries:

```json
{
  "react": "^18.2.0",
  "recharts": "^2.5.0",
  "lucide-react": "^0.263.1"
}
```

---

## 💻 Usage

### Starting the Application

```bash
# Development mode with hot reload
npm start

# Production build
npm run build

# Run production build locally
npm run serve
```

The application will open at `http://localhost:3000`

### Step-by-Step Guide

#### 1. Prepare Your Data

Create a CSV file with the following format:

```csv
date,value
2023-01-01,142.5
2023-02-01,138.2
2023-03-01,151.3
2023-04-01,147.8
...
```

**Requirements**:
- First column: Date (any format)
- Second column: Numeric value
- Header row required
- Minimum 10 observations recommended

#### 2. Import Data

1. Click **"Charger un fichier CSV"**
2. Select your CSV file
3. Verify observation count in the interface

#### 3. Configure Analysis

1. Adjust **Train/Test Ratio** (50%-90%)
   - Higher ratio: More training data, less testing
   - Lower ratio: More rigorous validation

2. Click **"Lancer l'Analyse"**

#### 4. Review Results

- **Prévisions Tab**: View actual vs predicted values
- **Résidus Tab**: Analyze prediction errors
- **Autocorrélation Tab**: Examine seasonal patterns
- **Model Comparison Table**: Compare all model performances

#### 5. Export Results

Click **"Exporter (JSON)"** to download:
- Complete analysis results
- Model parameters and metrics
- Full output log
- Session metadata

---

## 📚 Documentation

### Project Structure

```
romarin-forecasting/
│
├── src/
│   ├── App.jsx                 # Main application component
│   ├── index.js               # Application entry point
│   └── styles/                # CSS styles
│
├── public/
│   ├── index.html             # HTML template
│   └── assets/                # Static assets
│
├── data/                      # Sample datasets
│   ├── sales_data.csv
│   ├── temperature_data.csv
│   └── stock_prices.csv
│
├── docs/                      # Project documentation
│   ├── technical_report.pdf
│   └── user_guide.pdf
│
├── package.json               # Dependencies and scripts
├
