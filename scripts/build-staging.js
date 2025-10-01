#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Building for STAGING (GitHub Pages)...');

const packageJsonPath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const originalHomepage = packageJson.homepage;

try {
  // Set staging configuration
  packageJson.homepage = 'https://tristankuo.github.io/teslalink';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`✅ Temporarily set homepage to "${packageJson.homepage}" for staging build.`);

  console.log('📦 Building...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('🎉 Staging build complete!');

} catch (error) {
  console.error('� Staging build failed:', error);
  process.exit(1); // Exit with an error code
} finally {
  // Revert homepage to its original value
  packageJson.homepage = originalHomepage;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`✅ Restored homepage to "${originalHomepage}".`);
}
