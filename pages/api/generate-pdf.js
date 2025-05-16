import { PrismaClient } from '@prisma/client';
const PuppeteerHTMLPDF = require('../../lib');
import hbs from 'handlebars';

export default async function handler(req, res) {
  // Allow both POST requests and GET requests with order ID in URL
  let orderId;
  
  if (req.method === 'POST') {
    // Get order ID from request body for POST requests
    orderId = req.body.orderId;
  } else if (req.method === 'GET') {
    // Get order ID from URL path for GET requests
    // URL format: /api/generate-pdf/[orderId]
    orderId = req.query.orderId;
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  // Initialize Prisma client outside of try block
  const prisma = new PrismaClient();
  
  try {
    // Get order data from database using Prisma
    const orderItems = await prisma.wp_wc_order_product_lookup.findMany({
      where: {
        order_id: BigInt(orderId)
      }
    });

    if (!orderItems || orderItems.length === 0) {
      await prisma.$disconnect();
      return res.status(404).json({ error: 'No order data found for ID: ' + orderId });
    }

    // Get contract number from wp_wc_orders table
    const orderData = await prisma.wp_wc_orders.findUnique({
      where: {
        id: BigInt(orderId)
      },
      select: {
        contract_number: true
      }
    });

    const contractNumber = orderData?.contract_number || orderId.toString();

    // Get customer information from the first order item
    const customerId = orderItems[0]?.customer_id;
    let customer = null;
    let vendor = null;

    try {
      // Try to get customer information
      if (customerId) {
        customer = await prisma.wp_users.findUnique({
          where: {
            ID: BigInt(customerId)
          }
        });
      }

      // Try to get vendor information if available
      const vendorId = orderItems[0]?.vendor_id;
      if (vendorId) {
        vendor = await prisma.wp_users.findUnique({
          where: {
            ID: BigInt(vendorId)
          }
        });
      }
    } catch (error) {
      console.warn('Could not fetch user information:', error);
      // Continue without user information
    }

    // Initialize PDF generator
    const htmlPDF = new PuppeteerHTMLPDF();
    const options = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    };
    htmlPDF.setOptions(options);

    // Calculate total amount - Convert BigInt to Number for calculations
    const totalAmount = orderItems.reduce((sum, item) => {
      const price = Number(item.price);
      const qty = Number(item.product_qty);
      return sum + (price * qty);
    }, 0);

    // Use current date if order date is not available
    const orderDate = new Date().toLocaleDateString();

    // Prepare template data - Convert BigInt values to strings for display
    const templateData = {
      orderId: orderId.toString(),
      contractNumber: contractNumber,
      date: orderDate,
      vendorName: vendor?.display_name || "N/A",
      customerName: customer?.display_name || "N/A",
      items: orderItems.map((item, index) => ({
        number: index + 1,
        product_id: item.product_id.toString(),
        product_qty: item.product_qty.toString(),
        price: Number(item.price).toFixed(2),
        total: (Number(item.price) * Number(item.product_qty)).toFixed(2)
      })),
      totalAmount: totalAmount.toFixed(2)
    };

    // Generate HTML content
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="uz">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Qurilish havozalarini qabul qilish-topshirish dalolatnomasi</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.5;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .date-location {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .content {
              text-align: justify;
              margin-bottom: 20px;
            }
            ol {
              margin-left: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid black;
              padding: 8px;
              text-align: center;
            }
            th {
              background-color: #f2f2f2;
            }
            .total-row {
              font-weight: bold;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .signature-block {
              width: 45%;
            }
            .signature-line {
              border-bottom: 1px solid black;
              margin: 5px 0;
              min-width: 200px;
              display: inline-block;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Qurilish havozalarini qabul qilish-topshirish dalolatnomasi</h2>
          </div>
          
          <div class="date-location">
            <div>Toshkent shahri</div>
            <div>Sana: {{date}}</div>
          </div>
          
          <div class="content">
            <p>YaTT <strong>{{vendorName}}</strong> keyingi o'rinlarda "Ijaraga beruvchi" deb yuritilib bir tomondan va <strong>{{customerName}}</strong> keyingi o'rinlarda "Ijarachi" deb yuritilub ikkinchi tomondan, birgalikda Taraflar deb yuritilib, qurilish havozalarini ijaraga berish xususida mazkur dalolatnomani quyidagilar haqida tuzdilar:</p>
            
            <p>"Ijaraga beruvchi" quyidagi ro'yxatda keltirilgan qurilish havozalarini belgilangan muddatga foydalanishi uchun topshirdi, "Ijarachi" esa haq to'lash evaziga uni qabul qildi.</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Mahsulot ID</th>
                <th>Miqdori</th>
                <th>Narxi</th>
                <th>Jami</th>
              </tr>
            </thead>
            <tbody>
              {{#each items}}
              <tr>
                <td>{{number}}</td>
                <td>{{product_id}}</td>
                <td>{{product_qty}}</td>
                <td>{{price}}</td>
                <td>{{total}}</td>
              </tr>
              {{/each}}
              <tr class="total-row">
                <td colspan="4">Umumiy Summa:</td>
                <td>{{totalAmount}}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="signatures">
            <div class="signature-block">
              <p>Ijaraga beruvchi:</p>
              <p><span class="signature-line"></span> (Imzo)</p>
              <p>{{vendorName}}</p>
            </div>
            <div class="signature-block">
              <p>Ijarachi:</p>
              <p><span class="signature-line"></span> (Imzo)</p>
              <p>{{customerName}}</p>
            </div>
          </div>
          
          <div class="footer">
            <p>Shartnoma raqami: {{contractNumber}}</p>
          </div>
        </body>
      </html>
    `;

    const template = hbs.compile(htmlTemplate);
    const content = template(templateData);

    // Generate PDF
    const pdfBuffer = await htmlPDF.create(content);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order_${orderId}.pdf`);
    
    // Send the PDF buffer
    res.send(pdfBuffer);
    
    // Disconnect Prisma client
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Ensure Prisma disconnects even if there's an error
    await prisma.$disconnect();
    return res.status(500).json({ error: 'Error generating PDF: ' + error.message });
  }
} 