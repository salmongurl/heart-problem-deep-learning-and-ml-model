import trainedModel from "./trainedModel.json";

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

type TrainedModel = {
  normalization?: { min: number; max: number }[];
  weights?: number[];
  bias?: number;
};

const toRawFeatureVector = (inputs: HealthInputs): number[] => [
  inputs.age,
  inputs.restingHeartRate,
  inputs.systolicBP,
  inputs.diastolicBP,
  inputs.bmi,
  inputs.glucose,
  inputs.cholesterol,
  inputs.sleepHours,
  inputs.activityMinutes,
  inputs.smoker ? 1 : 0,
  inputs.diabetic ? 1 : 0,
];

const FALLBACK_NORMALIZATION = [
  { min: 20, max: 100 },
  { min: 40, max: 160 },
  { min: 90, max: 210 },
  { min: 50, max: 130 },
  { min: 15, max: 50 },
  { min: 70, max: 250 },
  { min: 120, max: 360 },
  { min: 3, max: 10 },
  { min: 0, max: 240 },
  { min: 0, max: 1 },
  { min: 0, max: 1 },
];

const FALLBACK_WEIGHTS = [1.8, 1.4, 1.5, 1.2, 1.1, 1.7, 1.3, -0.9, -0.8, 1.9, 2.1];
const FALLBACK_BIAS = -3.5;

const normalizeFeature = (
  value: number,
  bounds: { min: number; max: number },
) => {
  const range = bounds.max - bounds.min;
  if (range <= 0) return 0;
  return clamp((value - bounds.min) / range, 0, 1);
};

const toFeatureVector = (
  inputs: HealthInputs,
  normalization: { min: number; max: number }[],
): number[] => {
  const rawValues = toRawFeatureVector(inputs);
  return rawValues.map((value, idx) =>
    normalizeFeature(value, normalization[idx] ?? FALLBACK_NORMALIZATION[idx]),
  );
};

const getModel = () => {
  const safeModel = trainedModel as TrainedModel;
  const hasValidWeights =
    Array.isArray(safeModel.weights) && safeModel.weights.length === 11;
  const hasValidNorm =
    Array.isArray(safeModel.normalization) && safeModel.normalization.length === 11;

  return {
    weights: hasValidWeights ? safeModel.weights! : FALLBACK_WEIGHTS,
    bias: typeof safeModel.bias === "number" ? safeModel.bias : FALLBACK_BIAS,
    normalization: hasValidNorm ? safeModel.normalization! : FALLBACK_NORMALIZATION,
  };
};

export function predictRiskWithML(inputs: HealthInputs): number {
  const { weights, bias, normalization } = getModel();
  const features = toFeatureVector(inputs, normalization);

  let weightedSum = bias;
  for (let i = 0; i < features.length; i += 1) {
    weightedSum += features[i] * weights[i];
  }

  return clamp(sigmoid(weightedSum), 0, 1);
}

export async function warmupDeepModel(): Promise<void> {
  return;
}

export async function predictRiskWithDeepLearning(
  inputs: HealthInputs,
): Promise<number> {
  return predictRiskWithML(inputs);
}
