#!/usr/bin/env node

const { spawn } = require('child_process');
const { watch } = require('fs');
const path = require('path');

console.log('🚀 Starting Superjolt development mode...\n');

// Run initial build
console.log('📦 Building project...');
const initialBuild = spawn('npm', ['run', 'build'], { stdio: 'inherit' });

initialBuild.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Initial build failed');
    process.exit(code);
  }

  console.log('🔗 Installing globally...');
  const install = spawn('npm', ['install', '-g', '.'], { stdio: 'inherit' });
  
  install.on('close', () => {
    console.log('✅ Initial setup complete!\n');
    startWatching();
  });
});

function startWatching() {
  console.log('👀 Starting watch mode with auto-install...\n');
  
  // Start nest build --watch
  const nestWatch = spawn('npx', ['nest', 'build', '--watch'], {
    stdio: 'inherit'
  });

  // Watch the dist directory for changes
  const distDir = path.join(__dirname, '..', 'dist');
  let installTimeout;
  let isInstalling = false;
  
  const watcher = watch(distDir, { recursive: true }, (eventType, filename) => {
    // Skip if we're already installing or if it's not a .js file
    if (isInstalling || !filename || !filename.endsWith('.js')) return;
    
    // Skip map files and test files
    if (filename.endsWith('.map') || filename.includes('.spec.')) return;
    
    // Clear any pending install
    clearTimeout(installTimeout);
    
    // Wait 500ms after last change before installing (debounce)
    installTimeout = setTimeout(() => {
      isInstalling = true;
      console.log('\n🔄 Changes detected, updating global command...');
      
      const install = spawn('npm', ['install', '-g', '.'], { 
        stdio: ['inherit', 'pipe', 'pipe'] 
      });
      
      install.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Global command updated successfully!\n');
        } else {
          console.error('❌ Failed to update global command\n');
        }
        isInstalling = false;
      });
    }, 500);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping watch mode...');
    nestWatch.kill();
    watcher.close();
    process.exit(0);
  });

  nestWatch.on('close', (code) => {
    console.log('Watch process exited with code', code);
    watcher.close();
    process.exit(code);
  });
}