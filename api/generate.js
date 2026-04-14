const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });

    const data = req.body;

    let browser = null;
    try {
        browser = await puppeteer.launch({
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath('https://github.com/sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar'),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        // ... (Baaki ka poora HTML design code jo maine pehle diya tha wo same rahega)
