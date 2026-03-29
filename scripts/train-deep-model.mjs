import fs from "node:fs";
import path from "node:path";

const datasetPath = path.resolve("data/dataset_uploaded/heart.csv");
const outputPath = path.resolve("src/lib/trainedDeepHeartModel.ts");

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  const lines = raw.split(/\r?\n/);
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row = {};
    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = cols[i];
    }
    return row;
  });
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

function relu(x) {
  return x > 0 ? x : 0;
}

function reluGrad(x) {
  return x > 0 ? 1 : 0;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function clampProb(x) {
  return Math.min(1 - 1e-7, Math.max(1e-7, x));
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
    row.map((value, idx) => (value - means[idx]) / stds[idx]),
  );

  return { transformed, means, stds };
}

function applyStandardization(matrix, means, stds) {
  return matrix.map((row) => row.map((value, idx) => (value - means[idx]) / stds[idx]));
}

function initMatrix(rows, cols, rand, scale = 0.1) {
  const m = new Array(rows);
  for (let i = 0; i < rows; i += 1) {
    m[i] = new Array(cols);
    for (let j = 0; j < cols; j += 1) {
      m[i][j] = (rand() * 2 - 1) * scale;
    }
  }
  return m;
}

function initVector(size, value = 0) {
  return new Array(size).fill(value);
}

function forwardSingle(x, model) {
  const z1 = initVector(model.b1.length, 0);
  const a1 = initVector(model.b1.length, 0);
  for (let j = 0; j < model.b1.length; j += 1) {
    let sum = model.b1[j];
    for (let i = 0; i < x.length; i += 1) {
      sum += model.W1[j][i] * x[i];
    }
    z1[j] = sum;
    a1[j] = relu(sum);
  }

  const z2 = initVector(model.b2.length, 0);
  const a2 = initVector(model.b2.length, 0);
  for (let j = 0; j < model.b2.length; j += 1) {
    let sum = model.b2[j];
    for (let i = 0; i < a1.length; i += 1) {
      sum += model.W2[j][i] * a1[i];
    }
    z2[j] = sum;
    a2[j] = relu(sum);
  }

  let z3 = model.b3;
  for (let i = 0; i < a2.length; i += 1) {
    z3 += model.W3[i] * a2[i];
  }

  const yHat = sigmoid(z3);
  return { z1, a1, z2, a2, z3, yHat };
}

function trainMLP(X, y, options = {}) {
  const inputSize = X[0].length;
  const h1 = options.h1 ?? 16;
  const h2 = options.h2 ?? 8;
  const epochs = options.epochs ?? 4500;
  const lr = options.learningRate ?? 0.01;
  const l2 = options.l2 ?? 0.0008;
  const rand = seededRandom(options.seed ?? 20260329);

  const model = {
    W1: initMatrix(h1, inputSize, rand, 0.2),
    b1: initVector(h1, 0),
    W2: initMatrix(h2, h1, rand, 0.15),
    b2: initVector(h2, 0),
    W3: initVector(h2, 0).map(() => (rand() * 2 - 1) * 0.12),
    b3: 0,
  };

  const n = X.length;

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const gW1 = initMatrix(h1, inputSize, () => 0, 0);
    const gb1 = initVector(h1, 0);
    const gW2 = initMatrix(h2, h1, () => 0, 0);
    const gb2 = initVector(h2, 0);
    const gW3 = initVector(h2, 0);
    let gb3 = 0;

    for (let sample = 0; sample < n; sample += 1) {
      const x = X[sample];
      const target = y[sample];

      const cache = forwardSingle(x, model);
      const dz3 = cache.yHat - target;

      gb3 += dz3;
      for (let j = 0; j < h2; j += 1) {
        gW3[j] += dz3 * cache.a2[j];
      }

      const da2 = initVector(h2, 0);
      for (let j = 0; j < h2; j += 1) {
        da2[j] = dz3 * model.W3[j];
      }

      const dz2 = initVector(h2, 0);
      for (let j = 0; j < h2; j += 1) {
        dz2[j] = da2[j] * reluGrad(cache.z2[j]);
      }

      for (let j = 0; j < h2; j += 1) {
        gb2[j] += dz2[j];
        for (let k = 0; k < h1; k += 1) {
          gW2[j][k] += dz2[j] * cache.a1[k];
        }
      }

      const da1 = initVector(h1, 0);
      for (let k = 0; k < h1; k += 1) {
        let sum = 0;
        for (let j = 0; j < h2; j += 1) {
          sum += dz2[j] * model.W2[j][k];
        }
        da1[k] = sum;
      }

      const dz1 = initVector(h1, 0);
      for (let k = 0; k < h1; k += 1) {
        dz1[k] = da1[k] * reluGrad(cache.z1[k]);
      }

      for (let k = 0; k < h1; k += 1) {
        gb1[k] += dz1[k];
        for (let i = 0; i < inputSize; i += 1) {
          gW1[k][i] += dz1[k] * x[i];
        }
      }
    }

    const invN = 1 / n;

    gb3 = gb3 * invN;
    model.b3 -= lr * gb3;
    for (let j = 0; j < h2; j += 1) {
      const grad = gW3[j] * invN + l2 * model.W3[j];
      model.W3[j] -= lr * grad;
    }

    for (let j = 0; j < h2; j += 1) {
      const gradB = gb2[j] * invN;
      model.b2[j] -= lr * gradB;
      for (let k = 0; k < h1; k += 1) {
        const grad = gW2[j][k] * invN + l2 * model.W2[j][k];
        model.W2[j][k] -= lr * grad;
      }
    }

    for (let k = 0; k < h1; k += 1) {
      const gradB = gb1[k] * invN;
      model.b1[k] -= lr * gradB;
      for (let i = 0; i < inputSize; i += 1) {
        const grad = gW1[k][i] * invN + l2 * model.W1[k][i];
        model.W1[k][i] -= lr * grad;
      }
    }
  }

  return model;
}

function predictProbabilities(X, model) {
  return X.map((x) => forwardSingle(x, model).yHat);
}

function evaluate(yTrue, yProb) {
  let correct = 0;
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  let loss = 0;

  for (let i = 0; i < yTrue.length; i += 1) {
    const p = clampProb(yProb[i]);
    const pred = p >= 0.5 ? 1 : 0;
    if (pred === yTrue[i]) correct += 1;
    if (pred === 1 && yTrue[i] === 1) tp += 1;
    if (pred === 0 && yTrue[i] === 0) tn += 1;
    if (pred === 1 && yTrue[i] === 0) fp += 1;
    if (pred === 0 && yTrue[i] === 1) fn += 1;

    loss += -(yTrue[i] * Math.log(p) + (1 - yTrue[i]) * Math.log(1 - p));
  }

  return {
    loss: loss / yTrue.length,
    accuracy: correct / yTrue.length,
    precision: tp / Math.max(1, tp + fp),
    recall: tp / Math.max(1, tp + fn),
    specificity: tn / Math.max(1, tn + fp),
    tp,
    tn,
    fp,
    fn,
  };
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

  const model = trainMLP(xTrain, yTrain, {
    h1: 16,
    h2: 8,
    epochs: 5200,
    learningRate: 0.012,
    l2: 0.0006,
    seed: 20260329,
  });

  const trainMetrics = evaluate(yTrain, predictProbabilities(xTrain, model));
  const testMetrics = evaluate(yTest, predictProbabilities(xTest, model));

  const artifact = {
    featureNames: ["Age", "RestingBP", "Cholesterol", "FastingBS"],
    means: standardized.means,
    stds: standardized.stds,
    architecture: {
      inputSize: 4,
      hiddenSizes: [16, 8],
      outputSize: 1,
      activationHidden: "relu",
      activationOutput: "sigmoid",
    },
    W1: model.W1,
    b1: model.b1,
    W2: model.W2,
    b2: model.b2,
    W3: model.W3,
    b3: model.b3,
    metadata: {
      trainedAt: new Date().toISOString(),
      datasetRows: rows.length,
      split: "80/20",
      trainLoss: Number(trainMetrics.loss.toFixed(5)),
      testLoss: Number(testMetrics.loss.toFixed(5)),
      trainAccuracy: Number(trainMetrics.accuracy.toFixed(4)),
      testAccuracy: Number(testMetrics.accuracy.toFixed(4)),
    },
  };

  const tsArtifact = `// Auto-generated by scripts/train-deep-model.mjs. Do not edit manually.\n\nexport interface TrainedDeepHeartModelArtifact {\n  featureNames: string[];\n  means: number[];\n  stds: number[];\n  architecture: {\n    inputSize: number;\n    hiddenSizes: number[];\n    outputSize: number;\n    activationHidden: string;\n    activationOutput: string;\n  };\n  W1: number[][];\n  b1: number[];\n  W2: number[][];\n  b2: number[];\n  W3: number[];\n  b3: number;\n  metadata: {\n    trainedAt: string;\n    datasetRows: number;\n    split: string;\n    trainLoss: number;\n    testLoss: number;\n    trainAccuracy: number;\n    testAccuracy: number;\n  };\n}\n\nexport const trainedDeepHeartModel: TrainedDeepHeartModelArtifact = ${JSON.stringify(
    artifact,
    null,
    2,
  )} as const;\n`;

  fs.writeFileSync(outputPath, tsArtifact, "utf8");

  console.log("Deep model artifact written to", outputPath);
  console.log("Train metrics", trainMetrics);
  console.log("Test metrics", testMetrics);
}

main();
