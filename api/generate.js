const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

    const data = req.body;

    // Data Mapping from Codemart JSON
    const dlValue = data.dl_number || '---';
    const dobValue = data.dob || '---';
    const name = data.name || '---';
    const father = data.father_husband_name || '---';
    const address = data.address || '---';
    const auth = data.rto || '---';
    const stateHeader = "ISSUED BY GOVERNMENT OF " + (data.state ? data.state.toUpperCase() : "INDIA");

    let ntValid = (data.validity_non_transport || "").split('to');
    let issueDate = ntValid[0] ? ntValid[0].trim() : "---";
    let ntEnd = ntValid[1] ? ntValid[1].trim() : "---";

    let trValid = (data.validity_transport || "").split('to');
    let trEnd = trValid[1] ? trValid[1].trim() : (trValid[0] && trValid[0] !== "Not Found" ? trValid[0].trim() : "NA");

    const photoSrc = data.photo_base64 || '';
    const signSrc = data.signature_base64 || '';

    // Class of Vehicles logic
    let covHtml = '';
    if (data.class_of_vehicles && Array.isArray(data.class_of_vehicles)) {
        data.class_of_vehicles.forEach(v => {
            let icon = (v.cov.includes('LMV') || v.cov.includes('MCW') || v.cov.includes('2WN')) ? '🚗' : '🚚';
            let type = v.cov.includes('TRANS') ? 'TR' : 'NT';
            let authCode = dlValue.substring(0, 4);
            covHtml += `<tr>
                <td style="border: 1px solid #000; font-size: 12px; padding: 2px;">${icon}</td>
                <td style="border: 1px solid #000; font-size: 11px; font-weight: bold;">${v.cov}</td>
                <td style="border: 1px solid #000; font-size: 11px; font-weight: bold;">${authCode}</td>
                <td style="border: 1px solid #000; font-size: 11px; font-weight: bold;">${issueDate}</td>
                <td style="border: 1px solid #000; font-size: 11px; font-weight: bold;">${type}</td>
                <td style="border: 1px solid #000; font-size: 11px;"></td><td style="border: 1px solid #000; font-size: 11px;"></td><td style="border: 1px solid #000; font-size: 11px;"></td>
            </tr>`;
        });
    }

    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`DL:${dlValue}|DOB:${dobValue}|Name:${name}`)}`;

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
        await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 3 });

        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                body { margin: 0; padding: 20px; font-family: 'Roboto', sans-serif; background: white; }
                .card-box { width: 480px; height: 303px; position: relative; overflow: hidden; background: #fff; margin-bottom: 50px; border: 1px solid #ddd; }
                .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; object-fit: cover; }
                .content-layer { position: relative; z-index: 10; width: 100%; height: 100%; color: #000; }
                .abs { position: absolute; white-space: nowrap; }
                .abs-wrap { position: absolute; white-space: normal; line-height: 1.3; }
            </style>
        </head>
        <body>
            <div class="card-box" id="card-front">
                <img src="https://smartbot.in.net/card/dl/assets/img/frontsides.png" class="bg-img">
                <div class="content-layer">
                    <div class="abs" style="top: 8px; left: 90px; font-size: 20px; font-weight: 500;">INDIAN UNION DRIVING LICENCE</div>
                    <div class="abs" style="top: 35px; left: 110px; font-size: 15px;">${stateHeader}</div>
                    <div class="abs" style="top: 75px; left: 90px; font-size: 18px; font-weight: 700;">${dlValue}</div>
                    <div class="abs" style="top: 125px; left: 90px; font-size: 14px; font-weight: 700;">${issueDate}</div>
                    <div class="abs" style="top: 125px; left: 180px; font-size: 14px; font-weight: 700;">${ntEnd}</div>
                    <div class="abs" style="top: 125px; left: 270px; font-size: 14px; font-weight: 700;">${trEnd}</div>
                    <div class="abs-wrap" style="top: 173px; left: 20px; width: 365px; font-size: 13px;">
                        <div>Name : <span style="font-weight: 700;">${name}</span></div>
                        <div>DOB : <span style="font-weight: 700;">${dobValue}</span></div>
                        <div>S/D/W of : <span style="font-weight: 700;">${father}</span></div>
                        <div style="font-size: 11px;">Address : <span style="font-weight: 700;">${address}</span></div>
                    </div>
                    <img src="${photoSrc}" class="abs" style="top: 75px; right: 25px; width: 75px; height: 100px; border: 1px solid #ccc;">
                    <img src="${signSrc}" class="abs" style="top: 180px; right: 25px; width: 75px; height: 30px;">
                </div>
            </div>

            <div class="card-box" id="card-back">
                <img src="https://smartbot.in.net/card/dl/assets/img/backside.png" class="bg-img">
                <div class="content-layer">
                    <div class="abs" style="top: 6px; left: 20px; font-size: 18px; font-weight: 700;">DL No. ${dlValue}</div>
                    <img class="abs" style="top: 48px; left: 20px; width: 80px; height: 80px;" src="${qrSrc}">
                    <div class="abs" style="top: 135px; left: 20px; width: 440px;">
                        <table style="width: 100%; border-collapse: collapse; text-align: center;">
                            <tbody id="cov-body">${covHtml}</tbody>
                        </table>
                    </div>
                    <div class="abs" style="bottom: 13px; right: 20px; text-align: right; font-size: 12px;">${auth}</div>
                </div>
            </div>
        </body>
        </html>
        `;

        await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

        const frontBase64 = await (await page.$('#card-front')).screenshot({ encoding: 'base64' });
        const backBase64 = await (await page.$('#card-back')).screenshot({ encoding: 'base64' });

        // PDF Generation
        const pdfHtml = `<body style="margin:0"><img src="data:image/png;base64,${frontBase64}" style="width:85.6mm;margin:20mm 15mm"><img src="data:image/png;base64,${backBase64}" style="width:85.6mm;margin:20mm 5mm"></body>`;
        await page.setContent(pdfHtml);
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
        if (browser !== null) await browser.close();
        res.status(500).json({ status: 'error', message: error.message });
    }
}
