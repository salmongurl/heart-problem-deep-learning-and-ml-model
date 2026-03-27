"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Activity,
  BrainCircuit,
  BookOpen,
  Home,
} from "lucide-react";
import clsx from "clsx";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/diagnosis", label: "Diagnosis", icon: Activity },
    { href: "/prediction", label: "Prediction", icon: BrainCircuit },
    { href: "/research", label: "Research", icon: BookOpen },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex justify-center pt-4 sm:pt-6 px-4 pointer-events-none">
      <div className="glass-panel p-2 flex items-center gap-2 rounded-2xl pointer-events-auto shadow-lg bg-white/70">
        <div className="flex items-center gap-2 pr-4 pl-2 border-r border-rose-100 mr-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-inner shadow-rose-900/20">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-gray-800 hidden sm:block font-headline">
            CardioRisk
          </span>
        </div>

        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "relative flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-sm font-bold transition-colors",
                isActive
                  ? "text-rose-950"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-rose-100/60 rounded-xl border border-rose-200/50"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <link.icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10 hidden sm:block">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
