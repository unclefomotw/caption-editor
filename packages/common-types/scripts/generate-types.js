#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { compileFromFile } = require('json-schema-to-typescript');

const SCHEMAS_DIR = path.join(__dirname, '../schemas');
const OUTPUT_DIR = path.join(__dirname, '../src/types');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateTypes() {
  try {
    console.log('🔧 Generating TypeScript types from JSON schemas...');
    
    const schemaFiles = fs.readdirSync(SCHEMAS_DIR)
      .filter(file => file.endsWith('.json'));

    const generatedTypes = [];

    for (const schemaFile of schemaFiles) {
      const schemaPath = path.join(SCHEMAS_DIR, schemaFile);
      const outputName = schemaFile.replace('.json', '.ts');
      const outputPath = path.join(OUTPUT_DIR, outputName);
      
      console.log(`  📄 Processing ${schemaFile}...`);
      
      // Generate TypeScript from JSON schema
      const ts = await compileFromFile(schemaPath, {
        bannerComment: `/* Generated from ${schemaFile} - DO NOT EDIT MANUALLY */`,
        style: {
          tabWidth: 2,
          useTabs: false,
          semi: true,
          singleQuote: false,
        }
      });
      
      // Write TypeScript file
      fs.writeFileSync(outputPath, ts);
      
      // Track generated types for index file
      const typeName = path.basename(outputName, '.ts');
      generatedTypes.push({
        file: outputName,
        typeName: pascalCase(typeName)
      });
      
      console.log(`  ✅ Generated ${outputName}`);
    }

    // Generate index.ts that exports all types
    const indexContent = [
      '/* Generated index file - exports all types */',
      '',
      ...generatedTypes.map(({ file, typeName }) => 
        `export * from './${file.replace('.ts', '')}';`
      ),
      '',
      '// Re-export main types with cleaner names',
      ...generatedTypes.map(({ typeName }) => 
        `export type { ${typeName} } from './${typeName.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}';`
      ),
      ''
    ].join('\n');
    
    const indexPath = path.join(OUTPUT_DIR, 'index.ts');
    fs.writeFileSync(indexPath, indexContent);
    
    console.log('✅ Generated index.ts');
    console.log(`🎉 Successfully generated ${generatedTypes.length} TypeScript type files!`);
    
  } catch (error) {
    console.error('❌ Error generating types:', error);
    process.exit(1);
  }
}

function pascalCase(str) {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/(?:^|\s)(\w)/g, (_, letter) => letter.toUpperCase())
    .replace(/\s/g, '');
}

// Run the generator
generateTypes();