"use client";

import { useState, useEffect } from "react";
import { predictRiskWithML, predictRiskWithDeepLearning, HealthInputs } from "../../lib/riskModels";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Droplet,
  Activity,
  User,
  Cigarette,
  Scale,
  Brain,
  Info
} from "lucide-react";
import clsx from "clsx";

export default function DiagnosticsPage() {
  const [inputs, setInputs] = useState<HealthInputs>({
    age: 45,
    bloodPressure: 120,
    cholesterol: 200,
    bmi: 25,
    isSmoker: false,
    hasDiabetes: false,
    physicalActivity: 3,
  });

  const [mlRisk, setMlRisk] = useState<number | null>(null);
  const [dlRisk, setDlRisk] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelType] = useState<"ml" | "dl" | "both">("both");
  const [isCalculated, setIsCalculated] = useState(false);

  // Auto-calculate risk when inputs change quietly
  useEffect(() => {
    if (isCalculated) {
      handlePredict();
    }
  }, [inputs]);

  const handlePredict = async () => {
    setLoading(true);
    try {
      if (modelType === "both" || modelType === "ml") {
        setMlRisk(predictRiskWithML(inputs));
      } else {
        setMlRisk(null);
      }

      if (modelType === "both" || modelType === "dl") {
        const deepRisk = await predictRiskWithDeepLearning(inputs);
        setDlRisk(deepRisk);
      } else {
        setDlRisk(null);
      }
      setIsCalculated(true);
    } catch (e) {
      console.error(e);
      alert("Error estimating risk.");
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof HealthInputs) => {
    setInputs(prev => ({ ...prev, [key]: Number(e.target.value) }));
  };

  const toggleBoolean = (key: keyof HealthInputs) => {
    setInputs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getRiskColor = (risk: number) => {
    if (risk < 0.25) return "#2a9d8f"; // Green
    if (risk < 0.5) return "#e9c46a"; // Yellow
    if (risk < 0.75) return "#f4a261"; // Orange
    return "#e76f51"; // Red
  };

  const CircularProgress = ({ value, label }: { value: number | null, label: string }) => {
    if (value === null) return null;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - value * circumference;
    const color = getRiskColor(value);

    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              className="text-gray-200"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="64"
              cy="64"
            />
            <motion.circle
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              strokeLinecap="round"
              stroke={color}
              fill="transparent"
              r={radius}
              cx="64"
              cy="64"
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute text-2xl font-bold" style={{ color }}>
            {Math.round(value * 100)}<span className="text-sm shadow-sm">%</span>
          </div>
        </div>
        <div className="mt-2 text-sm font-semibold text-gray-600 uppercase tracking-widest">{label}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-4 px-4 sm:px-6 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl z-10 space-y-8"
      >
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-white/50 backdrop-blur rounded-2xl flex items-center justify-center mx-auto shadow-sm mb-4"
          >
            <Heart className="w-8 h-8 text-rose-500" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
            CardioRisk <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-red-600">AI</span>
          </h1>
          <p className="text-gray-600 font-medium max-w-lg mx-auto">
            Advanced neural networks and machine learning combined to analyze your cardiovascular profile.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-6 relative">
          
          {/* Inputs Section */}
          <div className="md:col-span-7 space-y-6">
            <div className="glass-panel p-6 sm:p-8 space-y-8">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b border-gray-200/50 pb-4">
                <User className="w-5 h-5 text-rose-700" /> Vitals & Metrics
              </h2>
              
              {/* Sliders Grid */}
              <div className="grid grid-cols-1 gap-8">
                
                {/* Age */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold flex items-center gap-2 text-gray-700">
                      Age
                    </label>
                    <span className="text-lg font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-lg">
                      {inputs.age} <span className="text-xs text-rose-900 font-normal">yrs</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={inputs.age}
                    onChange={(e) => handleSliderChange(e, "age")}
                    className="range-slider"
                  />
                </div>

                {/* Blood Pressure */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold flex items-center gap-2 text-gray-700">
                      <Activity className="w-4 h-4 text-rose-500" /> Blood Pressure
                    </label>
                    <span className="text-lg font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">
                      {inputs.bloodPressure} <span className="text-xs text-rose-800 font-normal">mmHg</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="200"
                    value={inputs.bloodPressure}
                    onChange={(e) => handleSliderChange(e, "bloodPressure")}
                    className="range-slider"
                  />
                </div>

                {/* Cholesterol */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold flex items-center gap-2 text-gray-700">
                      <Droplet className="w-4 h-4 text-amber-500" /> Cholesterol
                    </label>
                    <span className="text-lg font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
                      {inputs.cholesterol} <span className="text-xs text-amber-800 font-normal">mg/dL</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="120"
                    max="350"
                    value={inputs.cholesterol}
                    onChange={(e) => handleSliderChange(e, "cholesterol")}
                    className="range-slider"
                  />
                </div>

                {/* BMI */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold flex items-center gap-2 text-gray-700">
                      <Scale className="w-4 h-4 text-indigo-500" /> BMI
                    </label>
                    <span className="text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                      {inputs.bmi.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="0.1"
                    value={inputs.bmi}
                    onChange={(e) => handleSliderChange(e, "bmi")}
                    className="range-slider"
                  />
                </div>

              </div>
            </div>

            <div className="glass-panel p-6 sm:p-8 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b border-gray-200/50 pb-4">
                <Info className="w-5 h-5 text-rose-700" /> Lifestyle Factors
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => toggleBoolean("isSmoker")}
                  className={clsx(
                    "toggle-btn flex flex-col items-center justify-center gap-2 h-24",
                    inputs.isSmoker ? "is-active border-rose-400 bg-rose-50" : "hover:bg-gray-50 text-gray-500"
                  )}
                >
                  <Cigarette className={clsx("w-6 h-6", inputs.isSmoker ? "text-rose-500" : "")} />
                  <span>Smoker</span>
                </button>

                <button
                  onClick={() => toggleBoolean("hasDiabetes")}
                  className={clsx(
                    "toggle-btn flex flex-col items-center justify-center gap-2 h-24",
                    inputs.hasDiabetes ? "is-active border-amber-400 bg-amber-50" : "hover:bg-gray-50 text-gray-500"
                  )}
                >
                  <Activity className={clsx("w-6 h-6", inputs.hasDiabetes ? "text-amber-500" : "")} />
                  <span>Diabetes History</span>
                </button>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                 <div className="flex justify-between items-center">
                    <label className="text-sm font-bold flex items-center gap-2 text-gray-700">
                      Physical Activity Rating (0-5)
                    </label>
                    <span className="text-lg font-bold text-rose-700">
                      {inputs.physicalActivity} / 5
                    </span>
                 </div>
                 <div className="flex justify-between gap-2">
                   {[0, 1, 2, 3, 4, 5].map((val) => (
                     <button
                       key={val}
                       onClick={() => setInputs(prev => ({ ...prev, physicalActivity: val }))}
                       className={clsx(
                         "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                         inputs.physicalActivity === val
                           ? "bg-rose-600 text-white shadow-md transform -translate-y-1"
                           : "bg-white/50 text-gray-500 hover:bg-white"
                       )}
                     >
                       {val}
                     </button>
                   ))}
                 </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="md:col-span-5 relative">
            <div className="glass-panel p-6 sm:p-8 sticky top-6 flex flex-col h-full bg-gradient-to-b from-white/80 to-rose-50/40">
              
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                {!isCalculated ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6 w-full"
                  >
                    <Brain className="w-20 h-20 text-rose-200 mx-auto" strokeWidth={1} />
                    <h3 className="text-2xl font-black text-gray-800">Ready to Analyze</h3>
                    <p className="text-gray-500 text-sm">
                      Adjust your vitals and run the diagnostic models to see your risk profile.
                    </p>
                    <button
                      onClick={handlePredict}
                      disabled={loading}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-lg shadow-xl shadow-rose-600/30 transform transition hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                    >
                      {loading ? "Analyzing..." : "Run AI Diagnostics"}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full flex justify-center mt-3"
                  >
                    <button
                      onClick={handlePredict}
                      disabled={loading}
                      style={{
                         padding: "1rem"
                      }}
                      className="w-full py-4 text-center rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-lg shadow-xl shadow-rose-600/30 transform transition hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                    >
                       {loading ? "Recalculating..." : "? Recalculate"}
                    </button>
                  </motion.div>
                )}
                
                <AnimatePresence>
                  {isCalculated && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="w-full space-y-6 mt-8 p-3"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/60 rounded-2xl shadow-sm border border-gray-100/50 p-2">
                           <CircularProgress value={mlRisk} label="Classic ML" />
                        </div>
                        <div className="bg-white/60 rounded-2xl shadow-sm border border-gray-100/50 p-2 relative overflow-hidden">
                           <div className="absolute top-2 right-2 flex gap-1">
                             <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse delay-75" />
                           </div>
                           <CircularProgress value={dlRisk} label="Deep Neural Net" />
                        </div>
                      </div>

                      <div className="text-left bg-rose-50/50 p-4 rounded-xl text-sm text-rose-950 border border-rose-100">
                        <strong className="block mb-1 text-rose-900 flex items-center gap-2">
                          <Brain className="w-4 h-4" /> AI Insight
                        </strong>
                        The Neural Network (Deep Learning) accounts for complex non-linear interactions across your metrics, often providing a more nuanced risk score than classical algorithms.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
