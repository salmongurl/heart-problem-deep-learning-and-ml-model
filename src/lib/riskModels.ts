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

// Lightweight deterministic scoring with no external model artifacts.
function riskScore(inputs: HealthInputs): number {
  const age = clamp((inputs.age - 20) / 60, 0, 1.3);
  const pressure = clamp((inputs.systolicBP - 105) / 75, 0, 1.5);
  const cholesterol = clamp((inputs.cholesterol - 150) / 180, 0, 1.4);
  const bmi = clamp((inputs.bmi - 20) / 22, 0, 1.5);
  const glucose = clamp((inputs.glucose - 90) / 140, 0, 1.5);
  const sleepDebt = clamp((7.5 - inputs.sleepHours) / 4, -0.5, 1.2);
  const inactivity = clamp((150 - inputs.activityMinutes) / 220, -0.4, 1.2);

  const base =
    -2.55 +
    1.1 * age +
    1.0 * pressure +
    0.8 * cholesterol +
    0.75 * bmi +
    0.85 * glucose +
    0.5 * sleepDebt +
    0.65 * inactivity +
    (inputs.smoker ? 0.8 : 0) +
    (inputs.diabetic ? 0.9 : 0);

  return sigmoid(base);
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
