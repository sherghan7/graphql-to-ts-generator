import fs from 'fs';
import path from 'path';

export interface Config {
  input: string;
  output: string;
  watch?: boolean;
  customScalarTypes?: Record<string, string>;
  includeComments?: boolean;
  typePrefix?: string;
  typeSuffix?: string;
  enumsAsConst?: boolean;
}

export function loadConfig(configPath?: string): Config | null {
  const possiblePaths = [
    configPath,
    'graphql-to-ts.config.json',
    'graphql-to-ts.config.js',
    '.graphql-to-ts.json'
  ].filter(Boolean);

  for (const filePath of possiblePaths) {
    const resolvedPath = path.resolve(process.cwd(), filePath!);

    if (fs.existsSync(resolvedPath)) {
      try {
        if (filePath!.endsWith('.js')) {
          delete require.cache[resolvedPath];
          return require(resolvedPath);
        } else {
          const content = fs.readFileSync(resolvedPath, 'utf8');
          return JSON.parse(content);
        }
      } catch (error) {
        console.warn(`Warning: Could not load config from ${resolvedPath}`);
      }
    }
  }

  return null;
}