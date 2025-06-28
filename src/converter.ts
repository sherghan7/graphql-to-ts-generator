import {
  parse,
  visit,
  Kind,
  ObjectTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  EnumTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  UnionTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  NamedTypeNode,
} from "graphql";

export interface ConversionOptions {
  /** Custom type mappings for scalar types */
  customScalarTypes?: Record<string, string>;
  /** Whether to include comments in generated types */
  includeComments?: boolean;
  /** Prefix for generated type names */
  typePrefix?: string;
  /** Suffix for generated type names */
  typeSuffix?: string;
  /** Whether to generate enums as const assertions instead of enum declarations */
  enumsAsConst?: boolean;
}

export function convertGraphQLToTypeScript(
  graphqlSchema: string,
  options: ConversionOptions = {}
): string {
  const {
    customScalarTypes = {},
    includeComments = true,
    typePrefix = '',
    typeSuffix = '',
    enumsAsConst = false
  } = options;

  const typeMapping: Record<string, string> = {
    ID: "string",
    String: "string",
    Int: "number",
    Float: "number",
    Boolean: "boolean",
    DateTime: "string",
    JSON: "any",
    ...customScalarTypes,
  };

  let result = "";

  if (includeComments) {
    result += `/**\n * Auto-generated GraphQL TypeScript definitions\n * Generated on: ${new Date().toISOString()}\n */\n\n`;
  }

  try {
    const schemaAST = parse(graphqlSchema);

    visit(schemaAST, {
      ScalarTypeDefinition(node: ScalarTypeDefinitionNode) {
        const scalarName = `${typePrefix}${node.name.value}${typeSuffix}`;
        if (includeComments && node.description) {
          result += `/** ${node.description.value} */\n`;
        }
        result += `export type ${scalarName} = unknown;\n\n`;
      },

      EnumTypeDefinition(node: EnumTypeDefinitionNode) {
        const enumName = `${typePrefix}${node.name.value}${typeSuffix}`;

        if (includeComments && node.description) {
          result += `/** ${node.description.value} */\n`;
        }

        if (enumsAsConst) {
          result += `export const ${enumName} = {\n`;
          if (node.values) {
            for (const enumValue of node.values) {
              if (includeComments && enumValue.description) {
                result += `  /** ${enumValue.description.value} */\n`;
              }
              result += `  ${enumValue.name.value}: "${enumValue.name.value}",\n`;
            }
          }
          result += "} as const;\n\n";
          result += `export type ${enumName} = typeof ${enumName}[keyof typeof ${enumName}];\n\n`;
        } else {
          result += `export enum ${enumName} {\n`;
          if (node.values) {
            for (const enumValue of node.values) {
              if (includeComments && enumValue.description) {
                result += `  /** ${enumValue.description.value} */\n`;
              }
              result += `  ${enumValue.name.value} = "${enumValue.name.value}",\n`;
            }
          }
          result += "}\n\n";
        }
      },

      UnionTypeDefinition(node: UnionTypeDefinitionNode) {
        const unionName = `${typePrefix}${node.name.value}${typeSuffix}`;
        const unionTypes = node.types
          ? node.types.map((type) => `${typePrefix}${type.name.value}${typeSuffix}`)
          : [];

        if (includeComments && node.description) {
          result += `/** ${node.description.value} */\n`;
        }
        result += `export type ${unionName} = ${unionTypes.join(" | ")};\n\n`;
      },

      InterfaceTypeDefinition(node: InterfaceTypeDefinitionNode) {
        const interfaceName = `${typePrefix}${node.name.value}${typeSuffix}`;

        if (includeComments && node.description) {
          result += `/** ${node.description.value} */\n`;
        }
        result += `export interface ${interfaceName} {\n`;

        if (node.fields) {
          for (const field of node.fields) {
            const fieldName = field.name.value;
            const { fieldType, isRequired } = parseFieldType(field.type, typeMapping, typePrefix, typeSuffix);

            if (includeComments && field.description) {
              result += `  /** ${field.description.value} */\n`;
            }

            const optionalMark = isRequired ? '' : '?';
            result += `  ${fieldName}${optionalMark}: ${fieldType};\n`;
          }
        }

        result += "}\n\n";
      },

      InputObjectTypeDefinition(node: InputObjectTypeDefinitionNode) {
        const inputName = `${typePrefix}${node.name.value}${typeSuffix}`;

        if (includeComments && node.description) {
          result += `/** ${node.description.value} */\n`;
        }
        result += `export interface ${inputName} {\n`;

        if (node.fields) {
          for (const field of node.fields) {
            const fieldName = field.name.value;
            const { fieldType, isRequired } = parseFieldType(field.type, typeMapping, typePrefix, typeSuffix);

            if (includeComments && field.description) {
              result += `  /** ${field.description.value} */\n`;
            }

            const optionalMark = isRequired ? '' : '?';
            result += `  ${fieldName}${optionalMark}: ${fieldType};\n`;
          }
        }

        result += "}\n\n";
      },

      ObjectTypeDefinition(node: ObjectTypeDefinitionNode) {
        const typeName = node.name.value;
        if (["Query", "Mutation", "Subscription"].includes(typeName)) {
          return;
        }

        const interfaceName = `${typePrefix}${typeName}${typeSuffix}`;

        if (includeComments && node.description) {
          result += `/** ${node.description.value} */\n`;
        }
        result += `export interface ${interfaceName} {\n`;

        if (node.fields) {
          for (const field of node.fields) {
            const fieldName = field.name.value;
            const { fieldType, isRequired } = parseFieldType(field.type, typeMapping, typePrefix, typeSuffix);

            if (includeComments && field.description) {
              result += `  /** ${field.description.value} */\n`;
            }

            const optionalMark = isRequired ? '' : '?';
            result += `  ${fieldName}${optionalMark}: ${fieldType};\n`;
          }
        }

        result += "}\n\n";
      },
    });

    return result.trim();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error parsing GraphQL schema: ${errorMessage}`);
  }
}

function parseFieldType(
  type: any,
  typeMapping: Record<string, string>,
  typePrefix: string,
  typeSuffix: string
): { fieldType: string; isRequired: boolean } {
  let fieldType = "";
  let isRequired = false;

  if (type.kind === Kind.NON_NULL_TYPE) {
    isRequired = true;
    const innerType = type.type;
    if (innerType.kind === Kind.LIST_TYPE) {
      const listItemType = innerType.type;
      let itemTypeName: string;

      if (listItemType.kind === Kind.NON_NULL_TYPE) {
        itemTypeName = (listItemType.type as NamedTypeNode).name.value;
      } else {
        itemTypeName = (listItemType as NamedTypeNode).name.value;
      }

      const mappedType = typeMapping[itemTypeName] || `${typePrefix}${itemTypeName}${typeSuffix}`;
      fieldType = `${mappedType}[]`;
    } else {
      const typeName = (innerType as NamedTypeNode).name.value;
      fieldType = typeMapping[typeName] || `${typePrefix}${typeName}${typeSuffix}`;
    }
  } else if (type.kind === Kind.LIST_TYPE) {
    const listItemType = type.type;
    let itemTypeName: string;

    if (listItemType.kind === Kind.NON_NULL_TYPE) {
      itemTypeName = (listItemType.type as NamedTypeNode).name.value;
    } else {
      itemTypeName = (listItemType as NamedTypeNode).name.value;
    }

    const mappedType = typeMapping[itemTypeName] || `${typePrefix}${itemTypeName}${typeSuffix}`;
    fieldType = `${mappedType}[]`;
  } else {
    const typeName = (type as NamedTypeNode).name.value;
    fieldType = typeMapping[typeName] || `${typePrefix}${typeName}${typeSuffix}`;
  }

  return { fieldType, isRequired };
}