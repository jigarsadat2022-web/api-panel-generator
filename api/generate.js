const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests allowed' });
    }

    const data = req.body;

    let browser = null;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                body { margin: 0; padding: 20px; font-family: 'Roboto', sans-serif; }
                .card-box { width: 480px; height: 303px; position: relative; overflow: hidden; background: #fff; margin-bottom: 20px; border-radius: 6px; }
                .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; object-fit: cover; }
                .content-layer { position: relative; z-index: 10; width: 100%; height: 100%; color: #000; text-align: left; }
                .abs { position: absolute; white-space: nowrap; }
            </style>
        </head>
        <body>
            <div class="card-box" id="card-front">
                <img src="https://yourdomain.com/assets/img/frontsides.png" class="bg-img">
                <div class="content-layer">
                    <div class="abs" style="top: 75px; left: 90px; font-size: 18px; font-weight: 700;">${data.dl_number || '---'}</div>
                    <div class="abs" style="top: 173px; left: 20px; font-size: 13px;">
                        Name: <span style="font-weight: 700;">${data.name || '---'}</span>
                    </div>
                </div>
            </div>
            
            <div class="card-box" id="card-back">
                <img src="https://yourdomain.com/assets/img/backside.png" class="bg-img">
                <div class="content-layer">
                    <div class="abs" style="top: 6px; left: 20px; font-size: 18px; font-weight: 700;">DL No. ${data.dl_number || '---'}</div>
                </div>
            </div>
        </body>
        </html>
        `;

        await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

        const frontElement = await page.$('#card-front');
        const frontBase64 = await frontElement.screenshot({ encoding: 'base64' });
        
        const backElement = await page.$('#card-back');
        const backBase64 = await backElement.screenshot({ encoding: 'base64' });

        await browser.close();

        res.status(200).json({
            status: 'success',
            images: {
                front: 'data:image/png;base64,' + frontBase64,
                back: 'data:image/png;base64,' + backBase64
            }
        });

    } catch (error) {
        if (browser !== null) await browser.close();
        res.status(500).json({ status: 'error', message: error.message });
    }
}
