"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";
import {
  HealthInputs,
  predictRiskWithDeepLearning,
  predictRiskWithML,
} from "../../lib/riskModels";

type ModelView = "ml" | "dl";

export default function PredictionPage() {
  const [modelView, setModelView] = useState<ModelView>("dl");
  const [calculating, setCalculating] = useState(false);
  const [inputs, setInputs] = useState<HealthInputs>({
    age: 44,
    restingHeartRate: 72,
    systolicBP: 132,
    diastolicBP: 84,
    bmi: 26.4,
    glucose: 96,
    cholesterol: 208,
    sleepHours: 6.9,
    activityMinutes: 90,
    smoker: false,
    diabetic: false,
  });
  const [risks, setRisks] = useState<{ ml: number; dl: number } | null>(null);

  const riskYears = useMemo(() => [0, 2, 4, 6, 8, 10], []);

  const selectedBaseRisk = risks ? (modelView === "dl" ? risks.dl : risks.ml) : null;

  const trajectory = useMemo(() => {
    if (!selectedBaseRisk) return null;

    return riskYears.map((year) => {
      if (year === 0) return selectedBaseRisk;

      const ageFactor = (year / 10) * 0.11;
      const pressureFactor = ((inputs.systolicBP - 120) / 75) * (year / 10) * 0.16;
      const cholesterolFactor =
        ((inputs.cholesterol - 180) / 120) * (year / 10) * 0.1;
      const glucoseFactor = ((inputs.glucose - 95) / 80) * (year / 10) * 0.08;
      const smokerFactor = inputs.smoker ? 0.018 * year : 0;
      const diabeticFactor = inputs.diabetic ? 0.015 * year : 0;
      const sleepProtection = ((inputs.sleepHours - 7) / 3.5) * (year / 10) * 0.09;
      const activityProtection =
        ((inputs.activityMinutes - 120) / 210) * (year / 10) * 0.17;

      const projected =
        selectedBaseRisk +
        ageFactor +
        pressureFactor +
        cholesterolFactor +
        glucoseFactor +
        smokerFactor +
        diabeticFactor -
        sleepProtection -
        activityProtection;

      return Math.min(0.98, Math.max(0.02, projected));
    });
  }, [riskYears, selectedBaseRisk, inputs]);

  const riskLabel = (risk: number) => {
    if (risk < 0.25) return "Low";
    if (risk < 0.5) return "Moderate";
    if (risk < 0.75) return "Elevated";
    return "High";
  };

  const riskColorClass = (risk: number) => {
    if (risk < 0.25) return "text-emerald-600";
    if (risk < 0.5) return "text-amber-600";
    if (risk < 0.75) return "text-orange-600";
    return "text-rose-600";
  };

  const handleNumber = (key: keyof HealthInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handlePredict = async () => {
    setCalculating(true);
    try {
      const ml = predictRiskWithML(inputs);
      const dl = await predictRiskWithDeepLearning(inputs);
      setRisks({ ml, dl });
    } finally {
      setCalculating(false);
    }
  };

  const topInsights = useMemo(() => {
    const insights: string[] = [];
    if (inputs.systolicBP > 135) insights.push("Raised blood pressure is lifting projected risk.");
    if (inputs.cholesterol > 220) insights.push("Higher cholesterol contributes to long-term progression.");
    if (inputs.activityMinutes < 90) insights.push("Low weekly activity reduces protective effect.");
    if (inputs.sleepHours < 6.5) insights.push("Sleep duration is below the protective range.");
    if (inputs.smoker) insights.push("Smoking status increases cardiovascular burden each year.");
    if (inputs.diabetic || inputs.glucose > 125)
      insights.push("Glycemic load is increasing the risk curve.");
    if (insights.length === 0)
      insights.push("Current profile is balanced; maintain sleep and activity consistency.");
    return insights.slice(0, 3);
  }, [inputs]);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 flex flex-col items-center max-w-6xl mx-auto w-full pointer-events-none">
      <div className="w-full grid lg:grid-cols-12 gap-6 pointer-events-auto">
        <section className="glass-panel p-6 sm:p-8 lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="w-14 h-14 bg-white/60 rounded-2xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-7 h-7 text-amber-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              Model-Based <span className="text-amber-500">Risk Forecast</span>
            </h1>
            <p className="text-gray-600 font-medium text-sm sm:text-base">
              Uses your trained dataset model for baseline prediction, then projects a 10-year trajectory from your current lifestyle profile.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setModelView("ml")}
              className={clsx(
                "rounded-xl border px-4 py-3 text-sm font-bold transition-all",
                modelView === "ml"
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-white/70 border-gray-200 text-gray-500 hover:bg-white",
              )}
            >
              Classic ML View
            </button>
            <button
              onClick={() => setModelView("dl")}
              className={clsx(
                "rounded-xl border px-4 py-3 text-sm font-bold transition-all",
                modelView === "dl"
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-white/70 border-gray-200 text-gray-500 hover:bg-white",
              )}
            >
              Deep Hybrid View
            </button>
          </div>

          <div className="space-y-4">
            <InputRow label="Age" value={inputs.age} min={18} max={100} step={1} onChange={(v) => handleNumber("age", v)} unit="yrs" />
            <InputRow label="Systolic BP" value={inputs.systolicBP} min={90} max={220} step={1} onChange={(v) => handleNumber("systolicBP", v)} unit="mmHg" />
            <InputRow label="Cholesterol" value={inputs.cholesterol} min={120} max={380} step={1} onChange={(v) => handleNumber("cholesterol", v)} unit="mg/dL" />
            <InputRow label="BMI" value={inputs.bmi} min={15} max={50} step={0.1} onChange={(v) => handleNumber("bmi", v)} unit="" />
            <InputRow label="Glucose" value={inputs.glucose} min={70} max={260} step={1} onChange={(v) => handleNumber("glucose", v)} unit="mg/dL" />
            <InputRow label="Sleep" value={inputs.sleepHours} min={3} max={10} step={0.1} onChange={(v) => handleNumber("sleepHours", v)} unit="hrs" />
            <InputRow label="Weekly Activity" value={inputs.activityMinutes} min={0} max={360} step={10} onChange={(v) => handleNumber("activityMinutes", v)} unit="min" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Toggle
              active={inputs.smoker}
              onClick={() => setInputs((prev) => ({ ...prev, smoker: !prev.smoker }))}
              title="Smoker"
            />
            <Toggle
              active={inputs.diabetic}
              onClick={() => setInputs((prev) => ({ ...prev, diabetic: !prev.diabetic, glucose: !prev.diabetic ? 138 : 98 }))}
              title="Diabetes"
            />
          </div>

          <button
            onClick={handlePredict}
            disabled={calculating}
            className="w-full bg-amber-500 hover:bg-amber-400 text-white font-black py-3 px-8 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {calculating ? "Calculating Risk..." : "Run Prediction"}
          </button>
        </section>

        <section className="glass-panel p-6 sm:p-8 lg:col-span-7 space-y-6">
          {!trajectory ? (
            <div className="min-h-105 flex items-center justify-center text-center px-6">
              <div className="space-y-3">
                <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-gray-600 font-semibold">
                  Configure your profile and run prediction to view the data-driven 10-year trajectory.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <RiskCard title="Classic ML" value={risks?.ml ?? 0} tone="rose" label={riskLabel} riskColorClass={riskColorClass} />
                <RiskCard title="Deep Hybrid" value={risks?.dl ?? 0} tone="amber" label={riskLabel} riskColorClass={riskColorClass} />
              </div>

              <div className="relative min-h-75 flex items-end justify-between px-4 pb-12 pt-8 rounded-2xl border border-gray-100 bg-white/65">
                {trajectory.map((risk, index) => {
                  const heightPercentage = Math.min((risk * 100), 100);
                  const isHigh = risk > 0.5;

                  return (
                    <div key={riskYears[index]} className="flex flex-col items-center relative z-10 w-full group">
                      <span
                        className={clsx(
                          "font-bold text-sm mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8",
                          isHigh ? "text-rose-600" : "text-emerald-600",
                        )}
                      >
                        {(risk * 100).toFixed(1)}%
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercentage}%` }}
                        transition={{ duration: 0.7, delay: index * 0.08, type: "spring", stiffness: 95 }}
                        className={clsx(
                          "w-10 sm:w-14 rounded-t-lg relative overflow-hidden",
                          isHigh
                            ? "bg-linear-to-t from-rose-400 to-rose-500"
                            : "bg-linear-to-t from-emerald-400 to-emerald-500",
                        )}
                        style={{ minHeight: "20px", height: "0%" }}
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

                <div className="absolute left-4 right-4 top-0 bottom-12 border-l border-b border-gray-200/60 pointer-events-none" />
                {[25, 50, 75].map((line) => (
                  <div
                    key={line}
                    className="absolute left-4 right-4 border-b border-dashed border-gray-200/50"
                    style={{ bottom: `${line}%` }}
                  >
                    <span className="text-[10px] text-gray-400 font-bold -translate-x-8 inline-block">{line}%</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-linear-to-r from-rose-50 to-amber-50 border border-rose-100 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5" />
                  <p className="text-sm text-gray-700 font-medium">
                    In {modelView.toUpperCase()} mode, your projected 10-year risk change is {((trajectory[trajectory.length - 1] - trajectory[0]) * 100).toFixed(1)} points.
                  </p>
                </div>
                <div className="space-y-2">
                  {topInsights.map((line) => (
                    <div key={line} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function InputRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: string) => void;
  unit: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <span className="text-sm font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md">
          {step < 1 ? value.toFixed(1) : Math.round(value)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="range-slider"
      />
    </div>
  );
}

function Toggle({
  active,
  onClick,
  title,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-xl border px-4 py-3 text-sm font-bold transition-all",
        active
          ? "bg-rose-50 border-rose-200 text-rose-700"
          : "bg-white/70 border-gray-200 text-gray-500 hover:bg-white",
      )}
    >
      {title}: {active ? "Yes" : "No"}
    </button>
  );
}

function RiskCard({
  title,
  value,
  tone,
  label,
  riskColorClass,
}: {
  title: string;
  value: number;
  tone: "rose" | "amber";
  label: (risk: number) => string;
  riskColorClass: (risk: number) => string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border p-4",
        tone === "rose" ? "bg-rose-50/60 border-rose-100" : "bg-amber-50/60 border-amber-100",
      )}
    >
      <div className="text-xs font-black text-gray-500 uppercase tracking-wide">{title}</div>
      <div className={clsx("text-3xl font-black mt-1", riskColorClass(value))}>
        {(value * 100).toFixed(1)}%
      </div>
      <div className="text-sm font-semibold text-gray-600 mt-1">{label(value)} Risk</div>
    </div>
  );
}
