import { PrismaClient } from '@prisma/client';
const PuppeteerHTMLPDF = require('../../lib');
import hbs from 'handlebars';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    // Initialize Prisma client
    const prisma = new PrismaClient();
    
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

    // Prepare template data
    const templateData = {
      orderId: orderId,
      date: new Date().toLocaleDateString(),
      items: orderItems.map(item => ({
        id: item.order_item_id,
        product_id: item.product_id,
        customer_id: item.customer_id,
        product_qty: item.product_qty,
        price: item.price,
        regular_price: item.regular_price
      }))
    };

    // Generate HTML content
    const htmlTemplate = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1, h2 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Order Details</h1>
          <h2>Order ID: {{orderId}} - Date: {{date}}</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product ID</th>
                <th>Customer ID</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Regular Price</th>
              </tr>
            </thead>
            <tbody>
              {{#each items}}
              <tr>
                <td>{{id}}</td>
                <td>{{product_id}}</td>
                <td>{{customer_id}}</td>
                <td>{{product_qty}}</td>
                <td>{{price}}</td>
                <td>{{regular_price}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
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
    const prisma = new PrismaClient();
    await prisma.$disconnect();
    return res.status(500).json({ error: 'Error generating PDF: ' + error.message });
  }
} 