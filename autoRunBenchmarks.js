const { runBenchmark } = require('./runBenchmark');
const path = require('path');
const fs = require('fs');

async function autoRunBenchmarks() {
  const baseOutDir = path.resolve(__dirname, 'web-performance');

  const configs = [
    { name: 'angular', url: 'http://localhost:4200' },
    { name: 'react', url: 'http://localhost:3000' }
  ];

  const networkProfiles = ['standard'];
  const runs = 50;

  const interactionCount = 50;
  const delayMs = 0;
  const timeoutMs = 30000;

  for (const { name, url } of configs) {
    for (const profile of networkProfiles) {
      const dirName = `${name}-${profile}`;
      const outDir = path.join(baseOutDir, dirName);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      for (let i = 1; i <= runs; i++) {
        const fileName = `web-performance-${name}-${profile}-${i}.json`;
        const outPath = path.join(outDir, fileName);
        console.log(`\n[${name.toUpperCase()} - ${profile}] Run ${i}/${runs}`);
        await runBenchmark(url, outPath, profile, interactionCount, delayMs, timeoutMs);
      }
    }
  }
}

autoRunBenchmarks()
  .then(() => console.log('\nBenchmark completato!'))
  .catch(err => console.error('Errore:', err));
