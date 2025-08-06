# Document Extraction Tool – Backend

> **Note:** This repository contains the **backend** codebase for the Document Extraction Tool. The frontend is available at [doc-extractor-tool-frontend](https://github.com/aimoradajr/doc-extractor-tool-frontend).

An Express.js backend service for extracting and categorizing watershed data from PDFs using OpenAI-powered LLMs.

## 📚 Documentation

- [Extraction Logic](./EXTRACTION_LOGIC.md)
- [Testing & Accuracy](./TESTING.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Features

- PDF text extraction and structure preservation
- LLM-driven parsing & categorization (goals, BMPs, activities, metrics, outreach, geography)
- REST API endpoints for frontend integration

## 🔑 Environment Variables

Add these to your `.env` file:

```env
OPENAI_API_KEY=sk-proj-...   # Your OpenAI API key

# Model selection:
OPENAI_MODEL=gpt-3.5-turbo   # gpt-3.5-turbo (cheaper, faster) or gpt-4 (more accurate)
COMPARE_MODEL=gpt-4.1        # Model for accuracy testing

# For OpenAI Responses API (Playground prompts):
OPENAI_PROMPT_ID=pmpt_68...  # Playground prompt ID
OPENAI_PROMPT_VERSION=6      # Playground prompt version
```

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `OPENAI_MODEL`: Main extraction model (choose based on cost/accuracy)
- `COMPARE_MODEL`: Model used for accuracy testing
- `OPENAI_PROMPT_ID` & `OPENAI_PROMPT_VERSION`: Use pre-built prompts from OpenAI Playground for the Responses API

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
   cp .env.sample .env
   ```

   Edit `.env` file with your configuration:

   ```env
    PORT=5000
    NODE_ENV=development

    # OpenAI API Key (get from https://platform.openai.com/api-keys)
    # NOTE: Your OpenAI API key must have the following permissions:
    # - READ 'Models'
    # - WRITE 'Model capabilities'
    # - WRITE 'Files'
    # - WRITE 'Responses API'
    OPENAI_API_KEY=sk-proj-68...

    # OpenAI Model Selection (gpt-4 | gpt-3.5-turbo)
    OPENAI_MODEL=gpt-3.5-turbo

    # OpenAI Model for Accuracy Testing
    COMPARE_MODEL=gpt-4.1

    # OpenAI Playground Prompt ID and Version (for Responses API)
    OPENAI_PROMPT_ID=pmpt_68....
    OPENAI_PROMPT_VERSION=6
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

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

## OpenAI API Key Permissions

Your OpenAI API key must have the following permissions:

- READ 'Models'
- WRITE 'Model capabilities'
- WRITE 'Files'
- WRITE 'Responses API'

### Prompt Management

You can manage prompts in two ways:

1. **Inline Prompts** (default): Prompts are defined directly in the code.
2. **OpenAI Playground Prompts**: Use pre-created prompts from OpenAI Playground by setting the following in your `.env` file:

```env
OPENAI_PROMPT_ID=your-prompt-id
OPENAI_PROMPT_VERSION=your-prompt-version
```

## 🧪 Testing

> **Note:** The [frontend application](https://github.com/aimoradajr/doc-extractor-tool-frontend) includes a user-friendly interface for running accuracy tests directly, making it easy to evaluate extraction results without manual API calls.
>
> ![Frontend Accuracy Testing UI](./TESTING-screenshot1.png)

See [TESTING.md](./TESTING.md) for details on accuracy testing, presets, and manual API usage.

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

## 📈 Performance Considerations

- **File Size Limits**: Configured in upload middleware
- **Token Limits**: Text truncation for large documents
- **Rate Limiting**: Respect OpenAI API rate limits
- **Caching**: Consider implementing caching for frequently processed documents

## 📄 License

## 🔗 Related Projects

- **Frontend**: [Document Extractor Tool Frontend](../doc-extractor-tool-frontend)

---

**🐱🐱🐱**
