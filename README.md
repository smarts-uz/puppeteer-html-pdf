# Order PDF Generator

A Next.js application that generates PDF documents from order data using Puppeteer and Prisma.

## Features

- Generate PDFs from order data
- RESTful API endpoint for PDF generation
- Modern React frontend with form validation
- Database integration with Prisma ORM
- Automatic PDF download
- Error handling and loading states

## Prerequisites

- Node.js (v14 or higher)
- MySQL/MariaDB database
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:
```bash
npm install
```

3. Set up your database connection in `.env`:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
```

4. Generate Prisma client:
```bash
npm run prisma
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Usage

### Generate PDF

**Endpoint:** `POST /api/generate-pdf`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
    "orderId": "1207"
}
```

**cURL Example:**
```bash
curl --location 'http://localhost:3000/api/generate-pdf' \
--header 'Content-Type: application/json' \
--data-raw '{
    "orderId": "1207"
}'
```

**Response:**
- Success: PDF file with `Content-Type: application/pdf`
- Error: JSON object with error message

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma` - Generate Prisma client and pull database schema
- `npm test` - Run tests

## Project Structure

```
├── pages/
│   ├── api/
│   │   └── generate-pdf.js    # PDF generation API endpoint
│   └── index.js              # Frontend page
├── prisma/
│   └── schema.prisma         # Database schema
├── lib/                      # Puppeteer HTML PDF library
├── public/                   # Static files
└── package.json             # Project configuration
```

## Database Schema

The application uses the following main table:

```prisma
model wp_wc_order_product_lookup {
  order_item_id          BigInt   @id
  item_id               Int?
  vendor_id             Int?
  order_id              BigInt
  parent_order_id       BigInt?
  parent_order_item_id  BigInt?
  product_id            BigInt
  is_refund             Int?
  is_bundle             Int?
  parent_product_id     Int?
  parent_item_id        BigInt?
  variation_id          BigInt
  customer_id           BigInt?
  date_created          DateTime
  product_net_revenue   Float
  product_gross_revenue Float
  coupon_amount         Float
  tax_amount            Float
  shipping_amount       Float
  shipping_tax_amount   Float
  start_date            DateTime?
  end_date              DateTime?
  queue                 BigInt?
  used_days             Int?
  paused_days           String?
  discount_days         Int?
  product_qty           Int
  refunded_qty          Int?
  lost_qty              BigInt?
  price                 BigInt?
  rental_price          BigInt?
  regular_price         BigInt?
  lost_price            BigInt?
  created_by            Int?
  updated_by            Int?
  deleted_by            Int?
  created_at            DateTime?
  updated_at            DateTime?
  deleted_at            DateTime?
  contr_agent_price     BigInt?
  contr_agent_rental_price BigInt?
  contr_agent_regular_price BigInt?
  contr_agent_lost_price BigInt?
}
```

## Dependencies

- Next.js - React framework
- Prisma - Database ORM
- Puppeteer - PDF generation
- Handlebars - HTML templating
- React - Frontend library

## Error Handling

The application handles various error cases:
- Invalid order ID
- Database connection issues
- PDF generation failures
- Missing required fields

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the GitHub repository. 