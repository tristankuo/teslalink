#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🏭 Building for PRODUCTION (Firebase Hosting)...');

const packageJsonPath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const originalHomepage = packageJson.homepage;

try {
  // Set production configuration
  packageJson.homepage = '/';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`✅ Temporarily set homepage to "${packageJson.homepage}" for production build.`);

  console.log('📦 Building...');
  // The `build` script in package.json is "react-scripts build"
  execSync('npm run build', { stdio: 'inherit' });
  console.log('🎉 Production build complete!');

} catch (error) {
  console.error('� Production build failed:', error);
  process.exit(1); // Exit with an error code
} finally {
  // Revert homepage to its original value
  packageJson.homepage = originalHomepage;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`✅ Restored homepage to "${originalHomepage}".`);
}
