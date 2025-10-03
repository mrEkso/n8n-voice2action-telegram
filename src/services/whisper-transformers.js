/**
 * Whisper Service using Transformers.js
 * Pure JavaScript implementation - works on Windows without compilation
 * Uses ONNX runtime for efficient inference
 */

import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { pipeline } from '@xenova/transformers';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import wavefile from 'wavefile';
import { logger } from '../utils/logger.js';

export class WhisperService
{
  constructor(modelsDir, modelName = 'tiny', language = 'auto')
  {
    this.modelsDir = modelsDir; // Not used by Transformers.js but kept for compatibility
    this.modelName = modelName;
    this.pipe = null;
    this.language = language;

    // Map model names to Transformers.js model IDs
    this.modelMap = {
      'tiny': 'Xenova/whisper-tiny',
      'base': 'Xenova/whisper-base',
      'small': 'Xenova/whisper-small',
      'medium': 'Xenova/whisper-medium',
      'large': 'Xenova/whisper-large'
    };

    this.modelId = this.modelMap[modelName] || this.modelMap['tiny'];
    logger.info(`Whisper service initialized with model: ${this.modelId}`);
  }

  /**
   * Initialize the pipeline (lazy loading)
   */
  async initialize ()
  {
    if (this.pipe) return;

    logger.info('Loading Whisper model (first time may take a while)...');

    try
    {
      // Suppress ONNX runtime warnings
      const originalConsoleWarn = console.warn;
      const originalConsoleLog = console.log;
      console.warn = () => { };
      console.log = () => { };

      this.pipe = await pipeline('automatic-speech-recognition', this.modelId, {
        // Use ONNX runtime for better performance
        quantized: true,  // Use quantized model for lower memory usage
      });

      // Restore console
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;

      logger.info('Whisper model loaded successfully');
    } catch (error)
    {
      logger.error('Failed to load Whisper model:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio file
   * @param {string} audioPath - Path to audio file
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribe (audioPath)
  {
    try
    {
      await this.initialize();

      logger.info(`Transcribing: ${audioPath}`);

      // Convert OGG to WAV if needed (wavefile only supports WAV)
      const wavPath = await this.convertToWav(audioPath);

      // Load and decode audio to Float32Array (Node.js environment)
      const buffer = await fs.readFile(wavPath);
      const wav = new wavefile.WaveFile(buffer);
      wav.toBitDepth('32f'); // Pipeline expects Float32Array
      wav.toSampleRate(16000); // Whisper expects 16kHz

      let audioData = wav.getSamples();
      // Handle stereo: merge to mono
      if (Array.isArray(audioData))
      {
        if (audioData.length > 1)
        {
          const SCALING_FACTOR = Math.sqrt(2);
          for (let i = 0; i < audioData[0].length; ++i)
          {
            audioData[0][i] = SCALING_FACTOR * (audioData[0][i] + audioData[1][i]) / 2;
          }
        }
        audioData = audioData[0];
      }

      // Cleanup WAV file if it was converted
      if (wavPath !== audioPath)
      {
        try
        {
          await fs.unlink(wavPath);
        } catch (e)
        {
          logger.warn(`Failed to delete WAV file: ${e.message}`);
        }
      }

      // Transcribe audio
      const options = {
        chunk_length_s: 30,  // Process in 30-second chunks
        stride_length_s: 5,  // 5-second stride between chunks
        task: 'transcribe'   // Transcribe (not translate)
      };

      if (this.language && this.language !== 'auto')
      {
        options.language = this.language;
      }

      const result = await this.pipe(audioData, options);

      const text = result.text || '';

      logger.info(`Transcription complete: ${text.length} characters`);

      return text.trim();

    } catch (error)
    {
      logger.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Convert audio to WAV format using ffmpeg
   */
  async convertToWav (inputPath)
  {
    const ext = path.extname(inputPath).toLowerCase();
    if (ext === '.wav')
    {
      return inputPath;
    }

    const outputPath = inputPath.replace(ext, '.wav');

    return new Promise((resolve, reject) =>
    {
      const ffmpeg = spawn(ffmpegInstaller.path, [
        '-i', inputPath,
        '-ar', '16000',  // 16kHz sample rate
        '-ac', '1',      // Mono
        '-c:a', 'pcm_s16le',  // 16-bit PCM
        '-y',            // Overwrite output
        outputPath
      ]);

      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) =>
      {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) =>
      {
        if (code === 0)
        {
          resolve(outputPath);
        } else
        {
          logger.error(`FFmpeg stderr: ${errorOutput}`);
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) =>
      {
        reject(error);
      });
    });
  }

  /**
   * Unload model to free memory
   */
  async unload ()
  {
    if (this.pipe)
    {
      logger.info('Unloading Whisper model to free memory');
      this.pipe = null;

      // Force garbage collection if available
      if (global.gc)
      {
        global.gc();
      }
    }
  }
}
