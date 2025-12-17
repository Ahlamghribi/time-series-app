import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Upload, TrendingUp, BarChart3, Download, Play, FileText, Activity, AlertCircle } from 'lucide-react';

const App = () => {
  const [data, setData] = useState([]);
  const [results, setResults] = useState(null);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trainRatio, setTrainRatio] = useState(0.8);
  const [activeTab, setActiveTab] = useState('chart');
  const fileInputRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, { time: timestamp, message, type }]);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    addLog(`📁 Importation du fichier: ${file.name}`, 'info');
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      const headers = lines[0].split(',').map(h => h.trim());
      const parsedData = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 2) {
          parsedData.push({
            date: values[0].trim(),
            value: parseFloat(values[1]),
            index: i - 1
          });
        }
      }
      
      setData(parsedData.filter(d => !isNaN(d.value)));
      addLog(`✅ ${parsedData.length} observations importées avec succès`, 'success');
      addLog(`📊 Variables détectées: ${headers.join(', ')}`, 'info');
    };
    
    reader.readAsText(file);
  };

  const calculateStats = (values) => {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const std = Math.sqrt(variance);
    
    const sorted = [...values].sort((a, b) => a - b);
    const median = n % 2 === 0 ? (sorted[n/2-1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)];
    
    const skewness = values.reduce((a, b) => a + Math.pow((b - mean) / std, 3), 0) / n;
    const kurtosis = values.reduce((a, b) => a + Math.pow((b - mean) / std, 4), 0) / n - 3;
    
    return { mean, variance, std, median, min: Math.min(...values), max: Math.max(...values), skewness, kurtosis };
  };

  const movingAverage = (data, window = 3) => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        result.push(null);
      } else {
        const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / window);
      }
    }
    return result;
  };

  const linearRegression = (x, y) => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept, predict: (x) => slope * x + intercept };
  };

  const simpleExponentialSmoothing = (data, alpha = 0.3) => {
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
    }
    return result;
  };

  const holtSmoothing = (data, alpha = 0.3, beta = 0.1) => {
    const level = [data[0]];
    const trend = [data[1] - data[0]];
    const result = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      const newLevel = alpha * data[i] + (1 - alpha) * (level[i - 1] + trend[i - 1]);
      const newTrend = beta * (newLevel - level[i - 1]) + (1 - beta) * trend[i - 1];
      
      level.push(newLevel);
      trend.push(newTrend);
      result.push(newLevel);
    }
    
    return { result, level, trend };
  };

  const holtWintersAdditive = (data, alpha = 0.3, beta = 0.1, gamma = 0.1, season = 12) => {
    const n = data.length;
    const level = [];
    const trend = [];
    const seasonal = new Array(n).fill(0);
    const result = [];
    
    level[0] = data[0];
    trend[0] = (data[season] - data[0]) / season;
    
    for (let i = 0; i < season; i++) {
      seasonal[i] = data[i] - level[0];
    }
    
    result[0] = data[0];
    
    for (let i = 1; i < n; i++) {
      const seasonalIdx = i % season;
      
      level[i] = alpha * (data[i] - seasonal[seasonalIdx]) + 
                 (1 - alpha) * (level[i - 1] + trend[i - 1]);
      trend[i] = beta * (level[i] - level[i - 1]) + (1 - beta) * trend[i - 1];
      seasonal[i] = gamma * (data[i] - level[i]) + (1 - gamma) * seasonal[seasonalIdx];
      
      result[i] = level[i] + trend[i] + seasonal[seasonalIdx];
    }
    
    return result;
  };

  const holtWintersMultiplicative = (data, alpha = 0.3, beta = 0.1, gamma = 0.1, season = 12) => {
    const n = data.length;
    const level = [];
    const trend = [];
    const seasonal = new Array(n).fill(1);
    const result = [];
    
    level[0] = data[0];
    trend[0] = (data[season] - data[0]) / season;
    
    for (let i = 0; i < season; i++) {
      seasonal[i] = data[i] / (level[0] || 1);
    }
    
    result[0] = data[0];
    
    for (let i = 1; i < n; i++) {
      const seasonalIdx = i % season;
      
      level[i] = alpha * (data[i] / (seasonal[seasonalIdx] || 1)) + 
                 (1 - alpha) * (level[i - 1] + trend[i - 1]);
      trend[i] = beta * (level[i] - level[i - 1]) + (1 - beta) * trend[i - 1];
      seasonal[i] = gamma * (data[i] / (level[i] || 1)) + (1 - gamma) * seasonal[seasonalIdx];
      
      result[i] = (level[i] + trend[i]) * seasonal[seasonalIdx];
    }
    
    return result;
  };

  const calculateMetrics = (actual, predicted) => {
    let n = 0, mse = 0, mae = 0, mape = 0;
    
    for (let i = 0; i < actual.length; i++) {
      if (predicted[i] !== null && !isNaN(predicted[i])) {
        const error = actual[i] - predicted[i];
        mse += error * error;
        mae += Math.abs(error);
        if (actual[i] !== 0) {
          mape += Math.abs(error / actual[i]);
        }
        n++;
      }
    }
    
    const rmse = Math.sqrt(mse / n);
    const aic = n * Math.log(mse / n) + 2 * 3;
    const bic = n * Math.log(mse / n) + 3 * Math.log(n);
    
    return {
      mse: mse / n,
      rmse,
      mae: mae / n,
      mape: (mape / n) * 100,
      aic,
      bic
    };
  };

  const detectSeasonality = (data, maxLag = 24) => {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    
    const autocorr = [];
    for (let lag = 1; lag <= Math.min(maxLag, Math.floor(data.length / 2)); lag++) {
      let sum = 0;
      for (let i = lag; i < data.length; i++) {
        sum += (data[i] - mean) * (data[i - lag] - mean);
      }
      autocorr.push({ lag, value: sum / (data.length * variance) });
    }
    
    const peaks = autocorr.filter((ac, i) => 
      i > 0 && i < autocorr.length - 1 && 
      ac.value > autocorr[i-1].value && 
      ac.value > autocorr[i+1].value &&
      ac.value > 0.3
    );
    
    return { period: peaks.length > 0 ? peaks[0].lag : null, autocorr };
  };

  const calculateResiduals = (actual, predicted) => {
    const residuals = [];
    for (let i = 0; i < actual.length; i++) {
      if (predicted[i] !== null && !isNaN(predicted[i])) {
        residuals.push(actual[i] - predicted[i]);
      }
    }
    return residuals;
  };

  const runAnalysis = () => {
    if (data.length < 10) {
      addLog('❌ Données insuffisantes (minimum 10 observations)', 'error');
      return;
    }

    setLoading(true);
    addLog('════════════════════════════════════════', 'info');
    addLog('🚀 DÉBUT DE L\'ANALYSE', 'info');
    addLog(`📅 Session: ${new Date().toISOString()}`, 'info');
    addLog(`🔢 Nombre d'observations: ${data.length}`, 'info');
    addLog('════════════════════════════════════════', 'info');

    setTimeout(() => {
      const values = data.map(d => d.value);
      const trainSize = Math.floor(data.length * trainRatio);
      const trainData = values.slice(0, trainSize);
      const testData = values.slice(trainSize);

      addLog('', 'info');
      addLog('📊 ANALYSE EXPLORATOIRE', 'info');
      addLog('─────────────────────────────────────────', 'info');
      const stats = calculateStats(values);
      addLog(`   Moyenne: ${stats.mean.toFixed(2)} | Médiane: ${stats.median.toFixed(2)}`, 'info');
      addLog(`   Écart-type: ${stats.std.toFixed(2)} | Variance: ${stats.variance.toFixed(2)}`, 'info');
      addLog(`   Min: ${stats.min.toFixed(2)} | Max: ${stats.max.toFixed(2)}`, 'info');
      addLog(`   Skewness: ${stats.skewness.toFixed(3)} | Kurtosis: ${stats.kurtosis.toFixed(3)}`, 'info');

      const seasonalityResult = detectSeasonality(values);
      const seasonality = seasonalityResult.period;
      if (seasonality) {
        addLog(`   🔄 Saisonnalité détectée: Période = ${seasonality}`, 'success');
      } else {
        addLog(`   ℹ️  Aucune saisonnalité significative détectée`, 'info');
      }

      addLog('', 'info');
      addLog('🔧 MODÉLISATION EN COURS', 'info');
      addLog('─────────────────────────────────────────', 'info');
      addLog(`   Split: Train=${trainSize} (${(trainRatio*100).toFixed(0)}%) | Test=${testData.length} (${((1-trainRatio)*100).toFixed(0)}%)`, 'info');
      
      const models = [];

      addLog('   ⏳ Calcul: Moyenne Mobile...', 'info');
      const ma = movingAverage(trainData, 3);
      const maFull = movingAverage(values, 3);
      const maMetrics = calculateMetrics(testData, maFull.slice(trainSize));
      models.push({ name: 'Moyenne Mobile', metrics: maMetrics, predictions: maFull, type: 'classique' });
      addLog(`   ✓ Moyenne Mobile - RMSE: ${maMetrics.rmse.toFixed(4)} | AIC: ${maMetrics.aic.toFixed(2)}`, 'info');

      addLog('   ⏳ Calcul: Régression Linéaire...', 'info');
      const x = trainData.map((_, i) => i);
      const lr = linearRegression(x, trainData);
      const lrPred = values.map((_, i) => lr.predict(i));
      const lrMetrics = calculateMetrics(testData, lrPred.slice(trainSize));
      models.push({ name: 'Régression Linéaire', metrics: lrMetrics, predictions: lrPred, type: 'classique' });
      addLog(`   ✓ Régression Linéaire - RMSE: ${lrMetrics.rmse.toFixed(4)} | AIC: ${lrMetrics.aic.toFixed(2)}`, 'info');

      addLog('   ⏳ Calcul: Lissage Exponentiel Simple...', 'info');
      const ses = simpleExponentialSmoothing(trainData, 0.3);
      const sesFull = simpleExponentialSmoothing(values, 0.3);
      const sesMetrics = calculateMetrics(testData, sesFull.slice(trainSize));
      models.push({ name: 'Lissage Exp. Simple', metrics: sesMetrics, predictions: sesFull, type: 'lissage' });
      addLog(`   ✓ Lissage Exp. Simple - RMSE: ${sesMetrics.rmse.toFixed(4)} | AIC: ${sesMetrics.aic.toFixed(2)}`, 'info');

      addLog('   ⏳ Calcul: Lissage de Holt...', 'info');
      const holt = holtSmoothing(trainData, 0.3, 0.1);
      const holtFull = holtSmoothing(values, 0.3, 0.1);
      const holtMetrics = calculateMetrics(testData, holtFull.result.slice(trainSize));
      models.push({ name: 'Lissage de Holt', metrics: holtMetrics, predictions: holtFull.result, type: 'lissage' });
      addLog(`   ✓ Lissage de Holt - RMSE: ${holtMetrics.rmse.toFixed(4)} | AIC: ${holtMetrics.aic.toFixed(2)}`, 'info');

      if (seasonality && seasonality < trainData.length / 2) {
        addLog('   ⏳ Calcul: Holt-Winters Additif...', 'info');
        const hwAdd = holtWintersAdditive(values, 0.3, 0.1, 0.1, seasonality);
        const hwAddMetrics = calculateMetrics(testData, hwAdd.slice(trainSize));
        models.push({ name: 'Holt-Winters Additif', metrics: hwAddMetrics, predictions: hwAdd, type: 'lissage' });
        addLog(`   ✓ Holt-Winters Additif - RMSE: ${hwAddMetrics.rmse.toFixed(4)} | AIC: ${hwAddMetrics.aic.toFixed(2)}`, 'info');

        addLog('   ⏳ Calcul: Holt-Winters Multiplicatif...', 'info');
        const hwMult = holtWintersMultiplicative(values, 0.3, 0.1, 0.1, seasonality);
        const hwMultMetrics = calculateMetrics(testData, hwMult.slice(trainSize));
        models.push({ name: 'Holt-Winters Multiplicatif', metrics: hwMultMetrics, predictions: hwMult, type: 'lissage' });
        addLog(`   ✓ Holt-Winters Mult. - RMSE: ${hwMultMetrics.rmse.toFixed(4)} | AIC: ${hwMultMetrics.aic.toFixed(2)}`, 'info');
      }

      models.sort((a, b) => a.metrics.rmse - b.metrics.rmse);
      
      addLog('', 'info');
      addLog('🏆 RÉSULTATS FINAUX', 'success');
      addLog('─────────────────────────────────────────', 'success');
      addLog(`   🥇 Meilleur modèle: ${models[0].name}`, 'success');
      addLog(`   📉 RMSE: ${models[0].metrics.rmse.toFixed(4)}`, 'success');
      addLog(`   📊 MAE: ${models[0].metrics.mae.toFixed(4)}`, 'success');
      addLog(`   📈 MAPE: ${models[0].metrics.mape.toFixed(2)}%`, 'success');
      addLog('', 'info');
      addLog('Classement des modèles:', 'info');
      models.forEach((m, i) => {
        addLog(`   ${i + 1}. ${m.name} - RMSE: ${m.metrics.rmse.toFixed(4)}`, 'info');
      });

      const residuals = calculateResiduals(values, models[0].predictions);

      setResults({
        stats,
        seasonality,
        seasonalityData: seasonalityResult.autocorr,
        models,
        trainSize,
        bestModel: models[0],
        residuals
      });

      setLoading(false);
      addLog('', 'info');
      addLog('════════════════════════════════════════', 'success');
      addLog('✅ ANALYSE TERMINÉE AVEC SUCCÈS', 'success');
      addLog('════════════════════════════════════════', 'success');
    }, 500);
  };

  const exportResults = () => {
    if (!results) return;

    const report = {
      session: new Date().toISOString(),
      configuration: {
        data_points: data.length,
        train_size: results.trainSize,
        train_ratio: trainRatio
      },
      statistics: results.stats,
      seasonality: {
        detected: results.seasonality !== null,
        period: results.seasonality
      },
      models: results.models.map(m => ({
        name: m.name,
        type: m.type,
        metrics: m.metrics
      })),
      best_model: {
        name: results.bestModel.name,
        metrics: results.bestModel.metrics
      },
      log: log
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyse_prevision_${new Date().getTime()}.json`;
    a.click();
    addLog('💾 Résultats exportés avec succès', 'success');
  };

  const chartData = data.map((d, i) => {
    const point = { index: i, actual: d.value, date: d.date };
    if (results) {
      results.models.forEach(model => {
        point[model.name] = model.predictions[i];
      });
    }
    return point;
  });

  const residualData = results ? results.residuals.map((r, i) => ({ index: i, residual: r })) : [];
  const autocorrData = results ? results.seasonalityData : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center">
                <Activity className="mr-3" size={36} />
                Prévision des Séries Temporelles
              </h1>
              <p className="text-indigo-100 text-sm md:text-base">
                Projet ROMARIN - Master 2025/2026 | USTHB - Faculté d'Informatique
              </p>
              <p className="text-indigo-200 text-xs mt-1">
                Encadrant: Pr. Djamal Chaabane
              </p>
            </div>
            <TrendingUp size={64} className="hidden md:block opacity-20" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Upload className="mr-2 text-indigo-600" size={24} />
                Importation
              </h2>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                Charger un fichier CSV
              </button>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Format attendu: date, valeur</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Observations:</span>
                  <span className="text-lg font-bold text-indigo-600">{data.length}</span>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ratio Train/Test: <span className="text-indigo-600">{(trainRatio * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="0.9"
                  step="0.05"
                  value={trainRatio}
                  onChange={(e) => setTrainRatio(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50%</span>
                  <span>90%</span>
                </div>
              </div>

              <button
                onClick={runAnalysis}
                disabled={data.length < 10 || loading}
                className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center font-medium"
              >
                <Play className="mr-2" size={20} />
                {loading ? 'Analyse en cours...' : 'Lancer l\'Analyse'}
              </button>

              {results && (
                <button
                  onClick={exportResults}
                  className="w-full mt-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center font-medium"
                >
                  <Download className="mr-2" size={20} />
                  Exporter (JSON)
                </button>
              )}
            </div>

            {/* Stats Section */}
            {results && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="mr-2 text-indigo-600" size={22} />
                  Statistiques Descriptives
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Moyenne</span>
                    <span className="font-bold text-gray-800">{results.stats.mean.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Écart-type</span>
                    <span className="font-bold text-gray-800">{results.stats.std.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Min - Max</span>
                    <span className="font-bold text-gray-800">{results.stats.min.toFixed(2)} - {results.stats.max.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-indigo-50 rounded border border-indigo-200">
                    <span className="text-sm font-medium text-indigo-700">Saisonnalité</span>
                    <span className="font-bold text-indigo-600">
                      {results.seasonality ? `P=${results.seasonality}` : 'Aucune'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium text-green-700">Meilleur modèle</span>
                    <span className="font-bold text-green-600 text-xs">{results.bestModel.name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            {data.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('chart')}
                    className={`flex-1 py-3 px-4 font-medium transition-all ${
                      activeTab === 'chart'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    📈 Prévisions
                  </button>
                  <button
                    onClick={() => setActiveTab('residuals')}
                    className={`flex-1 py-3 px-4 font-medium transition-all ${
                      activeTab === 'residuals'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                    disabled={!results}
                  >
                    📊 Résidus
                  </button>
                  <button
                    onClick={() => setActiveTab('seasonality')}
                    className={`flex-1 py-3 px-4 font-medium transition-all ${
                      activeTab === 'seasonality'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                    disabled={!results}
                  >
                    🔄 Autocorrélation
                  </button>
                </div>

                <div className="p-6">
                  {activeTab === 'chart' && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Série Temporelle et Prévisions
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="index" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#2563eb" 
                            strokeWidth={2.5} 
                            name="Données réelles"
                            dot={false}
                          />
                          {results && results.models.slice(0, 3).map((model, i) => (
                            <Line
                              key={model.name}
                              type="monotone"
                              dataKey={model.name}
                              stroke={['#10b981', '#f59e0b', '#ef4444'][i]}
                              strokeWidth={1.5}
                              dot={false}
                              name={model.name}
                              strokeDasharray={i > 0 ? "5 5" : "0"}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {activeTab === 'residuals' && results && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Analyse des Résidus - {results.bestModel.name}
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={residualData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="index" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <Bar dataKey="residual" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {activeTab === 'seasonality' && results && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Fonction d'Autocorrélation
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={autocorrData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="lag" stroke="#6b7280" label={{ value: 'Lag', position: 'insideBottom', offset: -5 }} />
                          <YAxis stroke="#6b7280" label={{ value: 'Autocorrélation', angle: -90, position: 'insideLeft' }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <Bar dataKey="value" fill="#06b6d4" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Models Comparison */}
            {results && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Comparaison des Modèles
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-700">Modèle</th>
                        <th className="px-4 py-3 text-right font-bold text-gray-700">MSE</th>
                        <th className="px-4 py-3 text-right font-bold text-gray-700">RMSE</th>
                        <th className="px-4 py-3 text-right font-bold text-gray-700">MAE</th>
                        <th className="px-4 py-3 text-right font-bold text-gray-700">MAPE</th>
                        <th className="px-4 py-3 text-right font-bold text-gray-700">AIC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.models.map((model, i) => (
                        <tr 
                          key={i} 
                          className={`${i === 0 ? 'bg-green-50 border-l-4 border-green-500' : ''} hover:bg-gray-50 transition`}
                        >
                          <td className="px-4 py-3 border-t font-medium">
                            {model.name}
                            {i === 0 && <span className="ml-2 text-green-600 font-bold">🏆</span>}
                          </td>
                          <td className="px-4 py-3 border-t text-right">{model.metrics.mse.toFixed(4)}</td>
                          <td className="px-4 py-3 border-t text-right font-semibold">{model.metrics.rmse.toFixed(4)}</td>
                          <td className="px-4 py-3 border-t text-right">{model.metrics.mae.toFixed(4)}</td>
                          <td className="px-4 py-3 border-t text-right">{model.metrics.mape.toFixed(2)}%</td>
                          <td className="px-4 py-3 border-t text-right text-xs">{model.metrics.aic.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Log Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <FileText className="mr-2 text-indigo-600" size={22} />
                Journal de Sortie
              </h3>
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-4 rounded-lg font-mono text-xs h-80 overflow-y-auto shadow-inner">
                {log.length === 0 && (
                  <div className="text-gray-500 text-center py-8">
                    <AlertCircle className="mx-auto mb-2" size={32} />
                    En attente de données...
                  </div>
                )}
                {log.map((entry, i) => (
                  <div key={i} className="mb-1 leading-relaxed">
                    <span className="text-gray-500">[{entry.time}]</span>{' '}
                    <span className={
                      entry.type === 'error' ? 'text-red-400 font-semibold' :
                      entry.type === 'success' ? 'text-green-400 font-semibold' :
                      'text-gray-300'
                    }>
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;