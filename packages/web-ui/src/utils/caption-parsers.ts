/**
 * Parsers for VTT and SRT caption file formats
 */

import type {
  CaptionFile,
  CaptionSegment,
} from '../../../common-types/src/types';

/**
 * Convert time string to seconds
 * Supports formats: "00:01:23.456", "01:23.456", "1:23.456"
 */
const parseTimeToSeconds = (timeString: string): number => {
  const parts = timeString.trim().replace(',', '.').split(':');
  let seconds = 0;

  if (parts.length === 3) {
    // HH:MM:SS.mmm format
    seconds =
      parseInt(parts[0]) * 3600 +
      parseInt(parts[1]) * 60 +
      parseFloat(parts[2]);
  } else if (parts.length === 2) {
    // MM:SS.mmm format
    seconds = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  } else {
    // SS.mmm format
    seconds = parseFloat(parts[0]);
  }

  return seconds;
};

/**
 * Convert seconds to VTT time format (HH:MM:SS.mmm)
 */
const formatTimeForVTT = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');
  const s = secs.toFixed(3).padStart(6, '0');

  return `${h}:${m}:${s}`;
};

/**
 * Convert seconds to SRT time format (HH:MM:SS,mmm)
 */
const formatTimeForSRT = (seconds: number): string => {
  return formatTimeForVTT(seconds).replace('.', ',');
};

/**
 * Parse VTT (WebVTT) file content
 */
export const parseVTT = (content: string, fileName?: string): CaptionFile => {
  const lines = content.split('\n').map((line) => line.trim());
  const segments: CaptionSegment[] = [];

  let currentSegment: Partial<CaptionSegment> | null = null;
  let segmentIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines and WEBVTT header
    if (!line || line.startsWith('WEBVTT') || line.startsWith('NOTE')) {
      continue;
    }

    // Check if line contains timing (arrow pattern)
    if (line.includes('-->')) {
      const timingMatch = line.match(/([\d:.,]+)\s*-->\s*([\d:.,]+)/);
      if (timingMatch) {
        const startTime = parseTimeToSeconds(timingMatch[1]);
        const endTime = parseTimeToSeconds(timingMatch[2]);

        currentSegment = {
          id: `vtt_segment_${segmentIndex++}`,
          startTime,
          endTime,
          text: '',
        };
      }
    }
    // If we have a current segment and this is text content
    else if (currentSegment && line && !line.match(/^\\d+$/)) {
      // Accumulate text (handle multi-line captions)
      currentSegment.text = currentSegment.text
        ? `${currentSegment.text} ${line}`
        : line;
    }
    // If we hit an empty line and have a complete segment, save it
    else if (!line && currentSegment && currentSegment.text) {
      segments.push(currentSegment as CaptionSegment);
      currentSegment = null;
    }
  }

  // Don't forget the last segment if file doesn't end with empty line
  if (currentSegment && currentSegment.text) {
    segments.push(currentSegment as CaptionSegment);
  }

  return {
    id: `vtt_${Date.now()}`,
    title: fileName ? `Imported from ${fileName}` : 'Imported VTT Captions',
    language: 'en', // TODO: Could be detected from VTT metadata
    format: 'vtt',
    segments: segments.sort((a, b) => a.startTime - b.startTime),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Parse SRT (SubRip) file content
 */
export const parseSRT = (content: string, fileName?: string): CaptionFile => {
  // Remove BOM if present and split into lines
  const cleanContent = content.replace(/^\uFEFF/, ''); // Remove UTF-8 BOM
  const lines = cleanContent.split('\n').map((line) => line.trim());
  const segments: CaptionSegment[] = [];

  console.log('🔍 SRT Parser - Total lines:', lines.length);

  let currentSegment: Partial<CaptionSegment> | null = null;
  let expectingNumber = true;
  let expectingTiming = false;
  let expectingText = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines between segments
    if (!line) {
      if (currentSegment && currentSegment.text) {
        segments.push(currentSegment as CaptionSegment);
        currentSegment = null;
      }
      expectingNumber = true;
      expectingTiming = false;
      expectingText = false;
      continue;
    }

    // Expecting sequence number
    if (expectingNumber && /^\d+$/.test(line)) {
      console.log('📝 Found segment number:', line);
      currentSegment = {
        id: `srt_segment_${line}`,
        text: '',
      };
      expectingNumber = false;
      expectingTiming = true;
    }
    // Expecting timing line
    else if (expectingTiming && line.includes('-->')) {
      const timingMatch = line.match(/([\d:.,]+)\s*-->\s*([\d:.,]+)/);
      if (timingMatch && currentSegment) {
        console.log('⏰ Found timing:', timingMatch[1], '-->', timingMatch[2]);
        currentSegment.startTime = parseTimeToSeconds(timingMatch[1]);
        currentSegment.endTime = parseTimeToSeconds(timingMatch[2]);
        expectingTiming = false;
        expectingText = true;
      }
    }
    // Expecting text content
    else if (expectingText && currentSegment) {
      // Accumulate text (handle multi-line captions)
      console.log('📄 Found text:', line);
      currentSegment.text = currentSegment.text
        ? `${currentSegment.text} ${line}`
        : line;
    }
  }

  // Don't forget the last segment
  if (currentSegment && currentSegment.text) {
    segments.push(currentSegment as CaptionSegment);
  }

  console.log('✅ SRT Parser - Found segments:', segments.length);

  return {
    id: `srt_${Date.now()}`,
    title: fileName ? `Imported from ${fileName}` : 'Imported SRT Captions',
    language: 'en',
    format: 'srt',
    segments: segments.sort((a, b) => a.startTime - b.startTime),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Export CaptionFile to VTT format
 */
export const exportToVTT = (captionFile: CaptionFile): string => {
  let vtt = 'WEBVTT\n\n';

  captionFile.segments.forEach((segment, index) => {
    const startTime = formatTimeForVTT(segment.startTime);
    const endTime = formatTimeForVTT(segment.endTime);

    vtt += `${startTime} --> ${endTime}\n`;
    vtt += `${segment.text}\n\n`;
  });

  return vtt;
};

/**
 * Export CaptionFile to SRT format
 */
export const exportToSRT = (captionFile: CaptionFile): string => {
  let srt = '';

  captionFile.segments.forEach((segment, index) => {
    const startTime = formatTimeForSRT(segment.startTime);
    const endTime = formatTimeForSRT(segment.endTime);

    srt += `${index + 1}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    srt += `${segment.text}\n\n`;
  });

  return srt;
};

/**
 * Download a file with given content and filename
 */
export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
};

/**
 * Open file dialog and return selected file
 */
export const openFileDialog = (accept?: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (accept) {
      input.accept = accept;
    }

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        resolve(file);
      } else {
        reject(new Error('No file selected'));
      }
    };

    input.oncancel = () => reject(new Error('File selection cancelled'));
    input.click();
  });
};
