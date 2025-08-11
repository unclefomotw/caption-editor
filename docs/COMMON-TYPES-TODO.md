# Common Types Architecture Review & Action Plan

## Executive Summary

The `common-types` package was designed to serve as a single source of truth for data structures shared between the TypeScript frontend and Python backend. However, the current implementation is incomplete and underutilized, particularly on the Python backend side, defeating its core purpose of maintaining type consistency across the stack.

## Current State Analysis

### 1. Package Structure

The `common-types` package currently contains:

```
packages/common-types/
├── schemas/                    # JSON Schema definitions (source of truth)
│   ├── caption-file.json      # Main caption file structure
│   ├── caption-segment.json   # Individual caption segment
│   ├── health-response.json   # API health check response
│   ├── transcription-request.json  # AI transcription request
│   └── transcription-response.json # AI transcription response
├── scripts/
│   └── generate-types.js      # TypeScript generation script
├── src/types/                  # Generated TypeScript types
│   ├── caption-file.ts
│   ├── caption-segment.ts
│   ├── health-response.ts
│   ├── transcription-request.ts
│   ├── transcription-response.ts
│   └── index.ts
└── package.json
```

### 2. Frontend Usage (Partial Implementation)

The TypeScript frontend **partially** uses the generated types:

#### ✅ What's Working:

- Core data models (`CaptionFile`, `CaptionSegment`) are imported from `common-types`
- Files using these types:
  - `packages/web-ui/src/stores/caption-store.ts:6`
  - `packages/web-ui/src/components/CaptionEditor.tsx:18`
  - `packages/web-ui/src/utils/caption-parsers.ts:8`

#### ❌ Problems:

1. **Improper Import Paths**: Using relative paths instead of package name

   ```typescript
   // Current (problematic):
   import { CaptionFile } from '../../../common-types/src/types';

   // Should be:
   import { CaptionFile } from '@caption-editor/common-types';
   ```

2. **Duplicate API Types**: The `api-client.ts` file defines its own interfaces instead of using generated ones:
   ```typescript
   // Duplicated in api-client.ts:7-26
   export interface VideoUploadResponse { ... }
   export interface TranscriptionRequest { ... }
   export interface TranscriptionResponse { ... }
   ```

### 3. Backend Usage (Not Implemented)

The Python backend **completely ignores** the `common-types` package:

#### ❌ Current Problems:

1. **Manual Pydantic Model Definitions** (`packages/api-server/src/caption_editor_api/routers/captions.py`):

   ```python
   # Lines 22-37: Manually defined, duplicating JSON schemas
   class CaptionSegment(BaseModel):
       id: str
       start_time: float
       end_time: float
       text: str

   class CaptionFile(BaseModel):
       segments: list[CaptionSegment]
       language: str | None = "en"
       format: str | None = "vtt"
   ```

2. **No Python Generation Script**: Unlike TypeScript, there's no script to generate Pydantic models from JSON schemas
   - Note the TODO in `packages/common-types/README.md:60`: `# TODO: Add Python type generation script`

3. **API Contract Duplication**: Response models are manually defined:
   ```python
   # Lines 39-64: More manual definitions
   class TranscriptionRequest(BaseModel): ...
   class TranscriptionResponse(BaseModel): ...
   class VideoUploadResponse(BaseModel): ...
   ```

### 4. Schema vs Implementation Discrepancies

Comparing the JSON schemas with actual implementations reveals inconsistencies:

#### Field Naming Conventions:

- **JSON Schema**: Uses camelCase (`jobId`, `startTime`)
- **Python Backend**: Uses snake_case (`job_id`, `start_time`)
- **TypeScript**: Uses camelCase (matches schema)

This mismatch causes potential serialization/deserialization issues.

#### Missing Fields:

- Schema `TranscriptionResponse` includes an `error` object for detailed error handling
- Python implementation doesn't include this structure
- Schema includes `confidence` and `speaker` fields in `CaptionSegment`
- Neither frontend nor backend implementations use these fields

## Root Cause Analysis

### 1. Incomplete Initial Implementation

The architecture was designed but not fully implemented:

- TypeScript generation was completed
- Python generation was planned but never built
- Integration testing between frontend/backend types was not established

### 2. Developer Workflow Issues

Without automated generation, developers naturally:

- Define types locally where needed (faster during development)
- Don't check if shared schemas exist
- Create divergent implementations over time

### 3. Lack of Validation

No runtime validation against JSON schemas means:

- Type mismatches aren't caught early
- API contract violations go unnoticed
- Schema updates don't propagate to implementations

## Proposed Action Plan

### Phase 1: Python/Pydantic Generation (Priority: HIGH)

#### 1.1 Create Python Generation Script

Create `packages/common-types/scripts/generate-python.py`:

```python
#!/usr/bin/env python3
"""
Generate Pydantic models from JSON Schema definitions.
Uses datamodel-code-generator or similar tool.
"""

# Implementation details:
# 1. Read JSON schemas from schemas/
# 2. Generate Pydantic V2 models
# 3. Handle $ref resolution for nested schemas
# 4. Apply proper field naming (snake_case conversion)
# 5. Write to src/python/ directory
```

#### 1.2 Install Required Dependencies

Add to `packages/api-server/pyproject.toml`:

```toml
[tool.poetry.dependencies]
datamodel-code-generator = "^0.25.0"  # or similar tool
```

#### 1.3 Update Build Pipeline

Modify `packages/common-types/package.json`:

```json
{
  "scripts": {
    "generate-types": "node scripts/generate-types.js",
    "generate-python": "python scripts/generate-python.py",
    "build": "npm run generate-types && npm run generate-python"
  }
}
```

### Phase 2: Fix TypeScript Integration (Priority: HIGH)

#### 2.1 Fix Import Paths

Update all TypeScript files to use proper package imports:

Files to update:

- `packages/web-ui/src/stores/caption-store.ts`
- `packages/web-ui/src/components/CaptionEditor.tsx`
- `packages/web-ui/src/utils/caption-parsers.ts`

Change from:

```typescript
import { CaptionFile } from '../../../common-types/src/types';
```

To:

```typescript
import { CaptionFile } from '@caption-editor/common-types';
```

#### 2.2 Add Package Entry Point

Create `packages/common-types/index.ts`:

```typescript
export * from './src/types';
```

Update `packages/common-types/package.json`:

```json
{
  "main": "index.js",
  "types": "index.ts",
  "exports": {
    ".": {
      "types": "./index.ts",
      "default": "./index.js"
    }
  }
}
```

#### 2.3 Replace Duplicate API Types

Update `packages/web-ui/src/utils/api-client.ts`:

```typescript
import {
  VideoUploadResponse,
  TranscriptionRequest,
  TranscriptionResponse,
  HealthResponse,
} from '@caption-editor/common-types';

// Remove local interface definitions
```

### Phase 3: Backend Integration (Priority: HIGH)

#### 3.1 Replace Manual Pydantic Models

Update `packages/api-server/src/caption_editor_api/routers/captions.py`:

```python
from caption_editor_common_types import (
    CaptionSegment,
    CaptionFile,
    TranscriptionRequest,
    TranscriptionResponse,
    VideoUploadResponse
)

# Remove manual class definitions (lines 22-64)
```

#### 3.2 Create Python Package Structure

```
packages/common-types/
└── src/
    ├── types/     # TypeScript types
    └── python/    # Python/Pydantic models
        ├── __init__.py
        ├── caption_file.py
        ├── caption_segment.py
        ├── transcription_request.py
        ├── transcription_response.py
        └── health_response.py
```

#### 3.3 Handle Field Name Conversion

Implement automatic camelCase ↔ snake_case conversion:

```python
class CaptionSegment(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )

    id: str
    start_time: float  # Will serialize as "startTime"
    end_time: float    # Will serialize as "endTime"
    text: str
```

### Phase 4: Add Runtime Validation (Priority: MEDIUM)

#### 4.1 Frontend Validation

Add JSON schema validation using ajv:

```typescript
import Ajv from 'ajv';
import captionFileSchema from '@caption-editor/common-types/schemas/caption-file.json';

const ajv = new Ajv();
const validateCaptionFile = ajv.compile(captionFileSchema);

// Use in API responses:
if (!validateCaptionFile(response.captions)) {
  console.error('Invalid caption file:', validateCaptionFile.errors);
}
```

#### 4.2 Backend Validation

Pydantic already provides validation, but add explicit schema validation:

```python
from pydantic import ValidationError
import json
from pathlib import Path

def validate_against_schema(data: dict, schema_name: str):
    """Validate data against JSON schema."""
    schema_path = Path(__file__).parent / f"schemas/{schema_name}.json"
    # Implementation using jsonschema library
```

### Phase 5: Testing & Documentation (Priority: MEDIUM)

#### 5.1 Add Integration Tests

Create `packages/common-types/tests/`:

```typescript
// test-compatibility.ts
describe('Schema Compatibility', () => {
  it('should serialize/deserialize between frontend and backend formats', () => {
    // Test camelCase ↔ snake_case conversion
    // Test type compatibility
    // Test optional fields
  });
});
```

#### 5.2 Add Type Generation CI

Update `.github/workflows/ci.yml`:

```yaml
- name: Check Generated Types
  run: |
    npm run generate-types
    npm run generate-python
    git diff --exit-code || (echo "Generated types are out of sync" && exit 1)
```

#### 5.3 Update Documentation

- Add detailed README for type generation process
- Document field naming conventions
- Provide examples of proper usage
- Add troubleshooting guide

### Phase 6: Long-term Improvements (Priority: LOW)

#### 6.1 Consider Alternative Approaches

1. **Protocol Buffers / gRPC**
   - Pros: Native code generation for multiple languages
   - Cons: More complex setup, binary format

2. **OpenAPI Specification**
   - Pros: Industry standard, great tooling
   - Cons: More verbose, focused on REST APIs

3. **GraphQL Schema**
   - Pros: Strong typing, great developer experience
   - Cons: Requires GraphQL infrastructure

#### 6.2 Add More Metadata to Schemas

- Add validation rules (regex patterns, min/max values)
- Add documentation strings
- Add examples for each field
- Add versioning information

#### 6.3 Create Schema Registry

- Central location for all schemas
- Version management
- Change tracking
- Deprecation notices

## Implementation Timeline

### Week 1: Critical Fixes

- [ ] Create Python generation script
- [ ] Fix TypeScript import paths
- [ ] Replace backend manual types

### Week 2: Integration

- [ ] Test end-to-end type compatibility
- [ ] Add runtime validation
- [ ] Update CI/CD pipeline

### Week 3: Documentation & Testing

- [ ] Write comprehensive tests
- [ ] Update all documentation
- [ ] Train team on new workflow

## Success Metrics

1. **Zero Type Duplication**: All types defined once in JSON schemas
2. **100% Type Coverage**: All API contracts use generated types
3. **Automated Validation**: Runtime validation on both frontend and backend
4. **CI/CD Integration**: Type generation verified in CI pipeline
5. **Developer Adoption**: All new features use common-types

## Risks & Mitigations

### Risk 1: Breaking Changes

**Mitigation**: Implement changes incrementally with backward compatibility

### Risk 2: Development Slowdown

**Mitigation**: Improve generation scripts for faster iteration

### Risk 3: Team Resistance

**Mitigation**: Demonstrate benefits with clear examples and documentation

## Conclusion

The `common-types` architecture is fundamentally sound but requires completion of the implementation, particularly:

1. **Python/Pydantic generation** (most critical missing piece)
2. **Proper package imports** in TypeScript
3. **Replacement of duplicate type definitions**
4. **Runtime validation** using the schemas

Once properly implemented, this architecture will provide:

- **Type safety** across the entire stack
- **Single source of truth** for all data structures
- **Automatic documentation** from schemas
- **Reduced bugs** from type mismatches
- **Faster development** with generated code

The investment in completing this implementation will pay dividends in code quality, maintainability, and developer productivity.
