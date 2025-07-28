const puppeteer = require('puppeteer');

async function pageInteractor(page, numInteractions, delayMs, timeoutMs = 30000) {
  let count = 0;
  let timeoutReached = false;
  const timeout = setTimeout(() => { timeoutReached = true; }, timeoutMs);

  for (let i = 0; i < numInteractions; i++) {
    if (timeoutReached) break;
    // 1. Ottieni tutti i bottoni ogni volta, appena prima del click
    const buttons = await page.$$('button:not([disabled])');
    if (buttons.length === 0) {
      console.log('[Interactor] Nessun bottone attivo trovato, stopping.');
      break;
    }
    const idx = Math.floor(Math.random() * buttons.length);
    const button = buttons[idx];

    // 2. Prova a cliccare, gestisci eventuale “node detached”
    try {
      await button.click();
      count++;
    } catch (error) {
      // Gestione errori legati a nodi rimossi
      if (
        error.message.includes('Node is detached from document') ||
        error.message.includes('Execution context was destroyed')
      ) {
        //console.log(`[Interactor] Bottone rimosso prima del click (interazione #${i + 1}), salto.`);
        i--;
        // Non incrementare count in questo caso
        continue;
      } else {
        // Altri errori gravi: log e termina
        console.error(`[Interactor] Errore imprevisto:`, error);
        break;
      }
    }

    // Attendi tra un'interazione e l'altra
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  clearTimeout(timeout);
  return count;
}

module.exports = { pageInteractor };
