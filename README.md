# PDF Document Extraction Tool - Backend

Advanced PDF extraction tool that uses AI to parse agricultural/environmental watershed reports and extract structured data with comprehensive accuracy testing capabilities.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

API runs on: `http://localhost:5000`

## 📋 Current Features

- ✅ Express server with TypeScript
- ✅ PDF file upload & text extraction
- ✅ OpenAI integration for structured data extraction (GPT-3.5/GPT-4)
- ✅ Comprehensive accuracy testing framework
- ✅ AI-powered comparison system with dual comparison modes
- ✅ Detailed comparison analysis with intuitive terminology
- ✅ Source excerpt tracking for verification
- ✅ Preset test cases for watershed management documents
- ✅ Professional error handling & validation
- ✅ CORS enabled for frontend integration
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

### Accuracy Testing - Upload Mode

```
POST /api/test
Content-Type: multipart/form-data
Body: {
  mode: "upload",
  pdf: file,
  groundTruth: file,
  compare_mode: "default" | "ai" (optional, default: "default"),
  compare_mode_model: "gpt-3.5-turbo" | "gpt-4" (optional, default: "gpt-3.5-turbo")
}
```

### Accuracy Testing - Preset Mode

```
POST /api/test
Content-Type: application/json
Body: {
  mode: "preset",
  preset: "preset1" | "preset2" | "preset3" | "preset4",
  compare_mode: "default" | "ai" (optional, default: "default"),
  compare_mode_model: "gpt-3.5-turbo" | "gpt-4" (optional, default: "gpt-3.5-turbo")
}
```

### Get Available Presets

```
GET /api/presets
```

## 🧪 Accuracy Testing Features

### Dual Comparison Modes

1. **Default Mode** (`compare_mode: "default"`)

   - Rule-based fuzzy matching algorithm
   - 70% similarity threshold with exact matching for names
   - Fast and deterministic results
   - Semantic comparison using objective field prioritization

2. **AI Mode** (`compare_mode: "ai"`)
   - GPT-powered semantic comparison
   - Intelligent similarity assessment
   - Natural language explanations
   - Model selection (GPT-3.5-turbo or GPT-4)
   - Automatic fallback handling for truncated responses

### Comparison Types

- ✅ `"perfect_match"` - Found exactly what was expected
- ✅ `"partial_match"` - Found something similar to expected
- ✅ `"missing_expected"` - Expected something but didn't find it
- ✅ `"surplus_actual"` - Found something that shouldn't be there

### Accuracy Metrics

- **Precision** - Correctness of extracted items
- **Recall** - Completeness of extraction
- **F1 Score** - Harmonic mean of precision and recall
- **Detailed Comparisons** - Item-by-item analysis with explanations

## 🏗️ Project Structure

```
src/
├── index.ts                    # Server setup
├── types/
│   ├── index.ts               # Core TypeScript interfaces
│   ├── types.ts               # Domain-specific types
│   └── pdf-parse.d.ts         # PDF parser type definitions
├── middleware/
│   ├── errorHandler.ts        # Global error handling
│   └── uploadMiddleware.ts    # File upload logic
├── routes/
│   ├── uploadRoutes.ts        # Upload/extract endpoints
│   └── accuracyRoutes.ts      # Accuracy testing endpoints
├── controllers/
│   ├── uploadController.ts    # PDF processing handlers
│   └── accuracyController.ts  # Accuracy testing handlers
└── services/
    ├── pdfService.ts          # PDF text extraction
    ├── openAIService.ts       # AI integration & comparison
    └── accuracyService.ts     # Accuracy calculation & analysis
test-data/
├── pdfs/                      # Test PDF documents
├── ground-truth/              # Expected extraction results
└── results/                   # Test result outputs
uploads/                       # Temporary file storage
```

## 🔑 Environment Variables

```env
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
```

## � Extracted Data Structure

The system extracts comprehensive structured data from watershed management documents:

### Core Components

- **Goals** - Management objectives with source excerpts
- **BMPs** - Best Management Practices with costs and targets
- **Implementation** - Activities with timelines and responsible parties
- **Monitoring** - Metrics with thresholds and sampling schedules
- **Outreach** - Education and community engagement activities
- **Geographic Areas** - Watersheds with land use and demographic data
- **Contacts & Organizations** - Stakeholder information

### Enhanced Features

- **Source Excerpts** - 20-word snippets showing where goals were found
- **Report Summary** - Automated counts and completion rates
- **Model Tracking** - Records which AI model was used for extraction

## 🎯 Preset Test Cases

Pre-configured watershed management documents for accuracy testing:

- **preset1** - Bell Creek Muddy Creek Watershed Plan 2012
- **preset2** - Basket Creek Hickahala Creek 9 Key Element Plan 2018
- **preset3** - Pickwick Reservoir Watershed Plan 2009
- **preset4** - Broken Pumpkin 9 Key Element Plan 2019

## 🔬 Advanced AI Features

### Intelligent Goal Extraction

- 6-step extraction process with watershed-specific rules
- Semantic field prioritization (objective over description)
- Exact excerpt capture for verification
- Token-efficient processing for large documents

### Smart Comparison Logic

- Fuzzy matching with 70% similarity threshold
- Exact matching for proper names to prevent false positives
- Semantic goal matching using objective fields
- Comprehensive debugging with detailed comparison breakdowns

### Error Handling & Resilience

- JSON truncation detection and recovery
- Graceful fallback responses for AI failures
- Token limit management with automatic summarization
- Detailed logging for debugging and optimization

## 📈 Recent Updates

- ✅ Added AI-powered comparison system
- ✅ Implemented source excerpt tracking
- ✅ Enhanced semantic goal matching
- ✅ Updated terminology to use intuitive comparison types
- ✅ Added comprehensive error handling for AI responses
- ✅ Optimized token usage for large documents
- ✅ Improved debugging capabilities with detailed comparisons

## 🛠 Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **AI Integration**: OpenAI API (GPT-3.5-turbo, GPT-4)
- **PDF Processing**: pdf-parse
- **File Handling**: Multer
- **Testing**: Custom accuracy framework with dual comparison modes
- **Architecture**: Clean separation with services, controllers, and routes

## 🚦 Next Steps

- [ ] Deploy to production environment
- [ ] Add batch processing capabilities
- [ ] Implement caching for improved performance
- [ ] Add support for additional document formats
- [ ] Create web-based accuracy testing dashboard
