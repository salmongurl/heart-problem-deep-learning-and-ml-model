"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type HealthInputs,
  predictRiskWithDeepLearning,
  predictRiskWithML,
  warmupDeepModel,
} from "@/lib/riskModels";

type NumericInputKey = Exclude<keyof HealthInputs, "smoker" | "diabetic">;

type PredictionRecord = {
  createdAt: string;
  finalRisk: number;
  mlRisk: number;
  deepRisk: number;
};

const numericInputConfig: Array<{
  key: NumericInputKey;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "age", label: "Age", min: 18, max: 100, step: 1 },
  {
    key: "restingHeartRate",
    label: "Resting Heart Rate (bpm)",
    min: 40,
    max: 160,
    step: 1,
  },
  {
    key: "systolicBP",
    label: "Systolic Blood Pressure",
    min: 80,
    max: 220,
    step: 1,
  },
  {
    key: "diastolicBP",
    label: "Diastolic Blood Pressure",
    min: 45,
    max: 140,
    step: 1,
  },
  { key: "bmi", label: "BMI", min: 14, max: 45, step: 0.1 },
  {
    key: "glucose",
    label: "Fasting Glucose (mg/dL)",
    min: 60,
    max: 320,
    step: 1,
  },
  {
    key: "cholesterol",
    label: "Cholesterol (mg/dL)",
    min: 90,
    max: 420,
    step: 1,
  },
  { key: "sleepHours", label: "Sleep (hours)", min: 3, max: 11, step: 0.1 },
  {
    key: "activityMinutes",
    label: "Daily Activity (minutes)",
    min: 0,
    max: 240,
    step: 1,
  },
];

const initialInputs: HealthInputs = {
  age: 46,
  restingHeartRate: 76,
  systolicBP: 132,
  diastolicBP: 84,
  bmi: 27.1,
  glucose: 118,
  cholesterol: 206,
  sleepHours: 6.3,
  activityMinutes: 35,
  smoker: false,
  diabetic: false,
};

const toPercent = (riskScore: number) => Math.round(riskScore * 1000) / 10;

function riskBand(riskScore: number): "Low" | "Moderate" | "High" {
  if (riskScore < 0.35) {
    return "Low";
  }

  if (riskScore < 0.65) {
    return "Moderate";
  }

  return "High";
}

function buildRecommendations(inputs: HealthInputs, riskScore: number): string[] {
  const advice: string[] = [];

  if (inputs.activityMinutes < 30) {
    advice.push("Increase movement to at least 30-45 minutes of brisk activity.");
  }
  if (inputs.sleepHours < 7) {
    advice.push("Aim for 7-8 hours of quality sleep to improve recovery.");
  }
  if (inputs.systolicBP > 130 || inputs.diastolicBP > 85) {
    advice.push("Track blood pressure daily and reduce sodium in meals.");
  }
  if (inputs.glucose > 110) {
    advice.push("Limit refined sugar and request fasting glucose follow-up testing.");
  }
  if (inputs.cholesterol > 200) {
    advice.push("Increase soluble fiber and discuss lipid profile monitoring.");
  }
  if (inputs.smoker) {
    advice.push("Start a smoke-cessation plan to reduce cardiovascular load.");
  }
  if (inputs.diabetic) {
    advice.push("Maintain strict glucose logging and medication adherence.");
  }
  if (riskScore > 0.7) {
    advice.push("High predicted risk: consult a clinician for full cardiac screening.");
  }

  return advice.length > 0
    ? advice
    : ["Current trend looks stable. Keep routine screening and healthy habits."];
}

export default function Home() {
  const [inputs, setInputs] = useState<HealthInputs>(initialInputs);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<PredictionRecord[]>([]);

  useEffect(() => {
    let active = true;

    warmupDeepModel()
      .then(() => {
        if (active) {
          setIsModelReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setError("Deep model warm-up failed. You can still use ML estimation.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const latest = records[0];

  const recommendations = useMemo(() => {
    if (!latest) {
      return ["Run your first prediction to get personalized guidance."];
    }

    return buildRecommendations(inputs, latest.finalRisk);
  }, [inputs, latest]);

  const updateNumericInput = (key: NumericInputKey, raw: string) => {
    const nextValue = Number(raw);

    if (Number.isNaN(nextValue)) {
      return;
    }

    setInputs((previous) => ({
      ...previous,
      [key]: nextValue,
    }));
  };

  const runPrediction = async () => {
    setIsPredicting(true);
    setError(null);

    try {
      const mlRisk = predictRiskWithML(inputs);
      const deepRisk = isModelReady
        ? await predictRiskWithDeepLearning(inputs)
        : mlRisk;
      const finalRisk = mlRisk * 0.45 + deepRisk * 0.55;

      setRecords((previous) => [
        {
          createdAt: new Date().toLocaleTimeString(),
          finalRisk,
          mlRisk,
          deepRisk,
        },
        ...previous,
      ]);
    } catch {
      setError("Prediction failed. Please retry in a moment.");
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 lg:px-12">
      <div className="ambient-bg" aria-hidden="true" />
      <main className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-panel p-6 sm:p-8">
          <p className="eyebrow">AI Health Console</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            Health Tracking with ML + Deep Learning Risk Prediction
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-700 sm:text-base">
            Enter your daily metrics to estimate cardiovascular risk probability.
            The score combines a classical ML estimator and a neural network model
            trained in-browser on synthetic clinical patterns.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {numericInputConfig.map((field) => (
              <label className="field" key={field.key}>
                <span>{field.label}</span>
                <input
                  type="number"
                  value={inputs[field.key]}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  onChange={(event) =>
                    updateNumericInput(field.key, event.currentTarget.value)
                  }
                />
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={`toggle ${inputs.smoker ? "is-active" : ""}`}
              onClick={() =>
                setInputs((previous) => ({ ...previous, smoker: !previous.smoker }))
              }
            >
              Smoker: {inputs.smoker ? "Yes" : "No"}
            </button>
            <button
              type="button"
              className={`toggle ${inputs.diabetic ? "is-active" : ""}`}
              onClick={() =>
                setInputs((previous) => ({
                  ...previous,
                  diabetic: !previous.diabetic,
                }))
              }
            >
              Diabetic: {inputs.diabetic ? "Yes" : "No"}
            </button>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runPrediction}
              className="action-btn"
              disabled={isPredicting}
            >
              {isPredicting ? "Predicting..." : "Predict Risk"}
            </button>
            <p className="text-sm text-slate-700">
              Deep Model: {isModelReady ? "Ready" : "Warming up..."}
            </p>
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </section>

        <section className="grid gap-6">
          <article className="glass-panel p-6 sm:p-7">
            <p className="eyebrow">Latest Assessment</p>
            {latest ? (
              <>
                <h2 className="mt-3 text-4xl font-semibold">
                  {toPercent(latest.finalRisk)}%
                </h2>
                <p className="mt-2 text-lg text-slate-700">
                  {riskBand(latest.finalRisk)} Risk
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="stat-chip">
                    <span>ML</span>
                    <strong>{toPercent(latest.mlRisk)}%</strong>
                  </div>
                  <div className="stat-chip">
                    <span>Deep</span>
                    <strong>{toPercent(latest.deepRisk)}%</strong>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-700">
                No prediction yet. Fill values and run the model.
              </p>
            )}
          </article>

          <article className="glass-panel p-6 sm:p-7">
            <p className="eyebrow">Trend</p>
            <div className="mt-4 space-y-3">
              {records.length === 0 ? (
                <p className="text-sm text-slate-700">
                  Trend appears after the first run.
                </p>
              ) : (
                records.slice(0, 5).map((record) => (
                  <div key={`${record.createdAt}-${record.finalRisk}`}>
                    <div className="mb-1 flex justify-between text-xs text-slate-600">
                      <span>{record.createdAt}</span>
                      <span>{toPercent(record.finalRisk)}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-300/60">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${Math.max(4, toPercent(record.finalRisk))}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="glass-panel p-6 sm:p-7">
            <p className="eyebrow">Recommendations</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-800">
              {recommendations.map((tip) => (
                <li key={tip} className="rounded-xl bg-white/65 px-3 py-2">
                  {tip}
                </li>
              ))}
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
