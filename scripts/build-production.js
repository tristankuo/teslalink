#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🏭 Building for PRODUCTION (Firebase Hosting)...');

// Backup current configs
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const indexTsx = fs.readFileSync('src/index.tsx', 'utf8');

// Set production configuration
packageJson.homepage = '.';
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

// Update router basename for production
const productionIndexTsx = indexTsx.replace(
  'basename="/teslalink"',
  'basename="/"'
).replace(
  'basename={process.env.NODE_ENV === "production" ? "/" : "/teslalink"}',
  'basename="/"'
);
fs.writeFileSync('src/index.tsx', productionIndexTsx);

console.log('✅ Configuration set for production');
console.log('📦 Building...');

// Build
execSync('npm run build', { stdio: 'inherit' });

console.log('🎉 Production build complete!');
console.log('📍 Deploy with: firebase deploy --only hosting');