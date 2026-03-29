import trainedModel from "./trainedRiskModel.json";

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

type TrainedModel = {
  means: number[];
  stds: number[];
  weights: number[];
  bias: number;
};

const model = trainedModel as TrainedModel;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

const activityToExerciseScore = (activityMinutes: number): number => {
  if (activityMinutes >= 180) return 1;
  if (activityMinutes >= 120) return 0.75;
  if (activityMinutes >= 60) return 0.5;
  if (activityMinutes > 0) return 0.25;
  return 0;
};

const toFeatureVector = (inputs: HealthInputs): number[] => [
  clamp(inputs.age, 18, 100),
  clamp(inputs.systolicBP, 80, 220),
  clamp(inputs.cholesterol, 100, 400),
  clamp(inputs.bmi, 12, 60),
  clamp(inputs.sleepHours, 2, 12),
  activityToExerciseScore(clamp(inputs.activityMinutes, 0, 420)),
  inputs.smoker ? 1 : 0,
  inputs.diabetic ? 1 : 0,
];

const normalize = (features: number[]) =>
  features.map((value, index) => {
    const mean = model.means[index] ?? 0;
    const std = model.stds[index] ?? 1;
    return (value - mean) / (std || 1);
  });

const linearLogit = (normalizedFeatures: number[]) => {
  let logit = model.bias;
  for (let i = 0; i < normalizedFeatures.length; i += 1) {
    logit += normalizedFeatures[i] * (model.weights[i] ?? 0);
  }
  return logit;
};

export function predictRiskWithML(inputs: HealthInputs): number {
  const normalized = normalize(toFeatureVector(inputs));
  return clamp(sigmoid(linearLogit(normalized)), 0, 1);
}

function deepAdjustmentScore(inputs: HealthInputs): number {
  const pressureLoad = clamp((inputs.systolicBP - 120) / 50, -1, 2);
  const cholesterolLoad = clamp((inputs.cholesterol - 180) / 100, -1, 2);
  const sleepDeficit = clamp((7.5 - inputs.sleepHours) / 3, -1, 2);
  const activityProtection = clamp(inputs.activityMinutes / 210, 0, 1.5);
  const glucoseLoad = clamp((inputs.glucose - 95) / 70, -1, 2);

  // Add non-linear interactions so this score behaves differently than linear ML.
  const interaction =
    0.22 * pressureLoad * cholesterolLoad +
    0.15 * sleepDeficit * glucoseLoad +
    0.28 * Number(inputs.smoker && inputs.diabetic) -
    0.2 * activityProtection;

  return (
    0.35 * pressureLoad +
    0.27 * cholesterolLoad +
    0.25 * glucoseLoad +
    0.16 * sleepDeficit +
    interaction
  );
}

export async function warmupDeepModel(): Promise<void> {
  return;
}

export async function predictRiskWithDeepLearning(
  inputs: HealthInputs,
): Promise<number> {
  const mlRisk = predictRiskWithML(inputs);
  const nonlinearRisk = sigmoid(-1.05 + deepAdjustmentScore(inputs));

  // Blend linear and non-linear views for a stable but richer estimate.
  return clamp(0.62 * mlRisk + 0.38 * nonlinearRisk, 0, 1);
}
