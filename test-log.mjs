import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('[BROWSER_CONSOLE]', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('[BROWSER_ERROR]', err.message, err.stack));
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 10000 });
        console.log("Page loaded!");
        // wait for a second just in case error takes a moment
        await new Promise(r => setTimeout(r, 2000));
    } catch(err) {
        console.log("Nav failed", err);
    }
    await browser.close();
})();
