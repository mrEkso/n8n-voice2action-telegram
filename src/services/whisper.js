/**
 * Whisper.cpp Service
 * Lightweight speech recognition using whisper.cpp
 * Minimal resource usage
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger.js';

export class WhisperService {
  constructor(modelsDir, modelName = 'tiny') {
    this.modelsDir = modelsDir;
    this.modelName = modelName;
    this.modelPath = path.join(modelsDir, `ggml-${modelName}.bin`);
    this.whisperPath = path.join(modelsDir, 'whisper.cpp', 'main');
  }
  
  /**
   * Check if whisper.cpp is installed
   */
  async isInstalled() {
    try {
      await fs.access(this.whisperPath);
      await fs.access(this.modelPath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Transcribe audio file using whisper.cpp
   * @param {string} audioPath - Path to audio file
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribe(audioPath) {
    try {
      const installed = await this.isInstalled();
      if (!installed) {
        throw new Error(
          'Whisper.cpp not installed. Run: npm run install-whisper'
        );
      }
      
      logger.info(`Transcribing: ${audioPath}`);
      logger.info(`Using model: ${this.modelName}`);
      
      // Convert OGG to WAV if needed (whisper.cpp works best with WAV)
      const wavPath = await this.convertToWav(audioPath);
      
      // Run whisper.cpp
      const text = await this.runWhisper(wavPath);
      
      // Cleanup WAV file if it was converted
      if (wavPath !== audioPath) {
        try {
          await fs.unlink(wavPath);
        } catch (e) {
          logger.warn(`Failed to delete WAV file: ${e.message}`);
        }
      }
      
      logger.info(`Transcription complete: ${text.length} characters`);
      return text.trim();
      
    } catch (error) {
      logger.error('Transcription error:', error);
      throw error;
    }
  }
  
  /**
   * Convert audio to WAV format using ffmpeg
   */
  async convertToWav(inputPath) {
    const ext = path.extname(inputPath).toLowerCase();
    if (ext === '.wav') {
      return inputPath;
    }
    
    const outputPath = inputPath.replace(ext, '.wav');
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-ar', '16000',  // 16kHz sample rate
        '-ac', '1',      // Mono
        '-c:a', 'pcm_s16le',  // 16-bit PCM
        '-y',            // Overwrite output
        outputPath
      ]);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
      
      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  /**
   * Run whisper.cpp executable
   */
  async runWhisper(audioPath) {
    return new Promise((resolve, reject) => {
      const args = [
        '-m', this.modelPath,
        '-f', audioPath,
        '-t', '4',        // 4 threads (adjust based on CPU)
        '-np',            // No print timestamps
        '-nt',            // No timestamps in output
        '--language', 'auto'
      ];
      
      logger.debug(`Running: ${this.whisperPath} ${args.join(' ')}`);
      
      const whisper = spawn(this.whisperPath, args);
      
      let output = '';
      let errorOutput = '';
      
      whisper.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      whisper.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      whisper.on('close', (code) => {
        if (code === 0) {
          // Extract text from output (whisper.cpp outputs to stdout)
          const text = this.extractText(output);
          resolve(text);
        } else {
          logger.error(`Whisper stderr: ${errorOutput}`);
          reject(new Error(`Whisper exited with code ${code}`));
        }
      });
      
      whisper.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  /**
   * Extract transcribed text from whisper.cpp output
   */
  extractText(output) {
    // whisper.cpp outputs the transcription after processing info
    // Look for lines that don't start with [ (which are log messages)
    const lines = output.split('\n');
    const textLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('[') && !trimmed.includes('whisper_');
    });
    
    return textLines.join(' ').trim();
  }
}
