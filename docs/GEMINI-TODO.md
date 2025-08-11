# Architectural Review & Action Plan: `common-types`

## 1. Overview

This document details the findings of an architectural review of the `caption-editor` monorepo, initiated to understand the role and usage of the `packages/common-types` package. The review was prompted by the observation that the Python `api-server` did not appear to be using this shared package.

## 2. Findings

The investigation confirms that the user's initial observation was correct and reveals a wider architectural disconnect. The core findings are detailed below.

### 2.1. The `common-types` Package is the Intended Source of Truth

The `packages/common-types` directory is structured as a dedicated, language-agnostic source of truth for the data models (the API contract) shared between the frontend and backend.

- **Source of Truth:** It uses JSON Schema (`.json` files) in its `/schemas` directory to define core data entities like `CaptionFile`, `TranscriptionRequest`, and `HealthResponse`.
- **Code Generation:** It contains a Node.js script (`scripts/generate-types.js`) that uses the `json-schema-to-typescript` library to automatically generate TypeScript type definitions from the JSON schemas.
- **Architectural Intent:** This setup represents a sound architectural pattern for monorepos. It centralizes the API contract, preventing drift and ensuring that different services (like a TypeScript frontend and a Python backend) can rely on a single, authoritative definition.

### 2.2. The `web-ui` is Not Using the Shared Types

While the `web-ui/package.json` correctly lists `@caption-editor/common-types` as a dependency, a search of the `web-ui` source code reveals that **it is not currently importing or using any of the generated types.**

This is a critical gap. The infrastructure is in place, but the primary consumer it was built for is not leveraging it. This means any data structures used in the frontend are likely defined manually, defeating the purpose of the shared package.

### 2.3. The `api-server` Manually Re-implements the Data Models

The investigation confirms that the Python `api-server` **does not** use the `common-types` package.

- **No Dependency:** The `api-server/pyproject.toml` file shows no dependency on `common-types` or any related code generation tools.
- **Manual Pydantic Models:** The API's data models are manually defined as Pydantic classes within the router files (e.g., `HealthResponse` in `routers/health.py`, and `CaptionFile`, `TranscriptionRequest`, etc., in `routers/captions.py`).

These Pydantic models are a direct, manual duplication of the definitions stored in the JSON schemas.

## 3. Architectural Analysis & Conclusion

You were correct in your assessment, and your query has uncovered a significant architectural inconsistency.

The project has the _right idea_ but suffers from a _failure in execution_. The `common-types` package was created to serve as a single source of truth, which is a best practice. However, because **neither the `web-ui` nor the `api-server` currently consumes it**, the package provides no actual value and instead creates a misleading sense of security.

The current state has several negative consequences:

- **Redundant Definitions:** The same data structures are defined in at least three places: JSON Schema, Python Pydantic models, and likely somewhere in the `web-ui` code.
- **High Risk of Drift:** Any change to a data model (e.g., adding a field) must be manually coordinated across three different locations and two languages. It is almost guaranteed that these definitions will diverge over time, leading to subtle and hard-to-debug integration bugs.
- **Maintenance Overhead:** The cognitive load and development effort are increased, as developers must be aware of and update multiple sources.

## 4. Recommended Actions (TODO)

To resolve this architectural drift and realize the intended benefits of the monorepo structure, the following actions should be taken. No source code has been modified, as requested.

### 4.1. Integrate `common-types` with the `api-server`

A process must be implemented to automatically generate the Python Pydantic models from the JSON schemas.

1.  **Add a Code Generation Tool:** Introduce a development dependency to the `api-server` for generating Pydantic models from JSON Schema. The recommended tool for this is [`datamodel-code-generator`](https://github.com/koxudaxi/datamodel-code-generator).

    ```bash
    # From within packages/api-server
    poetry add --group dev datamodel-code-generator
    ```

2.  **Create a Generation Script:** Add a script to `pyproject.toml` (e.g., using `poe the poet` or just a shell script) that runs the generator. This script should:
    - Target the `.json` files in `packages/common-types/schemas`.
    - Output the generated Pydantic models to a dedicated file, for example: `packages/api-server/src/caption_editor_api/models.py`.
    - Ensure the generated file includes a clear "do not edit manually" banner.

3.  **Refactor the API:** Modify the FastAPI routers (`captions.py`, `health.py`) to import and use the newly generated models from `models.py` instead of their current, manually defined ones.

4.  **Automate the Workflow:** Integrate the generation script into the development workflow. This could be a `turbo.json` task that ensures the Python models are re-generated whenever the schemas in `common-types` change.

### 4.2. Integrate `common-types` with the `web-ui`

The frontend must be refactored to consume the types it already depends on.

1.  **Identify Manual Types:** Locate where the `web-ui` currently defines its versions of `CaptionFile`, `TranscriptionRequest`, etc.
2.  **Refactor Imports:** Replace these manual definitions with imports from `@caption-editor/common-types`. For example:
    ```typescript
    import type {
      CaptionFile,
      TranscriptionRequest,
    } from '@caption-editor/common-types';
    ```
3.  **Ensure Build Process:** Verify that the `web-ui`'s build process (`next build`) correctly triggers the `generate-types` script in `common-types` first. This can be configured in the root `turbo.json`.

By implementing these changes, the project will correctly align with its intended architecture, reducing bugs, simplifying maintenance, and creating a truly single source of truth for its API contract.
