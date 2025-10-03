#!/usr/bin/env node

/**
 * Whisper.cpp Installation Script
 * Downloads and compiles whisper.cpp with minimal model
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const modelsDir = path.join(rootDir, 'models');
const whisperDir = path.join(modelsDir, 'whisper.cpp');

const WHISPER_REPO = 'https://github.com/ggerganov/whisper.cpp.git';
const MODEL_NAME = process.env.WHISPER_MODEL || 'tiny';

console.log('🚀 Installing whisper.cpp...\n');

async function runCommand(command, args, cwd = rootDir) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { cwd, stdio: 'inherit', shell: true });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    proc.on('error', reject);
  });
}

async function downloadModel(modelName) {
  const modelFile = `ggml-${modelName}.bin`;
  const modelPath = path.join(modelsDir, modelFile);
  
  // Check if model already exists
  try {
    await fs.access(modelPath);
    console.log(`✅ Model ${modelName} already exists`);
    return;
  } catch {
    // Model doesn't exist, download it
  }
  
  console.log(`📥 Downloading ${modelName} model...`);
  
  const modelUrl = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${modelName}.bin`;
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(modelPath);
    
    https.get(modelUrl, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (redirectResponse) => {
          const totalSize = parseInt(redirectResponse.headers['content-length'], 10);
          let downloaded = 0;
          
          redirectResponse.on('data', (chunk) => {
            downloaded += chunk.length;
            const percent = ((downloaded / totalSize) * 100).toFixed(1);
            process.stdout.write(`\rProgress: ${percent}%`);
          });
          
          redirectResponse.pipe(file);
          
          file.on('finish', () => {
            file.close();
            console.log('\n✅ Model downloaded successfully');
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log('✅ Model downloaded successfully');
          resolve();
        });
      }
    }).on('error', (error) => {
      fs.unlink(modelPath);
      reject(error);
    });
  });
}

async function isWindows() {
  return process.platform === 'win32';
}

async function downloadPrebuiltBinary() {
  console.log('📥 Downloading pre-built whisper.cpp for Windows...');
  
  // For Windows, we'll download pre-built binaries
  const binaryUrl = 'https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip';
  const zipPath = path.join(modelsDir, 'whisper-bin.zip');
  
  return new Promise((resolve, reject) => {
    https.get(binaryUrl, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (redirectResponse) => {
          const file = fs.createWriteStream(zipPath);
          redirectResponse.pipe(file);
          
          file.on('finish', () => {
            file.close();
            console.log('✅ Binary downloaded');
            resolve(zipPath);
          });
        }).on('error', reject);
      } else {
        const file = fs.createWriteStream(zipPath);
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log('✅ Binary downloaded');
          resolve(zipPath);
        });
      }
    }).on('error', reject);
  });
}

async function main() {
  try {
    // Create models directory
    await fs.mkdir(modelsDir, { recursive: true });
    console.log('✅ Created models directory');
    
    if (await isWindows()) {
      console.log('🪟 Windows detected - using alternative installation method');
      console.log('\n⚠️  For Windows, we recommend using WSL2 or Docker.');
      console.log('However, we can download pre-built binaries...\n');
      
      // Check if whisper.cpp already exists
      try {
        await fs.access(whisperDir);
        console.log('✅ whisper.cpp already exists');
      } catch {
        // Clone whisper.cpp
        console.log('📦 Cloning whisper.cpp repository...');
        await runCommand('git', ['clone', WHISPER_REPO, whisperDir]);
        console.log('✅ Repository cloned');
      }
      
      // Try to compile with CMake if available, otherwise skip
      try {
        console.log('🔨 Attempting to compile with CMake...');
        await runCommand('cmake', ['-B', 'build'], whisperDir);
        await runCommand('cmake', ['--build', 'build', '--config', 'Release'], whisperDir);
        console.log('✅ Compilation complete');
      } catch (error) {
        console.log('⚠️  Compilation failed (CMake not available)');
        console.log('💡 You can install CMake from: https://cmake.org/download/');
        console.log('💡 Or use WSL2 for better compatibility');
        console.log('\n⚠️  Continuing without compiled binary...');
        console.log('⚠️  The bot will not work until whisper.cpp is compiled.');
      }
      
    } else {
      // Linux/macOS
      // Check if whisper.cpp already exists
      try {
        await fs.access(whisperDir);
        console.log('✅ whisper.cpp already cloned');
      } catch {
        // Clone whisper.cpp
        console.log('📦 Cloning whisper.cpp repository...');
        await runCommand('git', ['clone', WHISPER_REPO, whisperDir]);
        console.log('✅ Repository cloned');
      }
      
      // Compile whisper.cpp
      console.log('🔨 Compiling whisper.cpp...');
      await runCommand('make', [], whisperDir);
      console.log('✅ Compilation complete');
    }
    
    // Download model
    await downloadModel(MODEL_NAME);
    
    console.log('\n✅ Installation complete!');
    console.log(`\nWhisper model: ${MODEL_NAME}`);
    console.log(`Location: ${modelsDir}`);
    
    if (await isWindows()) {
      console.log('\n⚠️  Windows Note:');
      console.log('If compilation failed, please:');
      console.log('1. Install CMake: https://cmake.org/download/');
      console.log('2. Install Visual Studio Build Tools');
      console.log('3. Or use WSL2: wsl --install');
      console.log('\nThen run: npm run install-whisper');
    } else {
      console.log('\nYou can now run: npm start');
    }
    
  } catch (error) {
    console.error('\n❌ Installation failed:', error.message);
    console.error('\nPlease ensure you have:');
    console.error('- Git installed');
    
    if (await isWindows()) {
      console.error('- CMake installed: https://cmake.org/download/');
      console.error('- Visual Studio Build Tools or MinGW');
      console.error('\nOr use WSL2:');
      console.error('  wsl --install');
      console.error('  wsl');
      console.error('  cd /mnt/c/Users/main/IdeaProjects/n8n-voice2action-telegram');
      console.error('  npm run install-whisper');
    } else {
      console.error('- C++ compiler (gcc/clang)');
      console.error('- Make');
      console.error('\nOn Ubuntu/Debian: sudo apt install build-essential git');
      console.error('On macOS: xcode-select --install');
    }
    
    process.exit(1);
  }
}

main();
