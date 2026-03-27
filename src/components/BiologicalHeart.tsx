"use client";

import { motion } from "framer-motion";

export default function BiologicalHeart() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden mix-blend-multiply opacity-[0.04]">
      <motion.svg
        animate={{ 
          scale: [1, 1.03, 1, 1.06, 1],
          opacity: [0.8, 1, 0.8, 1, 0.8]
        }}
        transition={{ 
          duration: 1.4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        viewBox="0 0 500 500"
        className="w-[150vw] h-[150vh] max-w-[900px] max-h-[900px] text-rose-900 drop-shadow-2xl"
        fill="none"
      >
        <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          {/* Right Atrium & Superior/Inferior Vena Cava */}
          <path d="M 180 120 C 180 80, 200 60, 220 50 C 230 100, 230 130, 210 160 C 150 180, 130 220, 140 280 C 145 310, 170 340, 190 350 C 170 380, 180 430, 190 460 C 200 420, 200 390, 210 370" />
          {/* Aorta Arch */}
          <path d="M 230 150 C 230 80, 280 20, 320 20 C 360 20, 380 60, 380 110 L 370 170" />
          {/* Pulmonary Artery */}
          <path d="M 260 160 C 260 120, 310 90, 340 120 L 390 140" />
          <path d="M 310 105 L 290 85" />
          {/* Left Ventricle & Main Body */}
          <path d="M 210 160 C 280 160, 330 170, 370 200 C 430 260, 410 350, 350 410 C 290 470, 210 490, 190 460 C 170 430, 130 310, 140 280" />
          {/* Descending inner branches / Valve separators */}
          <path d="M 250 190 C 260 250, 290 300, 330 350" />
          <path d="M 270 220 C 230 280, 210 350, 200 400" />
          <path d="M 310 240 C 300 280, 260 350, 240 430" />
          {/* Biological vein fractals */}
          <path d="M 300 280 C 330 300, 350 280, 370 270" strokeWidth="2" />
          <path d="M 260 320 C 280 340, 300 330, 320 320" strokeWidth="2" />
          <path d="M 230 310 C 210 300, 190 310, 170 300" strokeWidth="2" />
          <path d="M 230 270 C 210 250, 180 260, 160 250" strokeWidth="2" />
        </g>
      </motion.svg>
    </div>
  );
}