const fs = require('fs');

let c = fs.readFileSync('src/app/diagnosis/page.tsx', 'utf8');

if (!c.includes('interface UIInputs')) {
    c = c.replace('export default function DiagnosticsPage() {', 
interface UIInputs {
  age: number;
  bloodPressure: number;
  cholesterol: number;
  bmi: number;
  isSmoker: boolean;
  hasDiabetes: boolean;
  physicalActivity: number;
}

export default function DiagnosticsPage() {);
}

c = c.replace(/useState<yAnyTypeThingOrSomething>/g, 'useState<UIInputs>');
c = c.replace(/useState<any>/g, 'useState<UIInputs>');

fs.writeFileSync('src/app/diagnosis/page.tsx', c);
console.log('Fixed interfaces');
