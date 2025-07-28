const fs = require('fs');
const path = require('path');

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((acc, val) => acc + (val - m) ** 2, 0) / arr.length);
}

function summaryStats(values) {
  return {
    count: values.length,
    mean: +mean(values).toFixed(4),
    stdDev: +stdDev(values).toFixed(4),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function collectMetrics(fileData) {
  const metrics = {};

  if (fileData.chromeMetrics) {
    for (const [key, value] of Object.entries(fileData.chromeMetrics)) {
      if (!metrics[key]) metrics[key] = [];
      metrics[key].push(value);
    }
  }

  if (fileData.vitals) {
    for (const v of fileData.vitals) {
      if (!metrics[v.name]) metrics[v.name] = [];
      metrics[v.name].push(v.value);
    }
  }

  return metrics;
}

function mergeMetrics(metricArrays) {
  const merged = {};
  for (const m of metricArrays) {
    for (const [key, values] of Object.entries(m)) {
      if (!merged[key]) merged[key] = [];
      merged[key].push(...values);
    }
  }
  return merged;
}

async function main() {
  const [,, framework, profile] = process.argv;
  if (!framework || !profile) {
    console.error('Uso: node generateSummary.js <framework> <profilo>');
    process.exit(1);
  }

  const inputDir = path.join(__dirname, 'web-performance', `${framework}-${profile}`);
  const outputDir = path.join(__dirname, 'summaries');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir).filter(f =>
    f.endsWith('.json') && !f.startsWith('summary-'));

  const metricsList = [];

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    metricsList.push(collectMetrics(content));
  }

  const merged = mergeMetrics(metricsList);
  const summary = {};

  for (const [key, values] of Object.entries(merged)) {
    summary[key] = summaryStats(values);
  }

  const outFile = path.join(outputDir, `summary-${framework}-${profile}.json`);
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));
  console.log(`Summary salvato in: ${outFile}`);
}

main();
