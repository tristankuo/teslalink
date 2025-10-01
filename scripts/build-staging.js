#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Building for STAGING (GitHub Pages)...');

// Backup current configs
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Set staging configuration
packageJson.homepage = 'https://tristankuo.github.io/teslalink';
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

// Note: We no longer modify index.tsx since we're using dynamic basename detection

console.log('✅ Configuration set for staging');
console.log('📦 Building...');

// Build
execSync('npm run build', { stdio: 'inherit' });

console.log('🎉 Staging build complete!');
console.log('📍 Deploy with: npm run deploy');