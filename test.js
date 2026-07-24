import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
    const text = await page.evaluate(async () => {
       try {
          const res = await fetch('http://localhost:8000/api/data/all');
          return `FETCH SUCCESS: status ${res.status}`;
       } catch (e) {
          return `FETCH FAILED: ${e.message}`;
       }
    });
    console.log(text);
  } catch (e) {
    console.error("Navigation error:", e);
  }
  
  await browser.close();
})();
