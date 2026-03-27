const fs = require('fs');
let content = fs.readFileSync('src/app/diagnosis/page.tsx', 'utf8');

const interfaceStr = 
interface UIInputs {
  age: number;
  bloodPressure: number;
  cholesterol: number;
  bmi: number;
  isSmoker: boolean;
  hasDiabetes: boolean;
  physicalActivity: number;
}
;

content = content.replace('export default function DiagnosticsPage() {', interfaceStr + '\nexport default function DiagnosticsPage() {');
content = content.replace('useState<any>', 'useState<UIInputs>');
content = content.replace(/keyof HealthInputs/g, 'keyof UIInputs');
content = content.replace(/setInputs\(prev =>/g, 'setInputs((prev: UIInputs) =>');

const predictionFixStr = 
  const buildHealthInputs = (ui: UIInputs): HealthInputs => ({
    age: ui.age,
    restingHeartRate: 70,
    systolicBP: ui.bloodPressure,
    diastolicBP: 80,
    bmi: ui.bmi,
    glucose: ui.hasDiabetes ? 140 : 90,
    cholesterol: ui.cholesterol,
    sleepHours: 7,
    activityMinutes: ui.physicalActivity * 30,
    smoker: ui.isSmoker,
    diabetic: ui.hasDiabetes,
  });
;

content = content.replace('const handlePredict = async () => {', predictionFixStr + '\n  const handlePredict = async () => {\n    const modelData = buildHealthInputs(inputs);');

content = content.replace('predictRiskWithML(inputs)', 'predictRiskWithML(modelData)');
content = content.replace('predictRiskWithDeepLearning(inputs)', 'predictRiskWithDeepLearning(modelData)');

fs.writeFileSync('src/app/diagnosis/page.tsx', content);
console.log('Fixed');
