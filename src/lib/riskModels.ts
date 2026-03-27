import * as tf from "@tensorflow/tfjs";

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

const toFeatureVector = (inputs: HealthInputs): number[] => [
  clamp(inputs.age / 100, 0, 1),
  clamp((inputs.restingHeartRate - 40) / 120, 0, 1),
  clamp((inputs.systolicBP - 90) / 120, 0, 1),
  clamp((inputs.diastolicBP - 50) / 80, 0, 1),
  clamp((inputs.bmi - 15) / 35, 0, 1),
  clamp((inputs.glucose - 70) / 180, 0, 1),
  clamp((inputs.cholesterol - 120) / 240, 0, 1),
  clamp((10 - inputs.sleepHours) / 10, 0, 1),
  clamp((180 - inputs.activityMinutes) / 180, 0, 1),
  inputs.smoker ? 1 : 0,
  inputs.diabetic ? 1 : 0,
];

export function predictRiskWithML(inputs: HealthInputs): number {
  const features = toFeatureVector(inputs);
  const weights = [
    1.8, 1.4, 1.5, 1.2, 1.1, 1.7, 1.3, 0.9, 0.8, 1.9, 2.1,
  ];

  let weightedSum = -3.5;
  for (let i = 0; i < features.length; i += 1) {
    weightedSum += features[i] * weights[i];
  }

  return clamp(sigmoid(weightedSum), 0, 1);
}

function createSyntheticSample(): { features: number[]; label: number } {
  const age = 20 + Math.random() * 65;
  const restingHeartRate = 52 + Math.random() * 55;
  const systolicBP = 95 + Math.random() * 70;
  const diastolicBP = 58 + Math.random() * 45;
  const bmi = 18 + Math.random() * 22;
  const glucose = 80 + Math.random() * 130;
  const cholesterol = 130 + Math.random() * 170;
  const sleepHours = 4.5 + Math.random() * 4.5;
  const activityMinutes = Math.random() * 210;
  const smoker = Math.random() > 0.82;
  const diabetic = Math.random() > 0.87;

  const mlLikeSignal =
    0.025 * age +
    0.03 * restingHeartRate +
    0.05 * (systolicBP - 100) +
    0.03 * (diastolicBP - 60) +
    0.08 * (bmi - 20) +
    0.05 * (glucose - 90) +
    0.03 * (cholesterol - 150) -
    0.35 * sleepHours -
    0.007 * activityMinutes +
    (smoker ? 2.8 : 0) +
    (diabetic ? 2.4 : 0) -
    7.2;

  const probability = sigmoid(mlLikeSignal);
  const label = Math.random() < probability ? 1 : 0;

  return {
    features: toFeatureVector({
      age,
      restingHeartRate,
      systolicBP,
      diastolicBP,
      bmi,
      glucose,
      cholesterol,
      sleepHours,
      activityMinutes,
      smoker,
      diabetic,
    }),
    label,
  };
}

let modelPromise: Promise<tf.LayersModel> | null = null;

async function buildAndTrainModel(): Promise<tf.LayersModel> {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [11], units: 24, activation: "relu" }),
      tf.layers.dropout({ rate: 0.15 }),
      tf.layers.dense({ units: 12, activation: "relu" }),
      tf.layers.dense({ units: 1, activation: "sigmoid" }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });

  const samples = 560;
  const trainingRows: number[][] = [];
  const labels: number[] = [];

  for (let i = 0; i < samples; i += 1) {
    const { features, label } = createSyntheticSample();
    trainingRows.push(features);
    labels.push(label);
  }

  const xs = tf.tensor2d(trainingRows);
  const ys = tf.tensor2d(labels, [samples, 1]);

  try {
    await model.fit(xs, ys, {
      epochs: 24,
      batchSize: 32,
      validationSplit: 0.15,
      verbose: 0,
      shuffle: true,
    });
  } finally {
    xs.dispose();
    ys.dispose();
  }

  return model;
}

async function getModel(): Promise<tf.LayersModel> {
  if (!modelPromise) {
    modelPromise = buildAndTrainModel();
  }

  return modelPromise;
}

export async function warmupDeepModel(): Promise<void> {
  await getModel();
}

export async function predictRiskWithDeepLearning(
  inputs: HealthInputs,
): Promise<number> {
  const model = await getModel();
  const features = toFeatureVector(inputs);

  const score = tf.tidy(() => {
    const inputTensor = tf.tensor2d([features]);
    const outputTensor = model.predict(inputTensor) as tf.Tensor;
    const value = outputTensor.dataSync()[0];
    return clamp(value, 0, 1);
  });

  return score;
}
