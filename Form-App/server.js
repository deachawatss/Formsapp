require('dotenv').config();
const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');
const PdfPrinter = require('pdfmake');
// const { default: PurchaseRequestForm } = require('../form-frontend/src/pages/PurchaseRequestForm');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// ตั้งค่า SQL Server
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,   // 192.168.0.86
  database: process.env.DB_NAME,     // TFCPILOT
  port: parseInt(process.env.DB_PORT), // 49381
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function connectDB() {
    try {
        await sql.connect(dbConfig);
        console.log("✅ Connected to SQL Server");
    } catch (err) {
        console.error("❌ Database connection failed: ", err);
    }
}
connectDB();

// Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// ฟังก์ชันสร้าง PDF (return Buffer) -----------------------------------
const fonts = {
    Roboto: {
        normal: __dirname + '/fonts/Roboto-Regular.ttf',
        bold: __dirname + '/fonts/Roboto-Medium.ttf'
    }
};

async function generatePDFwithPuppeteer(formId) {
  const url = `http://192.168.17.15:5000/view/${formId}`;
  
  // เปิดเบราว์เซอร์แบบ headless
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    
    // ตั้งค่า viewport ให้ชัดเจน (ตัวอย่าง 1280x800)
    await page.setViewport({ width: 1280, height: 800 });
    
    // ไปที่หน้าเว็บและรอจนโหลดเสร็จ
    await page.goto(url, { waitUntil: 'networkidle0' });
    // รอเพิ่มเติม 2 วินาทีเพื่อให้หน้า render ครบถ้วน
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Debug: ถ่าย screenshot เพื่อตรวจสอบว่า page render ถูกต้องหรือไม่
    await page.screenshot({ path: `debug_${formId}.png`, fullPage: true });
    console.log(`[DEBUG] Screenshot saved: debug_${formId}.png`);
    
    // Debug: ดู snippet ของ HTML ที่ Puppeteer ได้
    const content = await page.content();
    console.log("[DEBUG] Puppeteer HTML snippet:", content.slice(0, 300));
    
    // สั่งสร้าง PDF (กำหนดให้มี background ด้วย)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    
    console.log("[DEBUG] Generated PDF Buffer length:", pdfBuffer.length);
    console.log("[DEBUG] Generated PDF Buffer snippet (first 50 bytes):", pdfBuffer.slice(0, 50).toString());
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
const printer = new PdfPrinter(fonts);

async function generatePDF(form) {
    return new Promise((resolve, reject) => {
        let detailsData = {};
        try {
            detailsData = JSON.parse(form.details);
        } catch (err) {}

        const { name, department, date, items, subTotal, vat, grandTotal } = detailsData || {};

        //ตาราง items
        let itemsTableBody = [
            ['Description', 'Unit', 'Quantity', 'Cost', 'Amount']
        ];
        if (items && Array.isArray(items)) {
            items.forEach(item => {
                itemsTableBody.push([
                    item.description || '',
                    item.unit || '',
                    item.quantity || '',
                    item.cost || '',
                    item.amount || ''
                ]);
            });
        }

        const docDefinition = {
            content: [
                { text: 'Newly Weds Foods (Thailand) Limited', style: 'header' },
                { text: 'General Purchase Requisition\n\n', style: 'subheader' },
                { text: 'FORM # PC-FM-013 \n\n', style: 'subheader' },
                { text: `Name: ${name || form.user_name}`, margin: [0, 2, 0, 2] },
                { text: `Department: ${department || form.department}`, margin: [0, 2, 0, 2] },
                { text: `Date: ${date || ''}`, margin: [0, 2, 0, 10] },
                { text: 'Items', style: 'subheader2' },
                {
                    table: {
                        body: itemsTableBody
                    },
                    margin: [0, 0, 0, 10]
                },
                {
                    text: `Sub Total: ${subTotal || 0} 
                    VAT (7%): ${vat || 0}
                    Grand Total: ${grandTotal || 0}\n\n`,
                    margin: [0, 2, 0, 10]
                },
                { text: 'End of PDF.', style: 'smallText' }
            ],
            styles: {
                header: { fontSize: 16, bold: true },
                subheader: { fontSize: 14, bold: true },
                subheader2: { fontSize: 12, bold: true },
                smallText: { fontSize: 10 }
            }
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks = [];
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        pdfDoc.on('error', reject);

        pdfDoc.end();
    });
}

// API ส่งอีเมลธรรมดา (optional) ---------------------------------------
app.post('/api/send-email', async (req, res) => {
    const { to, subject, message } = req.body;
    if (!to || !subject || !message) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    try {
        await transporter.sendMail({
            from: `"NWFTH - Forms System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text: message
        });
        res.json({ success: true, message: "✅ Email sent successfully" });
    } catch (error) {
        console.error("❌ Error sending email:", error);
        res.status(500).json({ success: false, error: "Failed to send email" });
    }
});

// บันทึกฟอร์ม และ return ID -------------------------------------------
app.post('/api/forms', async (req, res) => {
    try {
        const { form_name, user_name, department, details, supervisorEmail } = req.body;
        if (!form_name || !user_name) {
            return res.status(400).json({ error: "form_name และ user_name จำเป็นต้องมีข้อมูล" });
        }
        const pool = await sql.connect(dbConfig);
        // ใช้ OUTPUT Inserted.id เพื่อ return ID ที่เพิ่ง Insert
        const result = await pool.request()
        .input('form_name', sql.NVarChar(255), form_name)
        .input('user_name', sql.NVarChar(255), user_name)
        .input('department', sql.NVarChar(255), department)
        .input('details', sql.NVarChar(sql.MAX), details)
            .query(`
                INSERT INTO Forms (form_name, user_name, department, details)
                OUTPUT Inserted.id
                VALUES (@form_name, @user_name, @department, @details);
            `);

        const insertedId = result.recordset[0].id; // ดึง ID ที่เพิ่งแทรก
        res.status(201).json({
            success: true,
            message: "✅ บันทึกฟอร์มสำเร็จ",
            insertedId
        });
    } catch (error) {
        console.error("❌ Error inserting form:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
    }
});

// ดึงข้อมูลฟอร์มทั้งหมด ----------------------------------------------
app.get('/api/forms', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query("SELECT * FROM Forms ORDER BY request_date DESC");
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("❌ Error fetching forms:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }
});

// ลบฟอร์ม -------------------------------------------------------------
app.delete('/api/forms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query("DELETE FROM Forms WHERE id = @id");
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "ไม่พบฟอร์มที่ต้องการลบ" });
        }
        res.status(200).json({ message: "✅ ลบฟอร์มสำเร็จ" });
    } catch (error) {
        console.error("❌ Error deleting form:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบข้อมูล" });
    }
});

// API สร้าง PDF (ดาวน์โหลด) -------------------------------------------
app.get('/api/forms/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DEBUG] Generating PDF for form ID: ${id}`);
    const pdfBuffer = await generatePDFwithPuppeteer(id);

    console.log("[DEBUG] PDF Buffer length:", pdfBuffer.length);
    console.log("[DEBUG] PDF Buffer snippet (first 50 bytes):", pdfBuffer.slice(0, 50).toString());
    fs.writeFileSync(`debug_${id}.pdf`, pdfBuffer);
    console.log(`[DEBUG] Saved debug PDF as debug_${id}.pdf`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="form_${id}.pdf"`);
    console.log("[DEBUG] Sending PDF response...");
    res.write(pdfBuffer);
    res.end();
    console.log("[DEBUG] PDF response sent.");
  } catch (error) {
    console.error("❌ Error generating PDF with Puppeteer:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการสร้าง PDF" });
  }
});

// API สร้าง PDF แล้วส่งอีเมลแนบไฟล์ ----------------------------------
app.post('/api/forms/pdf-email', async (req, res) => {
    try {
        const { id, email } = req.body;
        if (!id || !email) {
            return res.status(400).json({ error: "Missing id or email" });
        }

        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query("SELECT * FROM Forms WHERE id = @id");

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "ไม่พบฟอร์ม" });
        }

        const form = result.recordset[0];
        const requesterName = form.user_name;
        const pdfBuffer = await generatePDFwithPuppeteer(id);

        await transporter.sendMail({
            from: `"NWFTH - Forms System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Purchase Request Submission",
            html: `<!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8" />
            <style>
                body {
                font-family: Arial, sans-serif;
                color: #333;
                font-size: 14px;
                margin: 0;
                padding: 20px;
                }
                .header {
                text-align: left;
                margin-bottom: 10px;
                }
                .header img {
                max-width: 150px;
                display: block;
                margin: 0 auto 5px auto;
                }
                .email-title {
                color: #2e5ba6;
                font-size: 18px;
                font-weight: bold;
                }
                .content p {
                line-height: 1.5;
                margin: 0 0 10px;
                }
                .footer {
                margin-top: 20px;
                font-weight: bold;
                }
            </style>
            </head>
            <body>
            <div class="header">
                <img
                    src="cid:logo.nwfth"
                    alt="NWFTH Logo"
                    style="max-width:120px; display:block; margin-bottom:0;"
                />
                <h1 class="email-title">Purchase Request Submission</h1>
                </div>
            <div class="content">
                <p>Dear,</p>
                <p>
                <strong>(${requesterName})</strong> has submitted a purchase request in our system.
                </p>
                <p>
                Please find the attached PDF for more details.
                </p>
                <p>
                We kindly request your review and approval at your earliest convenience.
                </p>
                <p>Thank you for your cooperation.</p>
            </div>
            <div class="footer">
                Best regards,<br/>
                NWFTH - Forms System
            </div>
            </body>
            </html>`,
            attachments: [
                {
                  filename: `form_${id}.pdf`,
                  content: pdfBuffer
                },
                {
                  filename: 'logo.png',
                  path: 'https://img2.pic.in.th/pic/logo14821dedd19c2ad18.png',
                  cid: 'logo.nwfth'
                }
            ]
        });

        res.json({ success: true, message: "Email Has been sent To Manager" });
    } catch (error) {
        console.error("❌ Error emailing PDF:", error);
        res.status(500).json({ error: "Failed to send PDF email" });
    }
});

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// รันเซิร์ฟ
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// ทดสอบ
app.get('/', (req, res) => {
    res.send('✅ Server is running...');
});
