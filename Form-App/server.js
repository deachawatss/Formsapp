// Load environment variables from .env file
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
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ActiveDirectory = require('activedirectory2');
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

async function generatePDFwithPuppeteer(formId, token) {
  const url = `http://192.168.17.15:5000/view/${formId}`;
  
  // เปิดเบราว์เซอร์แบบ headless
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    
    // Set localStorage before navigating
    await page.evaluateOnNewDocument((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    // ตั้งค่า viewport ให้ชัดเจน
    await page.setViewport({ width: 1280, height: 800 });
    
    // ไปที่หน้าเว็บและรอจนโหลดเสร็จ
    await page.goto(url, { waitUntil: 'networkidle0' });
    // รอเพิ่มเติม 2 วินาทีเพื่อให้หน้า render ครบถ้วน
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // สั่งสร้าง PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    
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

// เพิ่ม middleware สำหรับตรวจสอบ token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
    req.user = user;
    next();
  });
};

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
app.post('/api/forms', authenticateToken, async (req, res) => {
  try {
    const { form_name, user_name, department, details, status } = req.body;
    const pool = await sql.connect(dbConfig);
    const request = new sql.Request();
    
    request
      .input('form_name', sql.NVarChar, form_name)
      .input('user_name', sql.NVarChar, user_name)
      .input('department', sql.NVarChar, department)
      .input('details', sql.NVarChar, JSON.stringify(details))
      .input('status', sql.NVarChar, status || 'Draft')
      .input('request_date', sql.DateTime, new Date());

    const result = await request.query(`
      INSERT INTO FormsSystem.Forms 
      (form_name, user_name, department, details, status, request_date)
      VALUES 
      (@form_name, @user_name, @department, @details, @status, @request_date);
      SELECT SCOPE_IDENTITY() as insertedId;
    `);

    res.json({ 
      message: 'Form submitted successfully', 
      insertedId: result.recordset[0].insertedId 
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ดึงข้อมูลฟอร์มทั้งหมด ----------------------------------------------
app.get('/api/forms', authenticateToken, async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query("SELECT * FROM FormsSystem.Forms ORDER BY request_date DESC");
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("❌ Error fetching forms:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }
});

// ดึงข้อมูลฟอร์มของผู้ใช้ที่ล็อกอินเท่านั้น ----------------------------------------------
app.get('/api/forms/my-forms', authenticateToken, async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('user_name', sql.NVarChar, req.user.name)
            .query(`
                SELECT id, form_name, user_name, department, status, request_date, details
                FROM FormsSystem.Forms 
                WHERE user_name = @user_name 
                ORDER BY request_date DESC
            `);

        // แปลง details เป็น JSON object ถ้าเป็น string
        const forms = result.recordset.map(form => {
            if (typeof form.details === 'string') {
                try {
                    form.details = JSON.parse(form.details);
                } catch (err) {
                    console.error("Error parsing details:", err);
                }
            }
            return form;
        });

        res.status(200).json(forms);
    } catch (error) {
        console.error("❌ Error fetching user forms:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }
});

// ดึงข้อมูลฟอร์มตาม ID ----------------------------------------------
app.get('/api/forms/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "รูปแบบ ID ไม่ถูกต้อง" });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id, form_name, user_name, department, details, status, request_date
        FROM FormsSystem.Forms 
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "ไม่พบฟอร์มที่ต้องการ" });
    }

    // แปลง details เป็น JSON object ถ้าเป็น string
    const form = result.recordset[0];
    if (typeof form.details === 'string') {
      try {
        form.details = JSON.parse(form.details);
      } catch (err) {
        console.error("Error parsing details:", err);
      }
    }

    res.json(form);
  } catch (error) {
    console.error("❌ Error fetching form:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

// API สร้าง PDF (ดาวน์โหลด)
app.get('/api/forms/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "รูปแบบ ID ไม่ถูกต้อง" });
    }

    const token = req.headers.authorization.split(' ')[1];
    const pdfBuffer = await generatePDFwithPuppeteer(id, token);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="form_${id}.pdf"`);
    res.write(pdfBuffer);
    res.end();
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการสร้าง PDF" });
  }
});

// API สร้าง PDF แล้วส่งอีเมลแนบไฟล์
app.post('/api/forms/pdf-email', authenticateToken, async (req, res) => {
    try {
        const { id, email } = req.body;
        const token = req.headers.authorization.split(' ')[1];
        
        if (!id || !email) {
            return res.status(400).json({ error: "Missing id or email" });
        }

        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query("SELECT * FROM FormsSystem.Forms WHERE id = @id");

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "ไม่พบฟอร์ม" });
        }

        const form = result.recordset[0];
        const requesterName = form.user_name;
        const pdfBuffer = await generatePDFwithPuppeteer(id, token);

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

// ต้องย้าย route นี้ไปไว้ด้านล่างสุด หลังจาก API routes ทั้งหมด
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

// กำหนดค่า Active Directory
const adConfig = {
  url: process.env.AD_URL,
  baseDN: process.env.AD_BASE_DN,
  username: process.env.AD_USERNAME,
  password: process.env.AD_PASSWORD,
  tlsOptions: {
    rejectUnauthorized: false
  },
  attributes: {
    user: [
      'dn', 'distinguishedName',
      'userPrincipalName', 'sAMAccountName', 'mail',
      'displayName', 'givenName', 'sn', 'department',
      'title', 'manager', 'memberOf'
    ]
  }
};

// ฟังก์ชันสำหรับตรวจสอบการเชื่อมต่อ AD
async function testADConnection() {
  const ad = new ActiveDirectory(adConfig);
  
  return new Promise((resolve, reject) => {
    ad.authenticate(process.env.AD_USERNAME, process.env.AD_PASSWORD, (err, auth) => {
      if (err) {
        console.error('❌ AD Connection test failed:', err);
        reject(err);
        return;
      }
      
      if (auth) {
        console.log('✅ AD Connection successful');
        resolve(true);
      } else {
        console.error('❌ AD Authentication failed');
        reject(new Error('Authentication failed'));
      }
    });
  });
}

// เรียกใช้ฟังก์ชันทดสอบเมื่อเริ่มต้นเซิร์ฟเวอร์
testADConnection().catch(err => {
  console.error('❌ Initial AD connection test failed:', err);
});

// API สำหรับ login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, rememberMe, useDomain } = req.body;
    
    if (useDomain) {
      // Domain Authentication
      const ad = new ActiveDirectory(adConfig);
      let username = email;

      // รองรับทั้งรูปแบบ username และ email
      if (email.includes('@')) {
        if (!email.endsWith('@newlywedsfoods.co.th')) {
          username = email.split('@')[0] + '@newlywedsfoods.co.th';
        }
      } else {
        username = email + '@newlywedsfoods.co.th';
      }

      try {
        console.log('Attempting AD authentication with username:', username);
        const auth = await new Promise((resolve, reject) => {
          ad.authenticate(username, password, (err, auth) => {
            if (err) {
              console.error('❌ AD Authentication error:', err);
              reject(err);
              return;
            }
            resolve(auth);
          });
        });

        if (!auth) {
          return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        // ค้นหาข้อมูลผู้ใช้จาก AD
        const user = await new Promise((resolve, reject) => {
          ad.findUser(username, (err, user) => {
            if (err) {
              console.error('❌ AD Find user error:', err);
              reject(err);
              return;
            }
            resolve(user);
          });
        });

        if (!user) {
          return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้ใน Domain' });
        }

        // ตรวจสอบว่ามีผู้ใช้ในฐานข้อมูลหรือไม่
        const pool = await sql.connect(dbConfig);
        let dbUser = await pool.request()
          .input('email', sql.NVarChar(255), user.mail || email)
          .query('SELECT * FROM FormsSystem.Users WHERE email = @email');

        if (dbUser.recordset.length === 0) {
          // ถ้าไม่มีให้สร้างผู้ใช้ใหม่
          await pool.request()
            .input('email', sql.NVarChar(255), user.mail || email)
            .input('name', sql.NVarChar(255), user.displayName)
            .input('department', sql.NVarChar(255), user.department || '')
            .input('role', sql.NVarChar(50), 'user')
            .input('password', sql.NVarChar(255), 'AD_USER')
            .query(`
              INSERT INTO FormsSystem.Users (email, name, department, role, is_domain_user, password)
              VALUES (@email, @name, @department, @role, 1, @password);
            `);

          dbUser = await pool.request()
            .input('email', sql.NVarChar(255), user.mail || email)
            .query('SELECT * FROM FormsSystem.Users WHERE email = @email');
        }

        const userInfo = dbUser.recordset[0];
        const tokenExpiration = rememberMe ? '7d' : '1d';
        const token = jwt.sign(
          {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            role: userInfo.role,
            isDomainUser: true
          },
          process.env.JWT_SECRET,
          { expiresIn: tokenExpiration }
        );

        res.json({
          token,
          user: {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            role: userInfo.role,
            isDomainUser: true
          }
        });

      } catch (adError) {
        console.error('❌ AD Error:', adError);
        return res.status(401).json({ 
          error: 'การยืนยันตัวตนผ่าน Domain ไม่สำเร็จ',
          details: process.env.NODE_ENV === 'development' ? adError.message : undefined
        });
      }
    } else {
      // Local Authentication (existing code)
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('email', sql.NVarChar(255), email)
        .query('SELECT * FROM FormsSystem.Users WHERE email = @email AND is_domain_user = 0');
      
      const user = result.recordset[0];
      
      if (!user) {
        return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      }
      
      const tokenExpiration = rememberMe ? '7d' : '1d';
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          name: user.name,
          role: user.role 
        }, 
        process.env.JWT_SECRET,
        { expiresIn: tokenExpiration }
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    }
  } catch (error) {
    console.error('❌ Error during login:', error);
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// API สำหรับลงทะเบียน
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, department } = req.body;
    
    const pool = await sql.connect(dbConfig);
    const checkEmail = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query('SELECT id FROM FormsSystem.Users WHERE email = @email');
    
    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.request()
      .input('email', sql.NVarChar(255), email)
      .input('password', sql.NVarChar(255), hashedPassword)
      .input('name', sql.NVarChar(255), name)
      .input('department', sql.NVarChar(255), department)
      .input('role', sql.NVarChar(50), 'user')
      .query(`
        INSERT INTO FormsSystem.Users (email, password, name, department, role)
        VALUES (@email, @password, @name, @department, @role);
      `);
    
    res.status(201).json({ message: 'ลงทะเบียนสำเร็จ' });
  } catch (error) {
    console.error('❌ Error during registration:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
  }
});

// API สำหรับรีเซ็ตรหัสผ่าน
app.post('/api/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query('SELECT id, name FROM FormsSystem.Users WHERE email = @email');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'ไม่พบอีเมลนี้ในระบบ' });
    }
    
    const user = result.recordset[0];
    const resetToken = jwt.sign(
      { id: user.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    await pool.request()
      .input('userId', sql.Int, user.id)
      .input('resetToken', sql.NVarChar(500), resetToken)
      .input('expiry', sql.DateTime, new Date(Date.now() + 3600000))
      .query(`
        INSERT INTO FormsSystem.PasswordResets (user_id, reset_token, expiry)
        VALUES (@userId, @resetToken, @expiry)
      `);
    
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: `"NWFTH - Forms System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'รีเซ็ตรหัสผ่าน',
      html: `
        <h3>สวัสดีคุณ ${user.name}</h3>
        <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ</p>
        <p>กรุณาคลิกที่ลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
        <a href="${resetLink}">รีเซ็ตรหัสผ่าน</a>
        <p>ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
      `
    });
    
    res.json({ message: 'ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบอีเมลของคุณ' });
  } catch (error) {
    console.error('❌ Error requesting password reset:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน' });
  }
});

// API สำหรับตั้งรหัสผ่านใหม่
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const pool = await sql.connect(dbConfig);
    
    const resetCheck = await pool.request()
      .input('token', sql.NVarChar(500), token)
      .input('now', sql.DateTime, new Date())
      .query(`
        SELECT user_id 
        FROM FormsSystem.PasswordResets 
        WHERE reset_token = @token 
        AND expiry > @now 
        AND used = 0
      `);
    
    if (resetCheck.recordset.length === 0) {
      return res.status(400).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.request()
      .input('id', sql.Int, decoded.id)
      .input('password', sql.NVarChar(255), hashedPassword)
      .query('UPDATE FormsSystem.Users SET password = @password WHERE id = @id');
    
    await pool.request()
      .input('token', sql.NVarChar(500), token)
      .query('UPDATE FormsSystem.PasswordResets SET used = 1 WHERE reset_token = @token');
    
    res.json({ message: 'รีเซ็ตรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' });
  }
});

// API สำหรับแก้ไขฟอร์ม
app.put('/api/forms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { form_name, user_name, department, details, status } = req.body;
    
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('form_name', sql.NVarChar, form_name)
      .input('user_name', sql.NVarChar, user_name)
      .input('department', sql.NVarChar, department)
      .input('details', sql.NVarChar, details)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE FormsSystem.Forms 
        SET form_name = @form_name,
            user_name = @user_name,
            department = @department,
            details = @details,
            status = @status
        WHERE id = @id;
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'ไม่พบฟอร์มที่ต้องการแก้ไข' });
    }

    res.json({ message: 'อัพเดทฟอร์มสำเร็จ' });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทฟอร์ม' });
  }
});

// API สำหรับลบฟอร์ม
app.delete('/api/forms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await sql.connect(dbConfig);
    
    // เช็คว่าฟอร์มมีอยู่จริงหรือไม่
    const checkForm = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT status FROM FormsSystem.Forms WHERE id = @id');
    
    if (checkForm.recordset.length === 0) {
      return res.status(404).json({ error: 'ไม่พบฟอร์มที่ต้องการลบ' });
    }

    // เช็คสถานะฟอร์ม
    const formStatus = checkForm.recordset[0].status;
    if (formStatus !== 'Draft') {
      return res.status(400).json({ 
        error: 'ไม่สามารถลบฟอร์มที่อยู่ในสถานะ Waiting For Approve หรือ Approved ได้' 
      });
    }

    // ลบฟอร์ม
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM FormsSystem.Forms WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'ไม่พบฟอร์มที่ต้องการลบ' });
    }

    res.json({ message: 'ลบฟอร์มสำเร็จ' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบฟอร์ม' });
  }
});
