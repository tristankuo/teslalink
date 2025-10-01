#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🏭 Building for PRODUCTION (Firebase Hosting)...');

// Backup current configs
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Set production configuration
packageJson.homepage = '.';
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

// Note: We no longer modify index.tsx since we're using dynamic basename detection

console.log('✅ Configuration set for production');
console.log('📦 Building...');

// Build
execSync('npm run build', { stdio: 'inherit' });

console.log('🎉 Production build complete!');
console.log('📍 Deploy with: firebase deploy --only hosting');