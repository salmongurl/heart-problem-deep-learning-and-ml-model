"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  HeartPulse,
  Activity,
  ArrowRight,
  ActivitySquare,
} from "lucide-react";

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto min-h-[82vh] px-6 lg:px-10 xl:px-12 pointer-events-none">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid xl:grid-cols-2 gap-10 xl:gap-16 items-center h-full pointer-events-auto"
      >
        <div className="space-y-12 text-center xl:text-left">
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-rose-50/80 border border-rose-100 text-rose-900 px-4 py-2 rounded-full font-bold text-sm shadow-sm backdrop-blur">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              Powered by TensorFlow.js & Classic ML
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-tight font-headline">
              The Future of {" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-red-600 to-rose-700">
                Cardiac Health Risk
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl xl:mx-0 mx-auto leading-relaxed">
              Harness the power of AI to analyze your vitals, detect patterns,
              and anticipate cardiovascular risks with our dual-network
              approach.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center xl:items-start justify-center xl:justify-start gap-4"
          >
            <Link href="/diagnosis" className="group relative w-full sm:w-auto">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-red-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
              <button className="relative w-full sm:w-auto bg-gradient-to-r from-rose-600 to-red-600 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-xl">
                Get Started{" "}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/research">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-rose-900 bg-white/50 backdrop-blur hover:bg-white/80 border border-rose-100/50 transition-all">
                <BrainCircuit className="w-5 h-5" /> Read the Research
              </button>
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pt-6"
          >
            {[
              {
                title: "Diagnostic Tools",
                desc: "Input real-time vitals into our interactive UI.",
                icon: <Activity className="w-6 h-6 text-rose-500" />,
                link: "/diagnosis",
              },
              {
                title: "ML Predictions",
                desc: "View future health trajectories over 10 years.",
                icon: <ActivitySquare className="w-6 h-6 text-amber-500" />,
                link: "/prediction",
              },
              {
                title: "Neural Networks",
                desc: "Learn about the TensorFlow model architectures.",
                icon: <BrainCircuit className="w-6 h-6 text-indigo-500" />,
                link: "/research",
              },
            ].map((feature, i) => (
              <Link
                key={i}
                href={feature.link}
                className="glass-panel p-6 text-left group hover:bg-white/80 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm font-medium">
                  {feature.desc}
                </p>
              </Link>
            ))}
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="hidden xl:flex items-end justify-end h-full"
        >
          <div className="w-full max-w-md h-[520px] rounded-3xl border border-rose-200/30 bg-gradient-to-br from-white/10 via-rose-100/5 to-transparent backdrop-blur-[2px]" />
        </motion.div>
      </motion.div>
    </div>
  );
}
