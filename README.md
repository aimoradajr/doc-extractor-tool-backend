# Document Extraction Tool – Backend

> **Note:** This repository contains the **backend** codebase for the Document Extraction Tool. The frontend is available at [doc-extractor-tool-frontend](https://github.com/aimoradajr/doc-extractor-tool-frontend).

This is the backend of the PDF extraction tool that uses LLM (OpenAI) to extract watershed data.

Node.js API for PDF parsing, LLM-powered extraction, and data categorization.

## Features

- PDF text extraction and structure preservation
- LLM-driven parsing & categorization (goals, BMPs, activities, metrics, outreach, geography)
- REST API endpoints for frontend integration

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **PDF Processing**: pdf-parse, pdf2json
- **AI Integration**: OpenAI SDK
- **Testing**: Built-in accuracy testing framework

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/aimoradajr/doc-extractor-tool-backend.git
   cd doc-extractor-tool-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   PORT=5000
   NODE_ENV=development
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## OpenAI API Key Permissions

Your OpenAI API key must have the following permissions:

- READ 'Models'
- WRITE 'Model capabilities'
- WRITE 'Files'
- WRITE 'Responses API'

## 🚦 API Endpoints

### Data Extraction

#### `POST /extract`

Extract structured data using **_OpenAI Chat Completions API_**

- **Body**: Form data with `pdf` field (PDF)
- **Response**: Structured watershed management data

#### `POST /extract2`

Extract structured data using **_OpenAI Responses API_** with pre-parsed PDF text (via pdf-parse)

- **Body**: Form data with `pdf` field (PDF)
- **Response**: Structured watershed management data

#### `POST /extract3`

Extract structured data using **_OpenAI Responses API_** with direct PDF upload to OpenAI

- **Body**: Form data with `pdf` field (PDF)
- **Response**: Structured watershed management data

### Accuracy Testing

#### `GET /accuracy/presets`

List available preset test configurations

- **Response**: Array of available test presets

#### `POST /api/accuracy/test`

Tests the accuracy of extraction using sample data presets.

**Parameters:**

- `pdf`: The PDF file (form-data)
- `mode`: `'preset'` (string)
- `preset`: `'preset1'` (options: preset1, preset2, preset3, preset4)
- `compare_mode`: `'ai'` (string)
- `compare_mode_model`: `'gpt-4.1'` (string)
- `extract_mode`: `'extract2'` (options: extract1, extract2, extract3)

## 🔧 Configuration

### Model Selection

Edit the model in `src/services/openAIService.ts`:

```typescript
const EXTRACT_MODEL = "gpt-4.1"; // or "gpt-3.5-turbo", "gpt-4"
```

### Prompt Management

You can use prompts in two ways:

1. **Inline Prompts** (default): Prompts are defined in the code
2. **OpenAI Playground Prompts**: Use pre-created prompts from OpenAI Playground
   ```bash
   POST /extract2?promptId=pmpt_xxx&promptVersion=6
   ```

## 📁 Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── accuracyController.ts
│   └── uploadController.ts
├── middleware/           # Express middleware
│   ├── errorHandler.ts
│   └── uploadMiddleware.ts
├── routes/              # API route definitions
│   ├── accuracyRoutes.ts
│   └── uploadRoutes.ts
├── services/            # Business logic
│   ├── accuracyService.ts
│   ├── openAIService.ts
│   └── pdfService.ts
├── types/               # TypeScript type definitions
│   ├── index.ts
│   ├── pdf-parse.d.ts
│   └── types.ts
└── index.ts             # Application entry point

test-data/               # Test datasets
├── ground-truth/        # Reference data for accuracy testing
├── pdfs/               # Test PDF documents
└── results/            # Test results output

uploads/                # Uploaded PDF files storage
```

## 🧪 Testing

### Manual Testing

1. Start the server: `npm run dev`
2. Use a tool like Postman or curl to test endpoints
3. Upload a PDF file to any extract endpoint

### Accuracy Testing

```bash
# Run preset accuracy tests
curl -X POST http://localhost:5000/accuracy/test \
  -H "Content-Type: application/json" \
  -d '{"preset": "preset1", "extractMode": "extract3"}'
```

### Available Extract Modes

- `extract` or `extract1`: Chat Completions API
- `extract2`: Responses API with text input
- `extract3`: Responses API with direct file upload

## 🔍 Debugging

VS Code debugging configuration is included:

1. **Set breakpoints** in your TypeScript files
2. **Press F5** to start debugging
3. **Choose "Debug Node.js App"** for compiled JavaScript debugging
4. **Choose "Debug with ts-node"** for direct TypeScript debugging

## 📊 Response Format

All extraction endpoints return structured data in this format:

```json
{
  "model": "gpt-4.1 (Responses API - file input)",
  "reportSummary": {
    "summary": "Brief description of the watershed plan",
    "watershedName": "Primary watershed name",
    "planTitle": "Full document title",
    "planDate": "2024-01-01",
    "authors": ["Author Name"],
    "organizations": ["Organization Name"],
    "geographicRegion": "Geographic coverage area",
    "totalGoals": 5,
    "totalBMPs": 12,
    "completionRate": 0.75
  },
  "goals": [...],
  "bmps": [...],
  "implementation": [...],
  "monitoring": [...],
  "outreach": [...],
  "geographicAreas": [...],
  "contacts": [...],
  "organizations": [...]
}
```

## 🚨 Error Handling

The API includes comprehensive error handling:

- File validation errors
- PDF processing errors
- OpenAI API errors
- JSON parsing errors
- Detailed error logging

## 📈 Performance Considerations

- **File Size Limits**: Configured in upload middleware
- **Token Limits**: Text truncation for large documents
- **Rate Limiting**: Respect OpenAI API rate limits
- **Caching**: Consider implementing caching for frequently processed documents

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the logs for detailed error information
- Verify your OpenAI API key and model access

## 🔗 Related Projects

- **Frontend**: [Document Extractor Tool Frontend](../doc-extractor-tool-frontend)
- **Documentation**: [API Documentation](./docs/api.md)

---

**Built with ❤️ for watershed management document processing**
