#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Building for STAGING (GitHub Pages)...');

// Backup current configs
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const indexTsx = fs.readFileSync('src/index.tsx', 'utf8');

// Set staging configuration
packageJson.homepage = 'https://tristankuo.github.io/teslalink';
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

// Update router basename for staging
const stagingIndexTsx = indexTsx.replace(
  'basename="/"',
  'basename="/teslalink"'
).replace(
  'basename={process.env.NODE_ENV === "production" ? "/" : "/teslalink"}',
  'basename="/teslalink"'
);
fs.writeFileSync('src/index.tsx', stagingIndexTsx);

console.log('✅ Configuration set for staging');
console.log('📦 Building...');

// Build
execSync('npm run build', { stdio: 'inherit' });

console.log('🎉 Staging build complete!');
console.log('📍 Deploy with: npm run deploy');