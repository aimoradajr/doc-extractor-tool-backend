# Testing & Accuracy

This document describes how to test extraction accuracy and run validation on sample data.

## Accuracy Testing

### Endpoint

`POST /api/accuracy/test`

Tests the accuracy of extraction using sample data presets.

**Parameters:**

- `pdf`: The PDF file (form-data)
- `mode`: `'preset'`
- `preset`: `'preset1'` (options: preset1, preset2, preset3, preset4)
- `compare_mode`: `'ai'`
- `compare_mode_model`: `'gpt-4.1'`
- `extract_mode`: `'extract2'` (options: extract1, extract2, extract3)

### Example Request

```bash
curl -X POST http://localhost:5000/api/accuracy/test \
  -H "Content-Type: application/json" \
  -d '{"preset": "preset1", "extractMode": "extract2"}'
```

### Available Presets

- `preset1`
- `preset2`
- `preset3`
- `preset4`

### Available Extract Modes

- `extract` or `extract1`: Chat Completions API
- `extract2`: Responses API with text input
- `extract3`: Responses API with direct file upload

## Manual Testing

1. Start the server: `npm run dev`
2. Use Postman or curl to test endpoints
3. Upload a PDF file to any extract endpoint

## Frontend Integration

The [frontend application](https://github.com/aimoradajr/doc-extractor-tool-frontend) provides a user-friendly interface for running accuracy tests and viewing results.

![alt text](TESTING-screenshot1.png)

## How Accuracy Is Computed

- Accuracy testing uses OpenAI GPT-4.1 to compare the expected (ground truth) data vs. the actual extracted data.
- The comparison returns a metrics object with overall and per-category precision, recall, and F1 score.
- Example output:

```json
{
  "testCase": "preset4-Bell Creek Muddy Creek Watershed Plan 2012",
  "extract_ai_model": "gpt-3.5-turbo (Responses API - text input)",
  "extract_mode": "extract2",
  "compare_ai_model": "gpt-4.1",
  "compare_mode": "ai",
  "metrics": {
    "precision": 0.68,
    "recall": 0.67,
    "f1Score": 0.67
  },
  "details": {
    "goals": { "precision": 0.5, "recall": 1, "f1Score": 0.67, ... },
    "bmps": { "precision": 1, "recall": 1, "f1Score": 1, ... },
    ...
  },
  "comparison": {
    "expected": { ... },
    "actual": { ... }
  },
  "detailedComparisons": {
    "goals": [
      {
        "type": "partial_match",
        "category": "goals",
        "expected": "Reduce nutrient and sediment loading to achieve water quality standards...",
        "actual": "Reduce nutrient and sediment loading coming from agricultural lands...",
        "message": "Covers nutrient/sediment reduction but omits specific water quality standards."
      },
      ...
    ]
  }
}
```

- **Precision** = correct extracted / total extracted
- **Recall** = correct extracted / total expected
- **F1 Score** = harmonic mean of precision and recall
- Scores are reported overall and for each category (goals, bmps, implementation, etc).
- Detailed comparisons show how each item was matched, partially matched, or missed.
