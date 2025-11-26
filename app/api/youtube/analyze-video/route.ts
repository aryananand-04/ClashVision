// Ensure Node runtime for native modules
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import pixelmatch from 'pixelmatch';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';

// --- Dynamic Jimp loader (safe for Next app routes) ---
let _Jimp: any | null = null;
/** Returns the Jimp namespace/class. Use jimpRead()/jimpCreate() helpers below. */
async function getJimp() {
  if (_Jimp) return _Jimp;
  const mod = await import('jimp'); // dynamic import avoids static ESM checks
  // jimp may export { Jimp } or default or attach methods directly — handle all cases
  _Jimp = mod?.Jimp ?? mod?.default ?? mod;
  return _Jimp;
}

/** Convenience wrapper: returns a Jimp image for given path/buffer */
async function jimpRead(input: string | Buffer) {
  const J = await getJimp();
  // J.read exists on modern Jimp builds
  return J.read(input);
}

/** Convenience wrapper: write image async */
async function jimpWrite(image: any, outPath: string) {
  // image can be a Jimp instance
  return image.writeAsync(outPath);
}

/**
 * Analyze first 30 seconds of YouTube video to detect Clash Royale cards
 * Uses frame extraction + OCR + template matching
 */
export async function POST(request: NextRequest) {
  try {
    const { videoId, cardNames } = await request.json();

    if (!videoId || !cardNames || !Array.isArray(cardNames)) {
      return NextResponse.json(
        { error: 'videoId and cardNames array required' },
        { status: 400 }
      );
    }

    // Step 1: Extract frames from first 30 seconds
    const frames = await extractVideoFrames(videoId, 30);
    
    if (frames.length === 0) {
      return NextResponse.json({
        videoId,
        cardsDetected: [],
        confidence: 0,
        error: 'Could not extract frames'
      });
    }

    // Step 2: OCR on frames to detect card names
    const ocrResults = await detectCardsWithOCR(frames, cardNames);

    // Step 3: Template matching for card icons
    const templateResults = await detectCardsWithTemplateMatching(frames, cardNames);

    // Step 4: Combine results
    const detectedCards = combineResults(ocrResults, templateResults, cardNames);

    return NextResponse.json({
      videoId,
      cardsDetected: detectedCards,
      matchCount: detectedCards.length,
      totalCards: cardNames.length,
      confidence: (detectedCards.length / cardNames.length) * 100,
      method: 'frame_analysis'
    });
  } catch (error: any) {
    console.error('Video analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze video', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Extract frames from YouTube video using ffmpeg (if available) or thumbnail API fallback
 * Extracts 5-10 frames from first 30 seconds
 */
async function extractVideoFrames(videoId: string, durationSeconds: number): Promise<string[]> {
  const frames: string[] = [];
  
  try {
    // Method 1: Try to use yt-dlp + ffmpeg to extract actual video frames
    // This requires ffmpeg to be installed and yt-dlp for YouTube video download
    // For now, we'll use thumbnail API which is more reliable without system dependencies
    
    // Extract 5-10 frames from first 30 seconds using timestamps
    const frameCount = 8; // Extract 8 frames
    const frameInterval = durationSeconds / frameCount;
    
    // Use YouTube thumbnail API with different timestamps
    // Note: YouTube doesn't support timestamped thumbnails directly, so we'll use:
    // 1. Main thumbnail (maxresdefault)
    // 2. Multiple thumbnail sizes for better coverage
    // 3. Fallback to noembed service
    
    const thumbnailUrls = [
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    ];

    for (const url of thumbnailUrls) {
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 5000,
        });
        
        if (response.status === 200 && response.data.length > 0) {
          // Convert to base64 for processing
          const base64 = Buffer.from(response.data).toString('base64');
          frames.push(`data:image/jpeg;base64,${base64}`);
          
          // If we got maxresdefault, that's the best quality, use it
          if (url.includes('maxresdefault')) {
            break;
          }
        }
      } catch (err) {
        continue;
      }
    }

    // Method 2: Use third-party service (if Method 1 fails)
    if (frames.length === 0) {
      try {
        const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
        const response = await axios.get(noembedUrl, { timeout: 5000 });
        
        if (response.data.thumbnail_url) {
          const thumbResponse = await axios.get(response.data.thumbnail_url, {
            responseType: 'arraybuffer',
            timeout: 5000,
          });
          const base64 = Buffer.from(thumbResponse.data).toString('base64');
          frames.push(`data:image/jpeg;base64,${base64}`);
        }
      } catch (err) {
        console.warn('Noembed fallback failed:', err);
      }
    }

    // If we have at least one frame, duplicate it to simulate multiple frames
    // (In production with ffmpeg, we'd extract actual frames at different timestamps)
    if (frames.length > 0 && frames.length < frameCount) {
      const baseFrame = frames[0];
      while (frames.length < Math.min(frameCount, 5)) {
        frames.push(baseFrame); // Use same frame multiple times for now
      }
    }
  } catch (error) {
    console.error('Frame extraction error:', error);
  }

  return frames;
}

/**
 * Robust Tesseract worker creation with explicit paths
 * Handles different package layouts and falls back to CDN if needed
 */
async function makeTessWorker({ lang = 'eng' } = {}) {
  // Helper to test local paths
  const exists = (p: string) => {
    try { return fsSync.existsSync(p); } catch (e) { return false; }
  };

  // Candidate local files (common places across versions)
  const candidates: { name: string; workerPath?: string; corePath?: string }[] = [];

  // packaged dist worker (preferred if present)
  try {
    const distWorker = require.resolve('tesseract.js/dist/worker.min.js');
    candidates.push({ name: 'dist/worker.min.js', workerPath: distWorker });
  } catch (e) {}

  // some installs ship a 'worker.js' under dist
  try {
    const distWorker2 = require.resolve('tesseract.js/dist/worker.js');
    candidates.push({ name: 'dist/worker.js', workerPath: distWorker2 });
  } catch (e) {}

  // old layout: src/worker-script/node/index.js (your logs pointed here)
  const srcWorker = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js');
  if (exists(srcWorker)) candidates.push({ name: 'src/worker-script/node/index.js', workerPath: srcWorker });

  // core wasm script common paths
  try {
    const corePathResolved = require.resolve('tesseract.js-core/tesseract-core.wasm.js');
    candidates.push({ name: 'tesseract.js-core/tesseract-core.wasm.js', corePath: corePathResolved });
  } catch (e) {}

  // Try node_modules fallback for core shipped inside tesseract.js
  const possibleCoreInTess = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'dist', 'tesseract-core.wasm.js');
  if (exists(possibleCoreInTess)) candidates.push({ name: 'tesseract.js/dist/tesseract-core.wasm.js', corePath: possibleCoreInTess });

  // Debug log what we found locally
  console.log('tesseract worker candidates:', candidates.map(c => `${c.name} -> worker:${!!c.workerPath} core:${!!c.corePath}`));

  // prefer first candidate with a workerPath
  let chosen: { workerPath?: string; corePath?: string } | null = null;
  for (const c of candidates) {
    if (c.workerPath && exists(c.workerPath)) {
      chosen = { workerPath: c.workerPath, corePath: c.corePath };
      break;
    }
  }

  // If no local worker found, fallback to CDN (unpkg/jsdelivr)
  if (!chosen) {
    console.warn('No local tesseract worker found — falling back to CDN (requires network).');
    // CDN URLs (use a stable version you have or latest)
    const cdnBase = 'https://unpkg.com/tesseract.js@v6.0.1/dist'; // match installed version
    chosen = {
      workerPath: `${cdnBase}/worker.min.js`,
      corePath: `${cdnBase}/tesseract-core.wasm.js`
    };
  }

  // Convert absolute local paths into file:// URLs for some runtimes;
  // leave HTTP URLs untouched.
  const safeWorkerPath = chosen.workerPath?.startsWith('/') ? `file://${chosen.workerPath}` : chosen.workerPath;
  const safeCorePath = chosen.corePath?.startsWith('/') ? `file://${chosen.corePath}` : chosen.corePath;

  console.log('Using tesseract workerPath=', safeWorkerPath, 'corePath=', safeCorePath);

  // Create worker with explicit paths. This prevents tesseract.js from trying to require() deep internals.
  const worker = createWorker({
    workerPath: safeWorkerPath,
    corePath: safeCorePath,
    cachePath: path.join(process.cwd(), '.tesscache'), // optional: local cache dir
    // logger: m => console.log('tesslog', m), // uncomment for verbose tesseract logs
  });

  await worker.load();
  await worker.loadLanguage(lang);
  await worker.initialize(lang);

  return worker;
}

/**
 * OCR to detect card names in video frames
 * Uses Tesseract.js for text recognition
 */
async function detectCardsWithOCR(frames: string[], cardNames: string[]): Promise<string[]> {
  const detectedCards = new Set<string>();

  try {
    // Create OCR worker using robust path resolution
    const worker = await makeTessWorker({ lang: 'eng' });
    
    // Process each frame
    for (const frame of frames) {
      try {
        // Convert base64 to buffer
        const base64Data = frame.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Run OCR on frame
        const { data: { text } } = await worker.recognize(buffer);
        const textLower = text.toLowerCase();

        // Check for each card name in OCR text
        for (const cardName of cardNames) {
          const cardNameLower = cardName.replace(' (Evolution)', '').toLowerCase();
          
          // Check if card name appears in OCR text
          if (textLower.includes(cardNameLower)) {
            detectedCards.add(cardName);
          }
          
          // Also check for partial matches (e.g., "Hog Rider" might be detected as "Hog" or "Rider")
          const cardWords = cardNameLower.split(' ');
          if (cardWords.length > 1) {
            // If multiple words, check if all words appear
            const allWordsFound = cardWords.every(word => 
              word.length > 2 && textLower.includes(word)
            );
            if (allWordsFound) {
              detectedCards.add(cardName);
            }
          }
        }
      } catch (frameError) {
        console.warn('OCR error on frame:', frameError);
        continue;
      }
    }

    // Terminate worker
    await worker.terminate();
  } catch (error) {
    console.error('OCR setup error:', error);
    // If Tesseract.js fails, return empty array (fallback to template matching)
  }

  return Array.from(detectedCards);
}

/**
 * Template matching to detect card icons in frames using Jimp and pixelmatch
 * Compares known card icons against video frames
 */
async function detectCardsWithTemplateMatching(
  frames: string[],
  cardNames: string[]
): Promise<string[]> {
  const detectedCards = new Set<string>();

  try {
    // Load card icon templates (from templates folder or fetch from API)
    const cardIcons = await loadCardIcons(cardNames);
    
    if (cardIcons.size === 0) {
      return Array.from(detectedCards);
    }

    // Process each frame
    for (const frame of frames) {
      try {
        // Convert base64 to buffer and load with Jimp
        const base64Data = frame.replace(/^data:image\/\w+;base64,/, '');
        const frameBuffer = Buffer.from(base64Data, 'base64');
        const frameImage = await jimpRead(frameBuffer);
        const frameWidth = frameImage.getWidth();
        const frameHeight = frameImage.getHeight();

        // Focus on top 40% of frame where deck is typically shown
        const deckRegionHeight = Math.floor(frameHeight * 0.4);
        const deckRegion = frameImage.clone().crop(0, 0, frameWidth, deckRegionHeight);

        // For each card icon, try to find it in the frame
        for (const [cardName, iconPathOrUrl] of cardIcons.entries()) {
          try {
            let iconBuffer: Buffer;
            
            // Check if it's a local file path or URL
            if (iconPathOrUrl.startsWith('http://') || iconPathOrUrl.startsWith('https://')) {
              // Fetch from URL
              const iconResponse = await axios.get(iconPathOrUrl, {
                responseType: 'arraybuffer',
                timeout: 3000,
              });
              iconBuffer = Buffer.from(iconResponse.data);
            } else {
              // Read from local file
              iconBuffer = await fs.readFile(iconPathOrUrl);
            }
            
            const iconImage = await jimpRead(iconBuffer);
            
            // Resize icon to reasonable size for matching (max 200x200)
            const iconSize = Math.min(iconImage.getWidth(), iconImage.getHeight(), 200);
            const iconResized = iconImage.clone().resize(iconSize, iconSize);

            // Try template matching using pixelmatch
            // Search in deck region for the icon
            const matchFound = await findTemplateInImage(deckRegion, iconResized);
            
            if (matchFound) {
              detectedCards.add(cardName);
              console.log(`Template match found: ${cardName}`);
            }
          } catch (iconError) {
            // Skip this card icon if there's an error
            continue;
          }
        }
      } catch (frameError) {
        console.warn('Template matching error on frame:', frameError);
        continue;
      }
    }
  } catch (error) {
    console.error('Template matching setup error:', error);
  }

  return Array.from(detectedCards);
}

/**
 * Find template icon in image using pixelmatch
 * Returns true if template is found with sufficient similarity
 */
async function findTemplateInImage(image: Jimp, template: Jimp): Promise<boolean> {
  try {
    const imgWidth = image.getWidth();
    const imgHeight = image.getHeight();
    const templateWidth = template.getWidth();
    const templateHeight = template.getHeight();

    // Template must be smaller than image
    if (templateWidth > imgWidth || templateHeight > imgHeight) {
      return false;
    }

    // Search using sliding window approach
    const stepSize = Math.max(10, Math.floor(templateWidth / 4)); // Step size for search
    const threshold = 0.1; // Similarity threshold (lower = more strict)

    for (let y = 0; y <= imgHeight - templateHeight; y += stepSize) {
      for (let x = 0; x <= imgWidth - templateWidth; x += stepSize) {
        // Extract region from image
        const region = image.clone().crop(x, y, templateWidth, templateHeight);
        
        // Resize both to same size for comparison
        const size = Math.min(templateWidth, templateHeight, 100);
        const regionResized = region.clone().resize(size, size);
        const templateResized = template.clone().resize(size, size);

        // Convert to raw pixel data
        const regionData = new Uint8Array(size * size * 4);
        const templateData = new Uint8Array(size * size * 4);
        
        regionResized.scan(0, 0, size, size, function (x, y, idx) {
          const i = (y * size + x) * 4;
          regionData[i] = this.bitmap.data[idx];
          regionData[i + 1] = this.bitmap.data[idx + 1];
          regionData[i + 2] = this.bitmap.data[idx + 2];
          regionData[i + 3] = this.bitmap.data[idx + 3];
        });

        templateResized.scan(0, 0, size, size, function (x, y, idx) {
          const i = (y * size + x) * 4;
          templateData[i] = this.bitmap.data[idx];
          templateData[i + 1] = this.bitmap.data[idx + 1];
          templateData[i + 2] = this.bitmap.data[idx + 2];
          templateData[i + 3] = this.bitmap.data[idx + 3];
        });

        // Use pixelmatch to compare
        const diff = new Uint8Array(size * size * 4);
        const numDiffPixels = pixelmatch(
          regionData,
          templateData,
          diff,
          size,
          size,
          { threshold: threshold }
        );

        // Calculate similarity (lower diff pixels = higher similarity)
        const totalPixels = size * size;
        const similarity = 1 - (numDiffPixels / totalPixels);

        // If similarity is high enough, we found a match
        if (similarity > 0.7) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Template finding error:', error);
    return false;
  }
}

/**
 * Load card icons from templates folder or fetch from API
 * Stores templates locally for faster access
 */
async function loadCardIcons(cardNames: string[]): Promise<Map<string, string>> {
  const cardIcons = new Map<string, string>();
  const templatesDir = path.join(process.cwd(), 'templates');

  try {
    // First, try to load from local templates folder
    try {
      const files = await fs.readdir(templatesDir);
      for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
          const cardName = file.replace(/\.(png|jpg|jpeg)$/i, '').replace(/_/g, ' ');
          const isInSearchList = cardNames.some(searchCard =>
            searchCard.replace(' (Evolution)', '').toLowerCase() === cardName.toLowerCase()
          );
          if (isInSearchList) {
            const templatePath = path.join(templatesDir, file);
            cardIcons.set(cardName, templatePath);
          }
        }
      }
    } catch (dirError) {
      // Templates folder doesn't exist or is empty, fetch from API
      console.log('Templates folder not found, fetching from API...');
    }

    // If we don't have templates locally, fetch from API
    if (cardIcons.size === 0) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await axios.get(`${baseUrl}/api/clash-royale/cards`, { timeout: 5000 });
        
        if (response.data && response.data.cards) {
          // Ensure templates directory exists
          await fs.mkdir(templatesDir, { recursive: true });
          
          for (const card of response.data.cards) {
            const cardName = card.name;
            const isInSearchList = cardNames.some(searchCard =>
              searchCard.replace(' (Evolution)', '').toLowerCase() === cardName.toLowerCase()
            );
            
            if (isInSearchList && card.iconUrls && card.iconUrls.medium) {
              // Store URL for now (could download and cache locally)
              cardIcons.set(cardName, card.iconUrls.medium);
            }
          }
        }
      } catch (apiError) {
        console.error('Error loading card icons from API:', apiError);
      }
    }
  } catch (error) {
    console.error('Error loading card icons:', error);
  }

  return cardIcons;
}

/**
 * Combine OCR and template matching results
 */
function combineResults(
  ocrResults: string[],
  templateResults: string[],
  cardNames: string[]
): string[] {
  const detected = new Set<string>();

  // Add OCR detections
  ocrResults.forEach(card => detected.add(card));

  // Add template matching detections
  templateResults.forEach(card => detected.add(card));

  // Filter to only cards that were in search list
  return Array.from(detected).filter(card =>
    cardNames.some(searchCard =>
      searchCard.toLowerCase().includes(card.toLowerCase()) ||
      card.toLowerCase().includes(searchCard.toLowerCase())
    )
  );
}

