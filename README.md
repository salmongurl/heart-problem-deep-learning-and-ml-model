# Health Tracker App

Next.js web app for heart-risk estimation with a dataset-trained ML baseline.

## ML Model

The app uses logistic regression trained from:

- `data/dataset_uploaded/heart.csv`

Training script:

- `scripts/train-risk-model.mjs`
- `scripts/train-deep-model.mjs`

Generated model artifact used by the website at runtime:

- `src/lib/trainedHeartModel.ts`
- `src/lib/trainedDeepHeartModel.ts`

Current feature set used for training:

- `Age`
- `RestingBP`
- `Cholesterol`
- `FastingBS`

At prediction time, additional lifestyle factors (smoking, BMI, sleep, activity, glucose) are applied as bounded adjustments on top of the trained clinical probability.

## Setup

```bash
npm install
```

## Train / Retrain Model

```bash
npm run train:model
npm run train:deep
```

This updates `src/lib/trainedHeartModel.ts` and `src/lib/trainedDeepHeartModel.ts` with fresh weights and metadata.

## Run App

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality Checks

```bash
npm run lint
npm run build
```
