# @caption-editor/common-types

Shared JSON schemas and TypeScript types for the Caption Editor application.

## Purpose

This package provides:
- 📋 **JSON Schemas** - Standardized data structures
- 🔷 **TypeScript Types** - Auto-generated from schemas  
- 🔒 **Type Safety** - Ensures consistency between frontend/backend
- 📖 **API Contracts** - Request/response schemas

## Structure

```
common-types/
├── schemas/               # JSON Schema definitions
│   ├── caption-segment.json
│   ├── caption-file.json
│   └── api-contracts.json
├── src/types/            # Generated TypeScript types
│   ├── caption-segment.ts
│   ├── caption-file.ts
│   ├── api-contracts.ts
│   └── index.ts
└── scripts/
    └── generate-types.js  # Schema → TypeScript generator
```

## Usage

### Generate TypeScript Types

```bash
npm run generate-types
```

### Import in Frontend (Next.js)

```typescript
import { CaptionSegment, CaptionFile, TranscriptionRequest } from '@caption-editor/common-types';

const segment: CaptionSegment = {
  id: "1",
  startTime: 0.0,
  endTime: 3.5,
  text: "Hello world"
};
```

### Import in Backend (FastAPI)

```python
# Use JSON schemas for Pydantic model validation
# TODO: Add Python type generation script
```

## Key Types

- **`CaptionSegment`** - Individual caption with timing
- **`CaptionFile`** - Complete caption file with metadata
- **`TranscriptionRequest`** - AI transcription request
- **`TranscriptionResponse`** - AI transcription response
- **`HealthResponse`** - API health check response

## Validation

All schemas include:
- ✅ Required field validation
- ✅ Type constraints (min/max, patterns)
- ✅ Format validation (URIs, dates)
- ✅ Enum restrictions where applicable