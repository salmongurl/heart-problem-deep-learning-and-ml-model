import fs from "node:fs/promises";
import path from "node:path";

const INPUT_CSV = path.resolve(
	process.cwd(),
	"data/dataset3/heart_disease.csv",
);
const OUTPUT_JSON = path.resolve(process.cwd(), "src/lib/trainedRiskModel.json");

function parseCsvLine(line) {
	const fields = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i += 1) {
		const char = line[i];

		if (char === '"') {
			const next = line[i + 1];
			if (inQuotes && next === '"') {
				current += '"';
				i += 1;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (char === "," && !inQuotes) {
			fields.push(current.trim());
			current = "";
			continue;
		}

		current += char;
	}

	fields.push(current.trim());
	return fields;
}

function toNumber(value) {
	if (value === "" || value == null) return Number.NaN;
	const num = Number(value);
	return Number.isFinite(num) ? num : Number.NaN;
}

function toYesNo(value) {
	return String(value).toLowerCase() === "yes" ? 1 : 0;
}

function exerciseToScore(value) {
	const normalized = String(value).toLowerCase();
	if (normalized === "high") return 1;
	if (normalized === "medium") return 0.6;
	if (normalized === "low") return 0.25;
	return 0;
}

function makeFeatureVector(rowByColumn) {
	const age = toNumber(rowByColumn["Age"]);
	const bloodPressure = toNumber(rowByColumn["Blood Pressure"]);
	const cholesterol = toNumber(rowByColumn["Cholesterol Level"]);
	const bmi = toNumber(rowByColumn["BMI"]);
	const sleepHours = toNumber(rowByColumn["Sleep Hours"]);

	if (
		[age, bloodPressure, cholesterol, bmi, sleepHours].some((x) =>
			Number.isNaN(x),
		)
	) {
		return null;
	}

	return [
		age,
		bloodPressure,
		cholesterol,
		bmi,
		sleepHours,
		exerciseToScore(rowByColumn["Exercise Habits"]),
		toYesNo(rowByColumn["Smoking"]),
		toYesNo(rowByColumn["Diabetes"]),
	];
}

function sigmoid(x) {
	return 1 / (1 + Math.exp(-x));
}

function deterministicShuffle(items) {
	let seed = 1337;
	const rand = () => {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		return seed / 4294967296;
	};

	const output = [...items];
	for (let i = output.length - 1; i > 0; i -= 1) {
		const j = Math.floor(rand() * (i + 1));
		[output[i], output[j]] = [output[j], output[i]];
	}
	return output;
}

function buildStandardizationStats(samples) {
	const featureCount = samples[0].length;
	const means = Array.from({ length: featureCount }, () => 0);
	const stds = Array.from({ length: featureCount }, () => 1);

	for (const row of samples) {
		for (let i = 0; i < featureCount; i += 1) {
			means[i] += row[i];
		}
	}

	for (let i = 0; i < featureCount; i += 1) {
		means[i] /= samples.length;
	}

	for (const row of samples) {
		for (let i = 0; i < featureCount; i += 1) {
			const delta = row[i] - means[i];
			stds[i] += delta * delta;
		}
	}

	for (let i = 0; i < featureCount; i += 1) {
		stds[i] = Math.sqrt(stds[i] / samples.length);
		if (stds[i] < 1e-6) stds[i] = 1;
	}

	return { means, stds };
}

function normalizeRow(row, means, stds) {
	return row.map((value, i) => (value - means[i]) / stds[i]);
}

function trainLogisticRegression({ xTrain, yTrain, lr, epochs, l2 }) {
	const featureCount = xTrain[0].length;
	const weights = Array.from({ length: featureCount }, () => 0);
	let bias = 0;

	for (let epoch = 0; epoch < epochs; epoch += 1) {
		const gradW = Array.from({ length: featureCount }, () => 0);
		let gradB = 0;

		for (let i = 0; i < xTrain.length; i += 1) {
			const x = xTrain[i];
			const y = yTrain[i];
			let z = bias;
			for (let j = 0; j < featureCount; j += 1) {
				z += weights[j] * x[j];
			}

			const pred = sigmoid(z);
			const error = pred - y;

			for (let j = 0; j < featureCount; j += 1) {
				gradW[j] += error * x[j];
			}
			gradB += error;
		}

		for (let j = 0; j < featureCount; j += 1) {
			const regularized = gradW[j] / xTrain.length + l2 * weights[j];
			weights[j] -= lr * regularized;
		}
		bias -= lr * (gradB / xTrain.length);
	}

	return { weights, bias };
}

function evaluateModel({ x, y, weights, bias }) {
	let correct = 0;
	let totalLoss = 0;

	for (let i = 0; i < x.length; i += 1) {
		const row = x[i];
		const label = y[i];
		let z = bias;
		for (let j = 0; j < row.length; j += 1) {
			z += weights[j] * row[j];
		}
		const pred = Math.min(1 - 1e-8, Math.max(1e-8, sigmoid(z)));
		const predictedClass = pred >= 0.5 ? 1 : 0;
		if (predictedClass === label) correct += 1;
		totalLoss += -(label * Math.log(pred) + (1 - label) * Math.log(1 - pred));
	}

	return {
		accuracy: correct / x.length,
		loss: totalLoss / x.length,
	};
}

async function main() {
	const csv = await fs.readFile(INPUT_CSV, "utf8");
	const lines = csv
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

	if (lines.length < 2) {
		throw new Error("Dataset appears to be empty.");
	}

	const header = parseCsvLine(lines[0]);
	const rows = [];

	for (let i = 1; i < lines.length; i += 1) {
		const cols = parseCsvLine(lines[i]);
		if (cols.length !== header.length) continue;

		const rowByColumn = Object.fromEntries(header.map((h, idx) => [h, cols[idx]]));
		const features = makeFeatureVector(rowByColumn);
		const labelText = rowByColumn["Heart Disease Status"];
		const label = String(labelText).toLowerCase() === "yes" ? 1 : 0;

		if (!features || Number.isNaN(label)) continue;
		rows.push({ features, label });
	}

	if (rows.length < 100) {
		throw new Error(`Insufficient valid rows after cleaning: ${rows.length}`);
	}

	const shuffled = deterministicShuffle(rows);
	const split = Math.floor(shuffled.length * 0.8);
	const trainRows = shuffled.slice(0, split);
	const testRows = shuffled.slice(split);

	const xTrainRaw = trainRows.map((r) => r.features);
	const yTrain = trainRows.map((r) => r.label);
	const xTestRaw = testRows.map((r) => r.features);
	const yTest = testRows.map((r) => r.label);

	const { means, stds } = buildStandardizationStats(xTrainRaw);
	const xTrain = xTrainRaw.map((row) => normalizeRow(row, means, stds));
	const xTest = xTestRaw.map((row) => normalizeRow(row, means, stds));

	const model = trainLogisticRegression({
		xTrain,
		yTrain,
		lr: 0.06,
		epochs: 2200,
		l2: 0.0015,
	});

	const trainMetrics = evaluateModel({
		x: xTrain,
		y: yTrain,
		weights: model.weights,
		bias: model.bias,
	});
	const testMetrics = evaluateModel({
		x: xTest,
		y: yTest,
		weights: model.weights,
		bias: model.bias,
	});

	const output = {
		version: 1,
		trainedAt: new Date().toISOString(),
		sourceDataset: "data/dataset3/heart_disease.csv",
		featureNames: [
			"age",
			"bloodPressure",
			"cholesterol",
			"bmi",
			"sleepHours",
			"exerciseScore",
			"smoker",
			"diabetic",
		],
		means,
		stds,
		weights: model.weights,
		bias: model.bias,
		metrics: {
			train: trainMetrics,
			test: testMetrics,
			rowsUsed: rows.length,
		},
	};

	await fs.writeFile(OUTPUT_JSON, JSON.stringify(output, null, 2), "utf8");

	console.log("Saved trained model to", OUTPUT_JSON);
	console.log(
		`Train accuracy ${(trainMetrics.accuracy * 100).toFixed(2)}%, Test accuracy ${(testMetrics.accuracy * 100).toFixed(2)}%`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
