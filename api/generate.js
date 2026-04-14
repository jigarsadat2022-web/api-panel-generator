const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

    const data = req.body;
    let browser = null;

    try {
        // External Chromium Pack use kar rahe hain limit bypass karne ke liye
        browser = await puppeteer.launch({
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath('https://github.com/sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar'),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

        // Data Mapping
        const dlValue = data.dl_number || '---';
        const dobValue = data.dob || '---';
        const name = data.name || '---';
        const father = data.father_husband_name || '---';
        const address = data.address || '---';
        const auth = data.rto || '---';
        
        let ntValid = (data.validity_non_transport || "").split('to');
        let issueDate = ntValid[0] ? ntValid[0].trim() : "---";
        let ntEnd = ntValid[1] ? ntValid[1].trim() : "---";

        const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`DL:${dlValue}|DOB:${dobValue}|Name:${name}`)}`;

        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                body { margin: 0; padding: 0; font-family: 'Roboto', sans-serif; background: white; }
                .card-box { width: 480px; height: 303px; position: relative; overflow: hidden; margin: 20px; border: 1px solid #ccc; }
                .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
                .content-layer { position: relative; z-index: 10; width: 100%; height: 100%; }
                .abs { position: absolute; white-space: nowrap; font-size: 13px; }
            </style>
        </head>
        <body>
            <div id="card-front" class="card-box">
                <img src="https://smartbot.in.net/card/dl/assets/img/frontsides.png" class="bg-img">
                <div class="content-layer">
                    <div class="abs" style="top: 75px; left: 90px; font-weight: 700;">${dlValue}</div>
                    <div class="abs" style="top: 125px; left: 90px;">${issueDate}</div>
                    <div class="abs" style="top: 175px; left: 20px;"><b>Name:</b> ${name}</div>
                    <div class="abs" style="top: 195px; left: 20px;"><b>DOB:</b> ${dobValue}</div>
                    <img src="${data.photo_base64}" style="position:absolute; top:75px; right:25px; width:75px; height:100px;">
                </div>
            </div>
            <div id="card-back" class="card-box">
                <img src="https://smartbot.in.net/card/dl/assets/img/backside.png" class="bg-img">
                <div class="content-layer">
                    <div class="abs" style="top: 6px; left: 20px; font-weight: 700;">DL No. ${dlValue}</div>
                    <img src="${qrSrc}" style="position:absolute; top:48px; left:20px; width:80px; height:80px;">
                    <div class="abs" style="bottom: 15px; right: 20px;">${auth}</div>
                </div>
            </div>
        </body>
        </html>`;

        await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

        const frontBase64 = await (await page.$('#card-front')).screenshot({ encoding: 'base64' });
        const backBase64 = await (await page.$('#card-back')).screenshot({ encoding: 'base64' });

        // PDF Generation
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

        await browser.close();

        res.status(200).json({
            status: 'success',
            images: {
                front: 'data:image/png;base64,' + frontBase64,
                back: 'data:image/png;base64,' + backBase64,
                pdf: 'data:application/pdf;base64,' + pdfBuffer.toString('base64')
            }
        });

    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ status: 'error', message: error.message });
    }
}
