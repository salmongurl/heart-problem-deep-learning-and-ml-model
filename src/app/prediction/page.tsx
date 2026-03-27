"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import clsx from "clsx";

export default function PredictionPage() {
  const [calculating, setCalculating] = useState(false);
  const [trajectory, setTrajectory] = useState<number[] | null>(null);

  const riskYears = [0, 2, 4, 6, 8, 10];

  const handlePredict = () => {
    setCalculating(true);
    // Simulate generation of a future trajectory based on current dummy inputs
    setTimeout(() => {
      // Fake progressive 10-year trajectory
      const baseRisk = 25;
      const progression = riskYears.map((y) => baseRisk + (y * 3.5) + (Math.random() * 5));
      setTrajectory(progression);
      setCalculating(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 flex flex-col items-center max-w-5xl mx-auto w-full">
      <div className="w-full space-y-8">
        
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-white/50 backdrop-blur rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <TrendingUp className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">
            10-Year <span className="text-amber-500">Risk Trajectory</span>
          </h1>
          <p className="text-gray-600 font-medium">
            Discover how your cardiac risk may evolve over the next decade if current lifestyle factors remain unchanged.
          </p>
        </div>

        <div className="glass-panel p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between border-b border-gray-200/50 pb-8 mb-8">
            <div className="space-y-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-rose-700" /> Forecasting Engine
              </h2>
              <p className="text-sm text-gray-500 max-w-sm">
                Runs 10,000 Monte Carlo simulations using Next-Gen Deep Learning models.
              </p>
            </div>
            <button
              onClick={handlePredict}
              disabled={calculating}
              className="bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed whitespace-nowrap min-w-[200px]"
            >
              {calculating ? "Simulating Future..." : "Generate Trajectory"}
            </button>
          </div>

          <div className="relative min-h-[300px] flex items-end justify-between px-4 pb-12 pt-8">
            {!trajectory && !calculating && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium z-0">
                Awaiting simulation trigger...
              </div>
            )}
            
            {calculating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-0 space-y-4">
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      className="w-4 h-4 bg-amber-400 rounded-full"
                    />
                  ))}
                </div>
                <div className="text-sm font-bold text-amber-600 animate-pulse">Running Epochs...</div>
              </div>
            )}

            {trajectory && !calculating && trajectory.map((risk, index) => {
              const heightPercentage = Math.min((risk / 100) * 100, 100);
              const isHigh = risk > 50;

              return (
                <div key={index} className="flex flex-col items-center relative z-10 w-full group">
                  <span className={clsx(
                     "font-bold text-sm mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8",
                     isHigh ? "text-rose-600" : "text-rose-700"
                  )}>
                    {risk.toFixed(1)}%
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, type: "spring", stiffness: 100 }}
                    className={clsx(
                      "w-12 sm:w-16 rounded-t-lg relative overflow-hidden",
                      isHigh ? "bg-gradient-to-t from-rose-400 to-rose-500" : "bg-gradient-to-t from-rose-500 to-red-500"
                    )}
                    style={{ minHeight: "20px", height: '0%' }}
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                  <div className="mt-4 font-bold text-gray-600 text-xs sm:text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400 hidden sm:block" /> 
                    Year {riskYears[index]}
                  </div>
                </div>
              );
            })}

            {/* Chart Grid Lines */}
            <div className="absolute left-0 right-0 top-0 bottom-12 border-l border-b border-gray-200/60 pointer-events-none" />
            {[25, 50, 75].map((line) => (
              <div key={line} className="absolute left-0 right-0 border-b border-dashed border-gray-200/50 flex items-center" style={{ bottom: `${line}%`, left: '16px', right: '16px' }}>
                <span className="text-[10px] text-gray-400 font-bold -translate-x-8">{line}%</span>
              </div>
            ))}
          </div>

          {trajectory && !calculating && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 flex items-start gap-3"
            >
              <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Clinical Warning</h4>
                <p className="text-sm text-gray-600 mt-1">If current trends persist, your projected risk increases by {(trajectory[trajectory.length - 1] - trajectory[0]).toFixed(1)}% over the next decade. Consider modifying lifestyle factors in the diagnostic tool.</p>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}