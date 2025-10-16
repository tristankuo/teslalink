const fs = require('fs');
const path = require('path');

/**
 * Dynamically determine environment and URLs from package.json homepage
 * This approach works for any fork without hardcoding domains
 */
function getEnvironmentFromHomepage() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const homepage = packageJson.homepage || '';
  
  if (!homepage) {
    console.log('[BUILD-ENV] No homepage in package.json, using development defaults');
    return {
      environment: 'development',
      fullUrl: 'http://localhost:3000'
    };
  }
  
  // GitHub Pages detection
  if (homepage.includes('.github.io')) {
    console.log('[BUILD-ENV] Detected GitHub Pages deployment');
    return {
      environment: 'staging',
      fullUrl: homepage
    };
  }
  
  // Custom domain
  console.log('[BUILD-ENV] Detected custom domain deployment');
  return {
    environment: 'production',
    fullUrl: homepage
  };
}

/**
 * Generate environment-specific index.html
 */
function generateIndexHtml() {
  const { environment, fullUrl } = getEnvironmentFromHomepage();
  
  console.log(`[BUILD-ENV] Generating index.html for environment: ${environment}`);
  console.log(`[BUILD-ENV] Using canonical URL: ${fullUrl}`);
  
  // Read template
  const templatePath = path.join(__dirname, '../public/index.template.html');
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholders
  template = template.replace(/\{\{CANONICAL_URL\}\}/g, fullUrl);
  
  // Write environment-specific index.html
  const outputPath = path.join(__dirname, '../public/index.html');
  fs.writeFileSync(outputPath, template);
  
  console.log(`[BUILD-ENV] Generated index.html with canonical URL: ${fullUrl}`);
}

/**
 * Generate environment-specific 404.html
 */
function generate404Html() {
  const { environment, fullUrl } = getEnvironmentFromHomepage();

  if (environment === 'staging') {
    const username = fullUrl.split('.')[0].replace('https://', '');
    const templatePath = path.join(__dirname, '../public/404.html.template');
    let template = fs.readFileSync(templatePath, 'utf8');
    template = template.replace(/\{\{GHPAGES_USERNAME\}\}/g, username);
    const outputPath = path.join(__dirname, '../public/404.html');
    fs.writeFileSync(outputPath, template);
    console.log(`[BUILD-ENV] Generated 404.html for GitHub Pages user: ${username}`);
  } else if (environment === 'production') {
    const outputPath = path.join(__dirname, '../public/404.html');
    const content = '<!DOCTYPE html><html><head><title>Page Not Found</title></head><body><h1>404 - Page Not Found</h1></body></html>';
    fs.writeFileSync(outputPath, content);
    console.log('[BUILD-ENV] Generated simple 404.html for production');
  } else {
    console.log('[BUILD-ENV] 404.html not needed for development');
  }
}

/**
 * Update workflow files
 */
function updateWorkflowFiles() {
  console.log('[BUILD-ENV] Workflow files use dynamic environment detection - no changes needed');
}

// Run all generators
try {
  generateIndexHtml();
  generate404Html();
  updateWorkflowFiles();
  console.log('[BUILD-ENV] ✅ Environment-specific files generated successfully');
} catch (error) {
  console.error('[BUILD-ENV] ❌ Error generating environment files:', error);
  process.exit(1);
}