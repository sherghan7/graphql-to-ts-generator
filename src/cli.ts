#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { convertGraphQLToTypeScript, ConversionOptions } from './converter';
import { loadConfig, Config } from './config';

const program = new Command();

program
  .name('graphql-to-ts')
  .description('Convert GraphQL schemas to TypeScript interfaces')
  .version('1.0.0');

program
  .argument('[input]', 'Input GraphQL schema file path')
  .option('-o, --output <path>', 'Output TypeScript file path')
  .option('-c, --config <path>', 'Config file path')
  .option('-w, --watch', 'Watch for file changes')
  .option('--no-comments', 'Exclude comments from generated types')
  .option('--prefix <prefix>', 'Add prefix to generated type names')
  .option('--suffix <suffix>', 'Add suffix to generated type names')
  .option('--enums-as-const', 'Generate enums as const assertions')
  .option('--custom-scalars <scalars>', 'Custom scalar type mappings (JSON format)')
  .action(async (input: string | undefined, options) => {
    try {
      // Load config file
      const config = loadConfig(options.config);

      // Merge config with CLI options (CLI takes precedence)
      const finalOptions = {
        input: input || config?.input,
        output: options.output || config?.output || 'types/generated.ts',
        watch: options.watch || config?.watch || false,
        comments: options.comments !== false && (config?.includeComments !== false),
        prefix: options.prefix || config?.typePrefix || '',
        suffix: options.suffix || config?.typeSuffix || '',
        enumsAsConst: options.enumsAsConst || config?.enumsAsConst || false,
        customScalars: options.customScalars || config?.customScalarTypes
      };

      if (!finalOptions.input) {
        throw new Error('Input file path is required. Provide it as an argument or in a config file.');
      }

      await generateTypes(finalOptions.input, finalOptions);

      if (finalOptions.watch) {
        console.log(chalk.blue(`👀 Watching ${finalOptions.input} for changes...`));
        fs.watchFile(finalOptions.input, () => {
          console.log(chalk.yellow('📝 Schema changed, regenerating types...'));
          generateTypes(finalOptions.input, finalOptions).catch(console.error);
        });
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

async function generateTypes(inputPath: string, options: any) {
  const resolvedInputPath = path.resolve(process.cwd(), inputPath);

  if (!fs.existsSync(resolvedInputPath)) {
    throw new Error(`Input file not found: ${resolvedInputPath}`);
  }

  const schemaContent = fs.readFileSync(resolvedInputPath, 'utf8');

  let customScalarTypes = options.customScalars || {};
  if (typeof customScalarTypes === 'string') {
    try {
      customScalarTypes = JSON.parse(customScalarTypes);
    } catch {
      throw new Error('Invalid JSON format for custom scalars');
    }
  }

  const conversionOptions: ConversionOptions = {
    customScalarTypes,
    includeComments: options.comments !== false,
    typePrefix: options.prefix || '',
    typeSuffix: options.suffix || '',
    enumsAsConst: options.enumsAsConst || false,
  };

  const typescriptTypes = convertGraphQLToTypeScript(schemaContent, conversionOptions);

  const resolvedOutputPath = path.resolve(process.cwd(), options.output);
  const outputDir = path.dirname(resolvedOutputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(resolvedOutputPath, typescriptTypes);

  console.log(chalk.green('✅ Successfully generated TypeScript types!'));
  console.log(chalk.blue(`📄 Output: ${resolvedOutputPath}`));
  console.log(chalk.gray(`📊 Generated ${typescriptTypes.split('\n').length} lines`));
}

program.parse();