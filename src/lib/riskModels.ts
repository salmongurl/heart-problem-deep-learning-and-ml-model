import { trainedHeartModel } from "./trainedHeartModel";
import { trainedDeepHeartModel } from "./trainedDeepHeartModel";

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
const relu = (x: number) => (x > 0 ? x : 0);

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

function deepDatasetProbability(inputs: HealthInputs): number {
  const fastingBS = Number(inputs.diabetic || inputs.glucose >= 120);
  const rawFeatures = [inputs.age, inputs.systolicBP, inputs.cholesterol, fastingBS];

  const x = rawFeatures.map((value, idx) => {
    const mean = trainedDeepHeartModel.means[idx];
    const std = trainedDeepHeartModel.stds[idx] || 1;
    return (value - mean) / std;
  });

  const a1 = trainedDeepHeartModel.W1.map((row, rowIdx) => {
    let z = trainedDeepHeartModel.b1[rowIdx];
    for (let i = 0; i < row.length; i += 1) {
      z += row[i] * x[i];
    }
    return relu(z);
  });

  const a2 = trainedDeepHeartModel.W2.map((row, rowIdx) => {
    let z = trainedDeepHeartModel.b2[rowIdx];
    for (let i = 0; i < row.length; i += 1) {
      z += row[i] * a1[i];
    }
    return relu(z);
  });

  let z3 = trainedDeepHeartModel.b3;
  for (let i = 0; i < trainedDeepHeartModel.W3.length; i += 1) {
    z3 += trainedDeepHeartModel.W3[i] * a2[i];
  }

  return sigmoid(z3);
}

export async function predictRiskWithDeepLearning(
  inputs: HealthInputs,
): Promise<number> {
  const deepCore = deepDatasetProbability(inputs);

  // Same lifestyle calibration envelope used by the ML scorer, but with
  // slightly stronger interaction effect for the deep model output.
  const smokerBoost = inputs.smoker ? 0.1 : 0;
  const bmiBoost = clamp((inputs.bmi - 27) / 34, -0.06, 0.15);
  const sleepBoost = clamp((7 - inputs.sleepHours) / 18, -0.05, 0.08);
  const inactivityBoost = clamp((120 - inputs.activityMinutes) / 390, -0.08, 0.11);
  const glucoseBoost = clamp((inputs.glucose - 110) / 480, -0.02, 0.09);
  const diabetesSmokerInteraction =
    inputs.diabetic && inputs.smoker ? 0.03 : 0;

  return clamp(
    deepCore +
      smokerBoost +
      bmiBoost +
      sleepBoost +
      inactivityBoost +
      glucoseBoost +
      diabetesSmokerInteraction,
    0,
    1,
  );
}
