# GraphQL to TypeScript Generator

A powerful CLI tool and library to convert GraphQL schemas into TypeScript type definitions.

## Features

- 🚀 **CLI Tool** - Easy to use command-line interface
- 📁 **Config File Support** - JSON or JS configuration files
- 👀 **Watch Mode** - Automatically regenerate types on schema changes
- 🎨 **Customizable** - Custom scalar mappings, prefixes, suffixes
- 📝 **Comments** - Preserve GraphQL descriptions as TypeScript comments
- 🔧 **Flexible Exports** - Use as a library in your own tools

## Installation

```bash
# Global installation
npm install -g graphql-to-ts-generator

# Project dependency
npm install --save-dev graphql-to-ts-generator
```

## Quick Start

```bash
# Basic usage
graphql-to-ts schema.graphql

# Specify output file
graphql-to-ts schema.graphql -o types/schema.ts

# Watch mode
graphql-to-ts schema.graphql -w

# With custom options
graphql-to-ts schema.graphql -o types/schema.ts --prefix "GQL" --suffix "Type"
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `<input>` | Input GraphQL schema file | Required |
| `-o, --output <path>` | Output TypeScript file | `types/generated.ts` |
| `-c, --config <path>` | Config file path | Auto-detect |
| `-w, --watch` | Watch for file changes | `false` |
| `--no-comments` | Exclude comments | `false` |
| `--prefix <prefix>` | Type name prefix | `""` |
| `--suffix <suffix>` | Type name suffix | `""` |
| `--enums-as-const` | Generate const assertions | `false` |
| `--custom-scalars <json>` | Custom scalar mappings | `{}` |

## Configuration File

Create a `graphql-to-ts.config.json` file:

```json
{
  "input": "schema.graphql",
  "output": "types/generated.ts",
  "watch": true,
  "includeComments": true,
  "typePrefix": "GQL",
  "typeSuffix": "Type",
  "enumsAsConst": false,
  "customScalarTypes": {
    "DateTime": "Date",
    "Upload": "File"
  }
}
```

Or use JavaScript configuration (`graphql-to-ts.config.js`):

```javascript
module.exports = {
  input: 'schema.graphql',
  output: 'types/generated.ts',
  customScalarTypes: {
    DateTime: 'Date',
    Upload: 'File'
  }
};
```

## Usage as Library

```typescript
import { convertGraphQLToTypeScript } from 'graphql-to-ts-generator';

const schema = `
  type User {
    id: ID!
    name: String!
    email: String!
  }
`;

const types = convertGraphQLToTypeScript(schema, {
  customScalarTypes: {
    DateTime: 'Date'
  },
  typePrefix: 'GQL'
});

console.log(types);
```

## Package.json Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "generate-types": "graphql-to-ts schema.graphql -o types/generated.ts",
    "generate-types:watch": "graphql-to-ts schema.graphql -o types/generated.ts --watch"
  }
}
```

## Examples

### Basic Schema

Input (`schema.graphql`):
```graphql
type User {
  id: ID!
  name: String!
  email: String
}

enum Role {
  ADMIN
  USER
}
```

Output:
```typescript
export interface User {
  id: string;
  name: string;
  email?: string;
}

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}
```

### With Custom Scalars

```bash
graphql-to-ts schema.graphql --custom-scalars '{"DateTime":"Date","JSON":"any"}'
```

## License

MIT
```

## 10. Publishing Steps

```bash
# Initialize npm package
npm init -y

# Install dependencies
npm install

# Build the package
npm run build

# Test locally
npm link
graphql-to-ts --help

# Publish to npm
npm login
npm publish
```

## 11. Example Usage After Publishing

Users can then use your package like this:

```bash
# Install globally
npm install -g graphql-to-ts-generator

# Use in any project
graphql-to-ts schema.graphql -o types/generated.ts

# Or as project dependency
npm install --save-dev graphql-to-ts-generator
npx graphql-to-ts schema.graphql
```

## 12. Add to package.json scripts

```json:package.json
{
  "scripts": {
    "generate-types": "graphql-to-ts schema.graphql -o types/generated.ts",
    "generate-types:watch": "graphql-to-ts schema.graphql -w"
  }
}