import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

const TMP = os.tmpdir ? os.tmpdir() : '/tmp';

/**
 * downloadMedia(sock, message)
 * - Wrapper: lädt das quoted message media als Buffer via Baileys.
 * - Achte darauf, dass du die richtige Signatur für deine Baileys-Version verwendest.
 */
export async function downloadMedia(sock, message) {
  try {
    // gängige Baileys-Versionen: await sock.downloadMediaMessage(message) oder sock.downloadMediaMessage(message, 'buffer', {})
    // Falls deine Version eine andere Signatur hat, passe den Aufruf an.
    const buffer = await sock.downloadMediaMessage(message);
    return buffer;
  } catch (err) {
    // Fallback tries (best-effort)
    try {
      return await sock.downloadMediaMessage(message.message || message);
    } catch (e) {
      throw new Error('downloadMedia failed: ' + (err?.message || String(err)));
    }
  }
}

/**
 * saveBufferToTemp(buffer, ext)
 */
export async function saveBufferToTemp(buffer, ext = '.tmp') {
  const fname = `media-${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
  const full = path.join(TMP, fname);
  await fs.writeFile(full, buffer);
  return full;
}

/**
 * ffmpegToWebp(inputPath, outputPath, durationLimitSeconds)
 * - Convert video (or other input) to animated webp
 */
export function ffmpegToWebp(inputPath, outputPath, durationLimit = 8) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', inputPath,
      '-t', String(durationLimit),
      '-vf', 'scale=512:-1:flags=lanczos,fps=15',
      '-loop', '0',
      '-ss', '0',
      '-an',
      '-vcodec', 'libwebp',
      '-preset', 'default',
      '-compression_level', '6',
      '-qscale', '75',
      outputPath
    ];
    const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    ff.stderr.on('data', (b) => { stderr += b.toString(); });
    ff.on('error', (e) => reject(e));
    ff.on('close', (code) => {
      if (code !== 0) return reject(new Error('ffmpeg failed: ' + stderr.slice(0,200)));
      resolve(outputPath);
    });
  });
}

/**
 * bufferImageToWebp(buffer)
 * - Convert image Buffer (jpg/png/etc) to webp buffer, scaled to max 512px.
 * - Uses ffmpeg (writes temp input & temp output).
 */
export async function bufferImageToWebp(buffer, quality = 80) {
  const inPath = await saveBufferToTemp(buffer, '.in');
  const outPath = inPath + '.webp';
  try {
    // ffmpeg args for image -> webp (scale inside 512)
    const args = [
      '-y',
      '-i', inPath,
      '-vcodec', 'libwebp',
      '-lossless', '0',
      '-qscale', String(Math.max(10, Math.min(100, quality))),
      '-preset', 'default',
      '-vf', 'scale=512:-1:flags=lanczos'
    ];
    args.push(outPath);
    await new Promise((resolve, reject) => {
      const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';
      ff.stderr.on('data', (b) => { stderr += b.toString(); });
      ff.on('error', (e) => reject(e));
      ff.on('close', (code) => {
        if (code !== 0) return reject(new Error('ffmpeg failed: ' + stderr.slice(0,200)));
        resolve();
      });
    });
    const outBuf = await fs.readFile(outPath);
    return outBuf;
  } finally {
    // cleanup temp files
    try { await fs.unlink(inPath); } catch (_) {}
    try { await fs.unlink(outPath); } catch (_) {}
  }
}

/**
 * webpToImage(inWebpPath, outImagePath)
 * - Convert webp to png via ffmpeg (used in tp command)
 */
export function webpToImage(inWebpPath, outImagePath) {
  return new Promise((resolve, reject) => {
    const args = ['-y', '-i', inWebpPath, outImagePath];
    const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    ff.stderr.on('data', (b) => { stderr += b.toString(); });
    ff.on('error', (e) => reject(e));
    ff.on('close', (code) => {
      if (code !== 0) return reject(new Error('ffmpeg failed: ' + stderr.slice(0,200)));
      resolve(outImagePath);
    });
  });
}
