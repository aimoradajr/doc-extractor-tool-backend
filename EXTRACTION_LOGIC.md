# Extraction Logic

This document explains the core logic and workflow for extracting structured watershed data from PDFs using LLMs (OpenAI).

## Overview

The backend accepts a watershed plan PDF and supports three extraction modes, designed to balance cost and accuracy:

### Extraction Modes

1. **extract1: Chat Completions API (pre-parse, lowest cost)**

   - The PDF is parsed locally using the `pdf-parse` Node.js library.
   - The extracted text is added to the prompt and sent to the OpenAI Chat Completions API.
   - This is the most cost-effective mode, suitable for simple documents and basic extraction needs.

2. **extract2: Responses API (pre-parse, newer API)**

   - The PDF is parsed locally using `pdf-parse`.
   - The extracted text is sent to the OpenAI Responses API, which is newer and designed for more advanced extraction workflows.
   - This mode offers improved accuracy and flexibility compared to extract1, with moderate cost.

3. **extract3: Responses API (direct PDF upload, highest accuracy)**
   - The PDF file is uploaded directly to OpenAI using the `files` API.
   - OpenAI processes the file in its own storage; the returned `file.id` is referenced in the prompt for the Responses API.
   - This mode leverages OpenAI's native PDF handling for best results, but may be more expensive due to file upload and processing.

### Prompt Construction

- For all modes, a prompt is constructed to guide the LLM in extracting goals, BMPs, implementation, monitoring, outreach, and geography.
- You can create and manage prompts in OpenAI Playground. By using a `prompt_id`, you can reuse and update prompts without changing backend code—just pass the `prompt_id` in the Responses API call.

### Output Format

- The API enforces that the LLM returns output in strict JSON format, following the expected schema for watershed management data.
- The backend validates the output and maps it to TypeScript interfaces, omitting any null or undefined optional fields.

## Key Steps

1. **PDF Parsing:** Uses `pdf-parse` (extract1, extract2) or OpenAI file upload (extract3).
2. **Prompt Construction:** Builds a detailed prompt for OpenAI, optionally using a Playground `prompt_id`.
   - If using pre-parsed text, the text is embedded in the prompt.
   - If uploading the PDF, the `file.id` is referenced in the prompt.
3. **LLM Extraction:** Sends text or file reference to OpenAI, receives structured JSON.
4. **Validation:** Ensures output matches expected schema, omits null/undefined optional fields.
5. **Post-processing:** Cleans up, deduplicates, and normalizes extracted data.

## Limitations

- `pdf-parse` only extracts text and does not recognize tables, images, or advanced PDF features. This can limit the accuracy of structured data extraction, especially for documents with complex layouts.

## Possible Future Improvements

- Integrate other LLMs (e.g., Anthropic Claude, Google Gemini) for broader model support and cost/accuracy options.
- Explore advanced PDF parsing libraries that can better identify tables, images, and document structure for richer extraction.
- Develop a curated set of third-party PDF documents with corresponding ground truth data. This enables benchmarking extraction accuracy and facilitates automated evaluation and comparison of different extraction modes and models.

## Endpoint Summary

- `/extract`: Chat Completions API (text input, pre-parse)
- `/extract2`: Responses API (text input, pre-parse)
- `/extract3`: Responses API (direct PDF upload)

See [README.md](./README.md) for endpoint details.
