# PDF Document Extraction Tool - Backend

PDF extraction tool that uses LLM to parse agricultural/environmental watershed reports and extract structured data.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

API runs on: `http://localhost:5000`

## 📋 Current Features

- ✅ Express server with TypeScript
- ✅ PDF file upload & text extraction
- ✅ OpenAI integration for structured data extraction
- ✅ Proper Express architecture (routes/controllers/services)
- ✅ Error handling & validation middleware
- ✅ CORS enabled for frontend
- ✅ Environment variables support

## 🔧 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server

## 🌐 API Endpoints

### Upload & Extract Text
```
POST /api/upload
Content-Type: multipart/form-data
Body: pdf file (key: "pdf")
```

### Extract Structured Data (OpenAI)
```
POST /api/extract
Content-Type: multipart/form-data
Body: pdf file (key: "pdf")
```

## 🏗️ Project Structure

```
src/
├── index.ts                    # Server setup
├── types/
│   └── index.ts               # TypeScript interfaces
├── middleware/
│   ├── errorHandler.ts        # Global error handling
│   └── uploadMiddleware.ts    # File upload logic
├── routes/
│   └── uploadRoutes.ts        # Route definitions
├── controllers/
│   └── uploadController.ts    # Request/response handling
└── services/
    ├── pdfService.ts          # PDF text extraction
    └── openAIService.ts       # LLM integration
```

## 🔑 Environment Variables

```env
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
```

## 📚 Next Steps

- [ ] Add accuracy testing endpoints
- [ ] Download test PDFs from Mississippi Watershed site
- [ ] Create ground truth data
- [ ] Deploy to Render

## 🛠 Tech Stack

- Node.js + Express
- TypeScript
- OpenAI API (GPT-4)
- pdf-parse
- Multer (file uploads)

## 📊 Data Structure

Extracts structured data including:
- Goals and objectives
- Best Management Practices (BMPs)
- Implementation activities
- Monitoring metrics
- Outreach activities
- Geographic areas
