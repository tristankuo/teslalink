const fs = require('fs');
const path = require('path');

// Environment configurations
const ENVIRONMENTS = {
  staging: {
    hostname: 'your-username.github.io',
    basePath: '/teslalink',
    fullUrl: 'https://your-username.github.io/teslalink'
  },
  production: {
    hostname: 'your-production-domain.github.io', 
    basePath: '',
    fullUrl: 'https://your-production-domain.github.io'
  },
  development: {
    hostname: 'localhost',
    basePath: '',
    fullUrl: 'http://localhost:3000'
  }
};

/**
 * Generate environment-specific index.html
 */
function generateIndexHtml() {
  // Determine environment based on package.json homepage or NODE_ENV
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const homepage = packageJson.homepage || '';
  
  let environment = 'development';
  if (homepage.includes('your-username.github.io')) {
    environment = 'staging';
  } else if (homepage.includes('your-production-domain.github.io')) {
    environment = 'production';
  }
  
  console.log(`[BUILD-ENV] Generating index.html for environment: ${environment}`);
  
  const config = ENVIRONMENTS[environment];
  
  // Read template
  const templatePath = path.join(__dirname, '../public/index.template.html');
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholders
  template = template.replace(/\{\{CANONICAL_URL\}\}/g, config.fullUrl);
  
  // Write environment-specific index.html
  const outputPath = path.join(__dirname, '../public/index.html');
  fs.writeFileSync(outputPath, template);
  
  console.log(`[BUILD-ENV] Generated index.html with canonical URL: ${config.fullUrl}`);
}

/**
 * Generate environment-specific 404.html
 */
function generate404Html() {
  const templatePath = path.join(__dirname, '../public/404.html');
  let content = fs.readFileSync(templatePath, 'utf8');
  
  // The 404.html is already environment-aware with dynamic pathSegmentsToKeep
  console.log('[BUILD-ENV] 404.html is already environment-aware');
}

/**
 * Update staging workflow with dynamic URLs
 */
function updateWorkflowFiles() {
  console.log('[BUILD-ENV] Workflow files use environment utilities - no changes needed');
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