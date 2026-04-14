const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });

    const data = req.body;

    // Data Mapping
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

    // Class of Vehicles Loop
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
                <td style="border: 1px solid #000; font-size: 11px;"></td>
                <td style="border: 1px solid #000; font-size: 11px;"></td>
                <td style="border: 1px solid #000; font-size: 11px;"></td>
            </tr>`;
        });
    }
    covHtml += `<tr><td colspan="8" style="border: 1px solid #000; height: 14px;"></td></tr>`;

    // QR Code Generation
    const qrText = `DL:${dlValue}|DOB:${dobValue}|Name:${name}`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;

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
        await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 4 }); // 4x Quality

        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                body { margin: 0; padding: 20px; font-family: 'Roboto', sans-serif; background: transparent; }
                .card-box { width: 480px; height: 303px; position: relative; overflow: hidden; background: #fff; margin-bottom: 50px; }
                .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; object-fit: cover; }
                .content-layer { position: relative; z-index: 10; width: 100%; height: 100%; color: #000; text-align: left; }
                .abs { position: absolute; white-space: nowrap; }
                .abs-wrap { position: absolute; white-space: normal; line-height: 1.3; }
            </style>
        </head>
        <body>
            <div class="card-box" id="card-front-hd">
                <img src="https://smartbot.in.net/card/dl/assets/img/frontsides.png" class="bg-img">
                <div class="content-layer">
                    <div class="abs" style="top: 8px; left: 90px; font-size: 20px; font-weight: 500; color: #111; letter-spacing: 0.5px;">INDIAN UNION DRIVING LICENCE</div>
                    <div class="abs" style="top: 35px; left: 110px; font-size: 15px; font-weight: 400; color: #111;">${stateHeader}</div>
                    <div class="abs" style="top: 5px; right: 15px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #000; z-index: 10;">DL</div>
                    <div class="abs" style="top: 75px; left: 90px; font-size: 18px; font-weight: 700;">${dlValue}</div>
                    <div class="abs" style="top: 105px; left: 90px; font-size: 12px; font-weight: 500;">Issue Date</div>
                    <div class="abs" style="top: 105px; left: 180px; font-size: 12px; font-weight: 500;">Validity ( NT )</div>
                    <div class="abs" style="top: 105px; left: 270px; font-size: 12px; font-weight: 500;">Validity ( TR )</div>
                    <div class="abs" style="top: 125px; left: 90px; font-size: 14px; font-weight: 700;">${issueDate}</div>
                    <div class="abs" style="top: 125px; left: 180px; font-size: 14px; font-weight: 700;">${ntEnd}</div>
                    <div class="abs" style="top: 125px; left: 270px; font-size: 14px; font-weight: 700;">${trEnd}</div>

                    <div class="abs-wrap" style="top: 173px; left: 20px; width: 365px; font-size: 13px; line-height: 1.4; color: #000;">
                        <div style="margin-bottom: 2px;">Name : <span style="font-weight: 700;">${name}</span></div>
                        <div style="margin-bottom: 2px;">Date Of Birth : <span style="font-weight: 700;">${dobValue}</span> <span style="margin-left: 8px; font-size: 12px;">Blood Group: <b style="font-weight: 600;">U</b></span></div>
                        <div style="margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Son/Daughter/Wife of : <span style="font-weight: 700;">${father}</span></div>
                        <div style="display: flex; align-items: flex-start; margin-top: 1px;">
                            <span style="white-space: nowrap;">Address :&nbsp;</span>
                            <span style="font-size: 11px; font-weight: 700; line-height: 1.3;">${address}</span>
                        </div>
                    </div>

                    ${photoSrc ? `<img src="${photoSrc}" class="abs" style="top: 75px; right: 25px; width: 75px; height: 100px; object-fit: cover;">` : ''}
                    ${signSrc ? `<img src="${signSrc}" class="abs" style="top: 180px; right: 25px; width: 75px; height: 30px; mix-blend-mode: multiply;">` : ''}

                    <div class="abs" style="top: 215px; right: 25px; width: 75px; text-align: center; font-size: 10px;">Holder's Signature</div>
                    <div class="abs" style="top: 165px; right: -65px; font-size: 10px; transform: rotate(-90deg); width: 150px; text-align: center;">Date of First Issue ${issueDate}</div>
                </div>
            </div>

            <div class="card-box" id="card-back-hd">
                <img src="https://smartbot.in.net/card/dl/assets/img/backside.png" class="bg-img">
                <div class="content-layer">
                    <div class="abs" style="top: 6px; left: 20px; font-size: 18px; font-weight: 700;">DL No. ${dlValue}</div>
                    <img class="abs" style="top: 48px; left: 20px; width: 80px; height: 80px;" src="${qrSrc}">
                    <div class="abs" style="top: 50px; left: 120px; font-size: 13.5px;">ADPVEH No.(Regn.Numbers)</div>
                    <div class="abs" style="top: 85px; left: 120px; font-size: 13.5px;">Hazardous validity</div>
                    <div class="abs" style="top: 85px; left: 280px; font-size: 13.5px;">Hill Validity</div>

                    <div class="abs" style="top: 135px; left: 20px; width: 440px; height: 95px;">
                        <table style="width: 100%; border-collapse: collapse; text-align: center;">
                            <thead>
                                <tr>
                                    <th style="border: 1px solid #000; background: #9bd3f0; font-size: 9.5px; padding: 4px;">Class of<br>Vehicle</th>
                                    <th style="border: 1px solid #000; background: #9bd3f0; font-size: 9.5px; padding: 4px;">Code</th>
                                    <th style="border: 1px solid #000; background: #9bd3f0; font-size: 9.5px; padding: 4px;">Issued<br>by</th>
                                    <th style="border: 1px solid #000; background: #9bd3f0; font-size: 9.5px; padding: 4px;">Date of<br>Issue</th>
                                    <th style="border: 1px solid #000; background: #9bd3f0; font-size: 9.5px; padding: 4px;">Vehicle<br>Category</th>
                                    <th style="border: 1px solid #000; background: #9bd3f0; font-size: 9.5px; padding: 4px;">Badge<br>Number</th>
                                    <th style="border: 1px solid #000; background: #9bd3f0; font-size: 9.5px; padding: 4px;">Badge<br>Issued Date</th>
                                    <th style="border: 1px solid #000; background: #9bd3f0; font-size: 9.5px; padding: 4px;">Badge<br>Issued by</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${covHtml}
                            </tbody>
                        </table>
                    </div>

                    <div class="abs" style="bottom: 25px; left: 20px; font-size: 14px;">Mobile Number: Not Provided</div>
                    <div class="abs" style="bottom: 13px; right: 20px; text-align: right;">
                        <div style="font-size: 15px; font-weight: 500;">Licencing Authority</div>
                        <div style="font-size: 12.5px;">${auth}</div>
                    </div>
                    <div class="abs" style="bottom: 3px; left: 0; width: 100%; text-align: center; font-size: 8px; color: #444;">
                        This duplicate card, generated from publicly available data on sarathi.parivahan.gov.in, is for reference/personal use only.
                    </div>
                    <div class="abs" style="top: 160px; right: -42px; font-size: 10px; transform: rotate(-90deg); width: 100px; text-align: center;">Form 7 Rule 16 (2)</div>
                </div>
            </div>
        </body>
        </html>
        `;

        await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

        // 1. FRONT BASE64
        const frontElement = await page.$('#card-front-hd');
        const frontBase64 = await frontElement.screenshot({ encoding: 'base64' });

        // 2. BACK BASE64
        const backElement = await page.$('#card-back-hd');
        const backBase64 = await backElement.screenshot({ encoding: 'base64' });

        // 3. PDF GENERATION (A4 Size Layout)
        const pdfHtml = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0;">
            <div style="width: 210mm; height: 297mm; position: relative; background: #fff;">
                <img src="data:image/png;base64,${frontBase64}" style="position: absolute; left: 15mm; top: 20mm; width: 85.6mm; height: 54mm;">
                <img src="data:image/png;base64,${backBase64}" style="position: absolute; left: 110mm; top: 20mm; width: 85.6mm; height: 54mm;">
            </div>
        </body>
        </html>
        `;
        await page.setContent(pdfHtml, { waitUntil: 'load' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        const pdfBase64 = pdfBuffer.toString('base64');

        await browser.close();

        res.status(200).json({
            status: 'success',
            images: {
                front: 'data:image/png;base64,' + frontBase64,
                back: 'data:image/png;base64,' + backBase64,
                pdf: 'data:application/pdf;base64,' + pdfBase64
            }
        });

    } catch (error) {
        if (browser !== null) await browser.close();
        res.status(500).json({ status: 'error', message: error.message });
    }
}
