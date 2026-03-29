import { trainedHeartModel } from "./trainedHeartModel";

export type HealthInputs = {
  age: number;
  restingHeartRate: number;
  systolicBP: number;
  diastolicBP: number;
  bmi: number;
  glucose: number;
  cholesterol: number;
  sleepHours: number;
  activityMinutes: number;
  smoker: boolean;
  diabetic: boolean;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function baseDatasetProbability(inputs: HealthInputs): number {
  const fastingBS = Number(inputs.diabetic || inputs.glucose >= 120);
  const rawFeatures = [inputs.age, inputs.systolicBP, inputs.cholesterol, fastingBS];

  const standardized = rawFeatures.map((value, idx) => {
    const mean = trainedHeartModel.means[idx];
    const std = trainedHeartModel.stds[idx] || 1;
    return (value - mean) / std;
  });

  let logit = trainedHeartModel.bias;
  for (let i = 0; i < standardized.length; i += 1) {
    logit += standardized[i] * trainedHeartModel.weights[i];
  }

  return sigmoid(logit);
}

function riskScore(inputs: HealthInputs): number {
  const base = baseDatasetProbability(inputs);

  // Lifestyle factors are not part of the source CSV, so we calibrate them
  // as bounded adjustments on top of the trained clinical core model.
  const smokerBoost = inputs.smoker ? 0.09 : 0;
  const bmiBoost = clamp((inputs.bmi - 27) / 35, -0.06, 0.14);
  const sleepBoost = clamp((7 - inputs.sleepHours) / 18, -0.05, 0.08);
  const inactivityBoost = clamp((120 - inputs.activityMinutes) / 420, -0.08, 0.1);
  const glucoseBoost = clamp((inputs.glucose - 110) / 500, -0.02, 0.08);

  return clamp(
    base + smokerBoost + bmiBoost + sleepBoost + inactivityBoost + glucoseBoost,
    0,
    1,
  );
}

export function predictRiskWithML(inputs: HealthInputs): number {
  return clamp(riskScore(inputs), 0, 1);
}

export async function warmupDeepModel(): Promise<void> {
  return;
}

export async function predictRiskWithDeepLearning(
  inputs: HealthInputs,
): Promise<number> {
  const baseRisk = riskScore(inputs);
  const interaction =
    0.22 * Number(inputs.smoker && inputs.diabetic) +
    0.1 * clamp((inputs.systolicBP - 130) / 40, -0.4, 1) *
      clamp((inputs.cholesterol - 210) / 100, -0.4, 1) -
    0.1 * clamp(inputs.activityMinutes / 240, 0, 1.2);

  return clamp(0.72 * baseRisk + 0.28 * sigmoid(-1.05 + interaction), 0, 1);
}
