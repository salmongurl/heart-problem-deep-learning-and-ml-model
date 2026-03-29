import fs from "node:fs";
import path from "node:path";

const FEATURE_ORDER = [
  "age",
  "restingHeartRate",
  "systolicBP",
  "diastolicBP",
  "bmi",
  "glucose",
  "cholesterol",
  "sleepHours",
  "activityMinutes",
  "smoker",
  "diabetic",
];

const COLUMN_ALIASES = {
  age: ["age", "ageyears"],
  restingHeartRate: ["restingheartrate", "heartrate", "restinghr", "hr"],
  maxHeartRate: ["maxheartrate", "thalach"],
  systolicBP: ["systolicbp", "systolic", "aphi", "bloodpressure", "restingbloodpressure"],
  diastolicBP: ["diastolicbp", "diastolic", "aplo"],
  bmi: ["bmi", "bodymassindex"],
  glucose: ["glucose", "bloodglucose", "fastingbloodsugar"],
  cholesterol: ["cholesterol", "serumcholesterol", "cholestoral", "cholesterollevel"],
  sleepHours: ["sleephours", "sleep"],
  activityMinutes: ["activityminutes", "physicalactivityminutes", "activity", "exerciseminutes"],
  exerciseHabits: ["exercisehabits"],
  smoker: ["smoker", "smoking", "issmoker"],
  diabetic: ["diabetic", "diabetes", "isdiabetic"],
  stressLevel: ["stresslevel"],
  exerciseAngina: ["exerciseinducedangina"],
};

const LABEL_ALIASES = [
  "label",
  "target",
  "heartdisease",
  "heartdiseasestatus",
  "diagnosis",
  "output",
  "class",
];

function parseArgs() {
  const args = process.argv.slice(2);
  const positional = [];
  const result = {
    input: "data/heart-dataset.csv",
    output: "src/lib/trainedModel.json",
    label: "",
    epochs: 1600,
    learningRate: 0.18,
  };

  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    const next = args[i + 1];

    if (current === "--input" && next) {
      result.input = next;
      i += 1;
      continue;
    }
    if (current === "--output" && next) {
      result.output = next;
      i += 1;
      continue;
    }
    if (current === "--label" && next) {
      result.label = next;
      i += 1;
      continue;
    }
    if (current === "--epochs" && next) {
      result.epochs = Number(next);
      i += 1;
      continue;
    }
    if (current === "--lr" && next) {
      result.learningRate = Number(next);
      i += 1;
      continue;
    }

    if (!current.startsWith("--")) {
      positional.push(current);
    }
  }

  if (positional.length > 0) {
    result.input = positional.join(",");
  }

  return result;
}

function normalizeHeader(header) {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function sanitizeValue(value) {
  return (value ?? "").toString().trim();
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("CSV must include a header and at least one row.");
  }

  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map(splitCsvLine);

  return { headers, rows };
}

function toNumber(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "yes") return 1;
  if (normalized === "false" || normalized === "no") return 0;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Cannot parse numeric value from \"${value}\".`);
  }
  return parsed;
}

function parseOptionalNumber(value) {
  const cleaned = sanitizeValue(value);
  if (!cleaned) return null;
  try {
    return toNumber(cleaned);
  } catch {
    return null;
  }
}

function parseBinary(value) {
  const cleaned = sanitizeValue(value).toLowerCase();
  if (!cleaned) return null;
  if (["1", "yes", "true", "y", "positive", "high"].includes(cleaned)) return 1;
  if (["0", "no", "false", "n", "negative", "low"].includes(cleaned)) return 0;

  const numeric = Number(cleaned);
  if (!Number.isNaN(numeric)) {
    return numeric >= 1 ? 1 : 0;
  }

  return null;
}

function getCell(row, aliases) {
  for (const alias of aliases) {
    const value = row[alias];
    if (value !== undefined && sanitizeValue(value) !== "") {
      return sanitizeValue(value);
    }
  }
  return "";
}

function activityFromHabit(habit) {
  const value = sanitizeValue(habit).toLowerCase();
  if (value === "high") return 220;
  if (value === "medium") return 150;
  if (value === "low") return 80;
  return null;
}

function restingHeartRateFromStress(stress) {
  const value = sanitizeValue(stress).toLowerCase();
  if (value === "high") return 84;
  if (value === "medium") return 75;
  if (value === "low") return 68;
  return 72;
}

function glucoseFromFastingText(rawFasting) {
  const value = sanitizeValue(rawFasting).toLowerCase();
  if (!value) return null;

  const numeric = parseOptionalNumber(value);
  if (numeric !== null) return numeric;

  if (value.includes("greater") || value.includes(">")) return 140;
  if (value.includes("lower") || value.includes("<")) return 100;

  return null;
}

function buildFeatureRow(row) {
  const age = parseOptionalNumber(getCell(row, COLUMN_ALIASES.age));
  const systolicBP = parseOptionalNumber(getCell(row, COLUMN_ALIASES.systolicBP));
  const cholesterol = parseOptionalNumber(getCell(row, COLUMN_ALIASES.cholesterol));

  if (age === null || systolicBP === null || cholesterol === null) {
    return null;
  }

  const diabeticFlag = parseBinary(getCell(row, COLUMN_ALIASES.diabetic));
  const smokerFlag = parseBinary(getCell(row, COLUMN_ALIASES.smoker));
  const glucoseRaw = getCell(row, COLUMN_ALIASES.glucose);
  const glucoseFromText = glucoseFromFastingText(glucoseRaw);

  const sleepHours =
    parseOptionalNumber(getCell(row, COLUMN_ALIASES.sleepHours)) ?? 7;

  const exerciseHabitMinutes = activityFromHabit(
    getCell(row, COLUMN_ALIASES.exerciseHabits),
  );

  const activityMinutes =
    parseOptionalNumber(getCell(row, COLUMN_ALIASES.activityMinutes)) ??
    exerciseHabitMinutes ??
    (parseBinary(getCell(row, COLUMN_ALIASES.exerciseAngina)) === 1 ? 60 : 140);

  const maxHeartRate = parseOptionalNumber(getCell(row, COLUMN_ALIASES.maxHeartRate));
  const restingHeartRate =
    parseOptionalNumber(getCell(row, COLUMN_ALIASES.restingHeartRate)) ??
    (maxHeartRate !== null ? Math.max(45, Math.min(100, 95 - 0.25 * maxHeartRate)) : null) ??
    restingHeartRateFromStress(getCell(row, COLUMN_ALIASES.stressLevel));

  const diastolicBP =
    parseOptionalNumber(getCell(row, COLUMN_ALIASES.diastolicBP)) ??
    Math.max(55, Math.min(130, Math.round(systolicBP * 0.65)));

  const bmi =
    parseOptionalNumber(getCell(row, COLUMN_ALIASES.bmi)) ??
    Math.max(18, Math.min(42, 18 + (age - 20) * 0.12 + (cholesterol - 150) * 0.01));

  const diabetic =
    diabeticFlag ??
    ((glucoseFromText ?? 0) >= 126 ? 1 : 0);

  const glucose = glucoseFromText ?? (diabetic === 1 ? 145 : 95);
  const smoker = smokerFlag ?? 0;

  return [
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
  ];
}

function parseLabel(row, explicitLabel) {
  if (explicitLabel) {
    const value = parseBinary(row[explicitLabel]);
    return value;
  }

  for (const alias of LABEL_ALIASES) {
    const value = parseBinary(row[alias]);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function dot(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i += 1) {
    total += a[i] * b[i];
  }
  return total;
}

function trainLogisticRegression(samples, labels, epochs, learningRate) {
  const featureCount = samples[0].length;
  const weights = new Array(featureCount).fill(0);
  let bias = 0;
  let lastLoss = 0;

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const gradW = new Array(featureCount).fill(0);
    let gradB = 0;
    let loss = 0;

    for (let i = 0; i < samples.length; i += 1) {
      const x = samples[i];
      const y = labels[i];
      const z = dot(weights, x) + bias;
      const p = sigmoid(z);

      const clippedP = Math.min(1 - 1e-8, Math.max(1e-8, p));
      loss += -(y * Math.log(clippedP) + (1 - y) * Math.log(1 - clippedP));

      const error = p - y;
      for (let j = 0; j < featureCount; j += 1) {
        gradW[j] += error * x[j];
      }
      gradB += error;
    }

    const invN = 1 / samples.length;
    for (let j = 0; j < featureCount; j += 1) {
      weights[j] -= learningRate * gradW[j] * invN;
    }
    bias -= learningRate * gradB * invN;

    lastLoss = loss * invN;
  }

  return { weights, bias, loss: lastLoss };
}

function computeAccuracy(samples, labels, weights, bias) {
  let correct = 0;

  for (let i = 0; i < samples.length; i += 1) {
    const prob = sigmoid(dot(weights, samples[i]) + bias);
    const predicted = prob >= 0.5 ? 1 : 0;
    if (predicted === labels[i]) {
      correct += 1;
    }
  }

  return correct / samples.length;
}

function scoreProbability(sample, weights, bias) {
  return sigmoid(dot(weights, sample) + bias);
}

function normalizeWithBounds(values, normalization) {
  return values.map((value, index) => {
    const { min, max } = normalization[index];
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  });
}

function main() {
  const { input, output, label, epochs, learningRate } = parseArgs();
  const outputPath = path.resolve(process.cwd(), output);

  const inputPaths = input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => path.resolve(process.cwd(), item));

  if (inputPaths.length === 0) {
    throw new Error("At least one CSV file is required in --input.");
  }

  for (const inputPath of inputPaths) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input dataset not found: ${inputPath}`);
    }
  }

  const rawFeatures = [];
  const labels = [];
  let skippedRows = 0;

  for (const inputPath of inputPaths) {
    const raw = fs.readFileSync(inputPath, "utf8");
    const { headers, rows } = parseCsv(raw);
    const normalizedHeaders = headers.map(normalizeHeader);

    const rowObjects = rows.map((rowValues) => {
      const rowObject = {};
      for (let i = 0; i < normalizedHeaders.length; i += 1) {
        rowObject[normalizedHeaders[i]] = sanitizeValue(rowValues[i]);
      }
      return rowObject;
    });

    const explicitLabel = label ? normalizeHeader(label) : "";

    for (const row of rowObjects) {
      const features = buildFeatureRow(row);
      const target = parseLabel(row, explicitLabel);

      if (!features || target === null) {
        skippedRows += 1;
        continue;
      }

      rawFeatures.push(features);
      labels.push(target);
    }
  }

  if (rawFeatures.length < 20) {
    throw new Error("Need at least 20 valid rows to train a stable model.");
  }

  const normalization = FEATURE_ORDER.map((_, featureIdx) => {
    const values = rawFeatures.map((row) => row[featureIdx]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { min, max: max === min ? min + 1 : max };
  });

  const normalizedSamples = rawFeatures.map((row) =>
    row.map((value, index) => {
      const { min, max } = normalization[index];
      return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }),
  );

  const { weights, bias, loss } = trainLogisticRegression(
    normalizedSamples,
    labels,
    epochs,
    learningRate,
  );

  const accuracy = computeAccuracy(normalizedSamples, labels, weights, bias);

  // Clinical orientation check: adverse profile should score higher than healthy profile.
  const healthyAnchor = [25, 58, 105, 68, 20, 90, 160, 8.5, 210, 0, 0];
  const adverseAnchor = [75, 95, 190, 115, 38, 180, 420, 4.5, 20, 1, 1];
  const healthyNorm = normalizeWithBounds(healthyAnchor, normalization);
  const adverseNorm = normalizeWithBounds(adverseAnchor, normalization);
  const healthyProb = scoreProbability(healthyNorm, weights, bias);
  const adverseProb = scoreProbability(adverseNorm, weights, bias);
  const invertOutput = adverseProb < healthyProb;

  const modelFile = {
    version: 1,
    trainedAt: new Date().toISOString(),
    samples: normalizedSamples.length,
    featureOrder: FEATURE_ORDER,
    normalization,
    weights,
    bias,
    invertOutput,
    training: {
      accuracy,
      loss,
      epochs,
      learningRate,
    },
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(modelFile, null, 2));

  console.log(`Model trained using ${normalizedSamples.length} rows.`);
  console.log(`Skipped rows: ${skippedRows}`);
  console.log(`Accuracy: ${(accuracy * 100).toFixed(2)}%`);
  console.log(`Healthy anchor probability: ${healthyProb.toFixed(4)}`);
  console.log(`Adverse anchor probability: ${adverseProb.toFixed(4)}`);
  console.log(`Output inverted for risk semantics: ${invertOutput}`);
  console.log(`Saved to: ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
