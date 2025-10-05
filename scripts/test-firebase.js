#!/usr/bin/env node

/**
 * Firebase Database Test Script
 * Tests connectivity and permissions for QR code functionality
 */

const fetch = require('node-fetch');

// Firebase projects to test
const FIREBASE_PROJECTS = {
  'teslacenter': 'https://teslacenter-default-rtdb.firebaseio.com',
  'teslalink': 'https://teslalink-default-rtdb.firebaseio.com', 
  'myteslalink': 'https://myteslalink-default-rtdb.firebaseio.com',
  'teslalink-8993e': 'https://teslalink-8993e-default-rtdb.firebaseio.com'
};

async function testFirebaseProject(projectName, databaseUrl) {
  console.log(`\n🔍 Testing ${projectName}...`);
  
  try {
    // Test basic connectivity
    const testUrl = `${databaseUrl}/.json`;
    const response = await fetch(testUrl, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.status === 200) {
      console.log(`✅ ${projectName}: Database accessible`);
      
      // Test QR sessions path
      const qrTestUrl = `${databaseUrl}/qr_sessions/.json`;
      const qrResponse = await fetch(qrTestUrl, {
        method: 'GET',
        timeout: 5000
      });
      
      if (qrResponse.status === 200) {
        const data = await qrResponse.text();
        console.log(`✅ ${projectName}: QR sessions path accessible`);
        console.log(`📊 ${projectName}: Data sample: ${data.substring(0, 100)}...`);
        return { project: projectName, status: 'active', url: databaseUrl };
      } else {
        console.log(`⚠️  ${projectName}: QR sessions path restricted (${qrResponse.status})`);
        return { project: projectName, status: 'restricted', url: databaseUrl };
      }
    } else if (response.status === 401) {
      console.log(`🔒 ${projectName}: Database exists but requires authentication`);
      return { project: projectName, status: 'auth_required', url: databaseUrl };
    } else {
      console.log(`❌ ${projectName}: Not accessible (${response.status})`);
      return { project: projectName, status: 'inaccessible', url: databaseUrl };
    }
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.message.includes('ENOTFOUND')) {
      console.log(`❌ ${projectName}: Project doesn't exist`);
      return { project: projectName, status: 'not_found', url: databaseUrl };
    } else {
      console.log(`❌ ${projectName}: Error - ${error.message}`);
      return { project: projectName, status: 'error', url: databaseUrl, error: error.message };
    }
  }
}

async function main() {
  console.log('🔥 Firebase Database Connectivity Test');
  console.log('=====================================');
  
  const results = [];
  
  for (const [projectName, databaseUrl] of Object.entries(FIREBASE_PROJECTS)) {
    const result = await testFirebaseProject(projectName, databaseUrl);
    results.push(result);
  }
  
  console.log('\n📋 SUMMARY');
  console.log('===========');
  
  const activeProjects = results.filter(r => r.status === 'active');
  const authProjects = results.filter(r => r.status === 'auth_required');
  const restrictedProjects = results.filter(r => r.status === 'restricted');
  
  if (activeProjects.length > 0) {
    console.log('\n✅ FULLY ACCESSIBLE PROJECTS:');
    activeProjects.forEach(p => {
      console.log(`   - ${p.project}: ${p.url}`);
    });
  }
  
  if (authProjects.length > 0) {
    console.log('\n🔒 PROJECTS REQUIRING AUTH:');
    authProjects.forEach(p => {
      console.log(`   - ${p.project}: ${p.url}`);
    });
  }
  
  if (restrictedProjects.length > 0) {
    console.log('\n⚠️  PROJECTS WITH RESTRICTED ACCESS:');
    restrictedProjects.forEach(p => {
      console.log(`   - ${p.project}: ${p.url}`);
    });
  }
  
  console.log('\n🎯 RECOMMENDATION:');
  if (activeProjects.length > 0) {
    const recommended = activeProjects[0];
    console.log(`   Use: ${recommended.project}`);
    console.log(`   Database URL: ${recommended.url}`);
    console.log('   This project allows QR sessions without authentication.');
  } else if (authProjects.length > 0) {
    const recommended = authProjects[0];
    console.log(`   Use: ${recommended.project} (with proper authentication)`);
    console.log(`   Database URL: ${recommended.url}`);
    console.log('   This project exists but requires auth configuration.');
  } else {
    console.log('   No accessible Firebase projects found.');
    console.log('   You may need to create a new project or fix authentication.');
  }
}

main().catch(console.error);