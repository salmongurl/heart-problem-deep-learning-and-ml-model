# Health Tracker App

Next.js web app for heart-risk estimation with a dataset-trained ML baseline.

## ML Model

The app uses logistic regression trained from:

- `data/dataset_uploaded/heart.csv`

Training script:

- `scripts/train-risk-model.mjs`

Generated model artifact used by the website at runtime:

- `src/lib/trainedHeartModel.ts`

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
```

This updates `src/lib/trainedHeartModel.ts` with fresh coefficients and metadata.

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
