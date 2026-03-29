"use client";

import { motion } from "framer-motion";
import {
  Database,
  Network,
  LineChart,
  Cpu,
  BookOpen,
  Activity,
} from "lucide-react";

export default function ResearchPage() {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 flex flex-col items-center max-w-5xl mx-auto w-full pointer-events-none">
      <div className="text-center space-y-4 max-w-2xl mx-auto mb-10 pointer-events-auto">
        <div className="w-16 h-16 bg-white/50 backdrop-blur rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <BookOpen className="w-8 h-8 text-indigo-500" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">
          Model{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
            Methodology
          </span>
        </h1>
        <p className="text-gray-600 font-medium">
          Understand the mathematical foundation and neural architecture
          powering CardioRisk AI.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full space-y-6 pointer-events-auto"
      >
        <motion.div variants={item} className="grid md:grid-cols-2 gap-6">
          <div className="glass-panel p-8 group hover:bg-white/80 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-rose-50 rounded-xl">
                <LineChart className="w-6 h-6 text-rose-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Classical ML (Logistic Regression)
              </h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Our baseline model is logistic regression trained from the
              bundled heart disease CSV. It learns coefficients for age,
              resting blood pressure, cholesterol, and fasting blood sugar,
              then performs low-latency inference directly in the browser.
              The result is interpretable and reproducible while still being
              fast enough for live UI updates.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-100 text-xs font-bold text-gray-600 rounded-md">
                Linear Algebra
              </span>
              <span className="px-3 py-1 bg-gray-100 text-xs font-bold text-gray-600 rounded-md">
                High Interpretability
              </span>
            </div>
          </div>

          <div className="glass-panel p-8 group hover:bg-white/80 transition-colors border-indigo-100/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Network className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Deep Neural Network
              </h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              A secondary non-linear estimator is layered on top of the trained
              logistic baseline to approximate interaction effects among
              lifestyle factors like smoking, activity level, sleep, and
              glucose. This gives a deep-like comparison score without
              requiring heavyweight runtime model files.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-indigo-50 text-xs font-bold text-indigo-700 rounded-md">
                TensorFlow.js
              </span>
              <span className="px-3 py-1 bg-indigo-50 text-xs font-bold text-indigo-700 rounded-md">
                Non-linear Patterns
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="glass-panel p-8 border-t-4 border-indigo-500"
        >
          <div className="flex items-start gap-6">
            <div className="hidden sm:flex p-4 bg-gray-50 rounded-2xl">
              <Database className="w-8 h-8 text-gray-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Simulated Dataset Information
              </h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                The current implementation uses parameters trained from the
                bundled heart disease dataset and runs inference directly in the
                browser. This keeps predictions fast while avoiding transmission
                of sensitive health data to an external inference service.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                  <Cpu className="w-5 h-5 text-gray-400 mb-2" />
                  <div className="text-xs text-gray-500 font-bold uppercase mb-1">
                    Architecture
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    Trained Logistic + Calibrated Non-linear Head
                  </div>
                </div>
                <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                  <Network className="w-5 h-5 text-gray-400 mb-2" />
                  <div className="text-xs text-gray-500 font-bold uppercase mb-1">
                    Dataset
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    UCI Heart (918 rows)
                  </div>
                </div>
                <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                  <Activity className="w-5 h-5 text-gray-400 mb-2" />
                  <div className="text-xs text-gray-500 font-bold uppercase mb-1">
                    Inference
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    Browser-side, no external API
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="text-center text-xs text-gray-400 font-medium py-8"
        >
          Disclaimer: This application does not provide real medical diagnoses.
          Weights and inferences are simulated and intended for demonstration of
          modern web ML architectures.
        </motion.div>
      </motion.div>
    </div>
  );
}
