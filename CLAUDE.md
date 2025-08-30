# {{APP_NAME}} - Flows App

For general app development guidance, see @../CLAUDE.md

## Overview

{{APP_DESCRIPTION}}

This app demonstrates the standard patterns for Flows apps:

- Clean configuration schema with secrets support
- Simple block structure with proper error handling
- Type-safe implementation with TypeScript
- Comprehensive CI/CD pipeline

## Architecture

### App Structure

```text
{{app_name}}/
├── blocks/                   # Block implementations
│   ├── index.ts              # Block registry and exports
│   └── exampleBlock.ts       # Example block implementation
├── .github/workflows/ci.yml  # CI/CD pipeline
├── main.ts                   # App definition
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Documentation and setup guide
```

### Key Components

#### Configuration (`main.ts`)

The app requires two configuration values:

- `apiKey` (secret) - API authentication key
- `baseUrl` (text) - API endpoint URL with default value

#### Block Organization (`blocks/`)

The template uses a clean block organization pattern:

- **`blocks/index.ts`** - Central registry that exports all blocks as a dictionary
- **`blocks/exampleBlock.ts`** - Example block implementation
- **`main.ts`** - Imports blocks via `Object.values(blocks)` for clean registration

**Example Block Features:**

- Accepts a text message as input
- Uses the configured API key and base URL
- Returns a processed result or throws errors
- Follows standard error handling patterns

## Implementation Patterns

### Block Structure

```typescript
const exampleBlock: AppBlock = {
  name: "Block Name",
  description: "What this block does",
  category: "Category",

  inputs: {
    default: {
      name: "Input Name",
      description: "Input description",
      config: {
        /* JSON Schema */
      },
      onEvent: async (input, { events }) => {
        // Block logic with error handling
      },
    },
  },

  outputs: {
    default: {
      name: "Output Name",
      description: "Output description",
      type: {
        /* JSON Schema */
      },
    },
  },
};
```

### Error Handling Pattern

```typescript
// Block logic - just throw errors, don't wrap in success/failure objects
const result = await someOperation();
await events.emit(result);
```

### Configuration Access

```typescript
const apiKey = input.app.config.apiKey as string;
const baseUrl = input.app.config.baseUrl as string;
```

## Development Workflow

### Local Development

1. **Setup**: `npm install`
2. **Type Check**: `npm run typecheck`
3. **Format**: `npm run format`
4. **Bundle**: `npm run bundle`

### Release Process

1. **Develop**: Make changes and test locally
2. **Commit**: Push to feature branch
3. **Review**: Create PR, wait for CI validation
4. **Release**: Tag with `v1.0.0` format
5. **Deploy**: CI automatically creates release and updates registry

### CI/CD Pipeline

The template includes a complete CI/CD system:

- **Quality Gates**: Type checking, formatting validation
- **Automated Releases**: Tag-triggered GitHub releases
- **Version Registry**: Self-maintaining `versions.json`
- **Branch Protection**: Main branch protected, requires CI

## Best Practices

### Code Organization

- Modular block structure in `blocks/` directory
- Central block registry for easy management
- Clear separation of concerns
- Comprehensive type definitions

### Error Handling

- Let errors bubble up naturally - don't catch and wrap them
- Use descriptive error messages
- The framework will handle error catching and reporting

### Security

- Use `secret: true` for sensitive configuration
- Never log sensitive data
- Validate all inputs

### Documentation

- Clear block names and descriptions
- Comprehensive README
- Type annotations for all interfaces

## Extension Guidelines

### Adding New Blocks

1. Create block file in `blocks/` directory (e.g., `blocks/myBlock.ts`)
2. Import and add to `blocks` dictionary in `blocks/index.ts`
3. Export from `blocks/index.ts` for external use
4. Test with `npm run typecheck`

**Example:**

```typescript
// blocks/myBlock.ts
export const myBlock: AppBlock = {
  /* block definition */
};

// blocks/index.ts
import { myBlock } from "./myBlock.ts";
export const blocks = {
  example: exampleBlock,
  my: myBlock, // Add here
} as const;
```

### Adding Configuration

1. Update config schema in `main.ts`
2. Access via `input.app.config.fieldName`

### Adding Dependencies

1. Add to package.json dependencies
2. Import in relevant files
3. Ensure TypeScript types are available

This template provides a solid foundation for building production-ready Flows apps with modern development practices and automated deployment.
