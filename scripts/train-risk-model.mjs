import fs from "node:fs";
import path from "node:path";

const datasetPath = path.resolve("data/dataset_uploaded/heart.csv");
const outputPath = path.resolve("src/lib/trainedHeartModel.ts");

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  const lines = raw.split(/\r?\n/);
  const headers = lines[0].split(",");

  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row = {};
    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = cols[i];
    }
    return row;
  });

  return rows;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1_000_000) / 1_000_000;
  };
}

function shuffleInPlace(array, seed = 42) {
  const rand = seededRandom(seed);
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function standardizeFeatures(matrix) {
  const nRows = matrix.length;
  const nCols = matrix[0].length;

  const means = new Array(nCols).fill(0);
  const stds = new Array(nCols).fill(0);

  for (let c = 0; c < nCols; c += 1) {
    let sum = 0;
    for (let r = 0; r < nRows; r += 1) {
      sum += matrix[r][c];
    }
    means[c] = sum / nRows;
  }

  for (let c = 0; c < nCols; c += 1) {
    let variance = 0;
    for (let r = 0; r < nRows; r += 1) {
      const d = matrix[r][c] - means[c];
      variance += d * d;
    }
    stds[c] = Math.sqrt(variance / nRows) || 1;
  }

  const transformed = matrix.map((row) =>
    row.map((v, idx) => (v - means[idx]) / stds[idx]),
  );

  return { transformed, means, stds };
}

function applyStandardization(matrix, means, stds) {
  return matrix.map((row) => row.map((v, idx) => (v - means[idx]) / stds[idx]));
}

function trainLogisticRegression(X, y, options = {}) {
  const epochs = options.epochs ?? 4500;
  const learningRate = options.learningRate ?? 0.05;
  const l2 = options.l2 ?? 0.001;

  const n = X.length;
  const p = X[0].length;

  let bias = 0;
  const weights = new Array(p).fill(0);

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    let gradBias = 0;
    const gradW = new Array(p).fill(0);

    for (let i = 0; i < n; i += 1) {
      let linear = bias;
      for (let j = 0; j < p; j += 1) {
        linear += weights[j] * X[i][j];
      }

      const pred = sigmoid(linear);
      const err = pred - y[i];
      gradBias += err;
      for (let j = 0; j < p; j += 1) {
        gradW[j] += err * X[i][j];
      }
    }

    gradBias /= n;
    for (let j = 0; j < p; j += 1) {
      gradW[j] = gradW[j] / n + l2 * weights[j];
    }

    bias -= learningRate * gradBias;
    for (let j = 0; j < p; j += 1) {
      weights[j] -= learningRate * gradW[j];
    }
  }

  return { bias, weights };
}

function predictProbability(X, model) {
  return X.map((row) => {
    let linear = model.bias;
    for (let j = 0; j < row.length; j += 1) {
      linear += model.weights[j] * row[j];
    }
    return sigmoid(linear);
  });
}

function evaluate(yTrue, yProb) {
  let correct = 0;
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;

  for (let i = 0; i < yTrue.length; i += 1) {
    const pred = yProb[i] >= 0.5 ? 1 : 0;
    if (pred === yTrue[i]) correct += 1;
    if (pred === 1 && yTrue[i] === 1) tp += 1;
    if (pred === 0 && yTrue[i] === 0) tn += 1;
    if (pred === 1 && yTrue[i] === 0) fp += 1;
    if (pred === 0 && yTrue[i] === 1) fn += 1;
  }

  const accuracy = correct / yTrue.length;
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const specificity = tn / Math.max(1, tn + fp);

  return { accuracy, precision, recall, specificity, tp, tn, fp, fn };
}

function main() {
  if (!fs.existsSync(datasetPath)) {
    throw new Error(`Dataset not found at ${datasetPath}`);
  }

  const rows = parseCsv(datasetPath);

  const features = rows.map((r) => [
    Number(r.Age),
    Number(r.RestingBP),
    Number(r.Cholesterol),
    Number(r.FastingBS),
  ]);
  const labels = rows.map((r) => Number(r.HeartDisease));

  const combined = features.map((x, idx) => ({ x, y: labels[idx] }));
  shuffleInPlace(combined, 20260329);

  const splitIndex = Math.floor(combined.length * 0.8);
  const train = combined.slice(0, splitIndex);
  const test = combined.slice(splitIndex);

  const xTrainRaw = train.map((r) => r.x);
  const yTrain = train.map((r) => r.y);
  const xTestRaw = test.map((r) => r.x);
  const yTest = test.map((r) => r.y);

  const standardized = standardizeFeatures(xTrainRaw);
  const xTrain = standardized.transformed;
  const xTest = applyStandardization(xTestRaw, standardized.means, standardized.stds);

  const model = trainLogisticRegression(xTrain, yTrain, {
    epochs: 5000,
    learningRate: 0.055,
    l2: 0.0008,
  });

  const trainMetrics = evaluate(yTrain, predictProbability(xTrain, model));
  const testMetrics = evaluate(yTest, predictProbability(xTest, model));

  const tsArtifact = `// Auto-generated by scripts/train-risk-model.mjs. Do not edit manually.\n\nexport interface TrainedHeartModelArtifact {\n  featureNames: string[];\n  means: number[];\n  stds: number[];\n  weights: number[];\n  bias: number;\n  metadata: {\n    trainedAt: string;\n    datasetRows: number;\n    split: string;\n    trainAccuracy: number;\n    testAccuracy: number;\n  };\n}\n\nexport const trainedHeartModel: TrainedHeartModelArtifact = ${JSON.stringify(
    {
      featureNames: ["Age", "RestingBP", "Cholesterol", "FastingBS"],
      means: standardized.means,
      stds: standardized.stds,
      weights: model.weights,
      bias: model.bias,
      metadata: {
        trainedAt: new Date().toISOString(),
        datasetRows: rows.length,
        split: "80/20",
        trainAccuracy: Number(trainMetrics.accuracy.toFixed(4)),
        testAccuracy: Number(testMetrics.accuracy.toFixed(4)),
      },
    },
    null,
    2,
  )} as const;\n`;

  fs.writeFileSync(outputPath, tsArtifact, "utf8");

  console.log("Model artifact written to", outputPath);
  console.log("Train metrics", trainMetrics);
  console.log("Test metrics", testMetrics);
}

main();
