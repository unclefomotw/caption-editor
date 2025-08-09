/**
 * Utilities for handling persistent storage of video files and caption data
 */

export interface StoredVideoFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  data: string; // base64 encoded file data
}

interface StoredVideoState {
  file: StoredVideoFile | null;
  url: string | null;
  duration: number;
  isReady: boolean;
}

/**
 * Convert a File object to a storable format with base64 data
 */
export const fileToStoredFile = async (file: File): Promise<StoredVideoFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const base64Data = reader.result as string;
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        data: base64Data,
      });
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

/**
 * Convert stored file data back to a File object and create blob URL
 */
export const storedFileToBlob = (storedFile: StoredVideoFile): { file: File; url: string } => {
  // Convert base64 back to blob
  const base64Data = storedFile.data.split(',')[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: storedFile.type });
  
  // Create new File object
  const file = new File([blob], storedFile.name, {
    type: storedFile.type,
    lastModified: storedFile.lastModified,
  });
  
  // Create blob URL
  const url = URL.createObjectURL(blob);
  
  return { file, url };
};

/**
 * Check if stored video data is still valid (not too old, reasonable size)
 */
export const isStoredVideoValid = (storedVideo: StoredVideoState | null): boolean => {
  if (!storedVideo || !storedVideo.file) return false;
  
  // Check age (don't restore files older than 7 days)
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const fileAge = Date.now() - storedVideo.file.lastModified;
  if (fileAge > maxAge) return false;
  
  // Check size (don't restore files larger than 500MB to avoid localStorage issues)
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (storedVideo.file.size > maxSize) return false;
  
  return true;
};

/**
 * Calculate storage size in MB for display
 */
export const getStorageSizeInMB = (storedVideo: StoredVideoState | null): number => {
  if (!storedVideo || !storedVideo.file) return 0;
  return Math.round((storedVideo.file.data.length * 0.75) / 1024 / 1024 * 100) / 100; // base64 overhead ~25%
};

/**
 * Clear stored video data to free up localStorage space
 */
export const clearStoredVideo = (): void => {
  const existingData = localStorage.getItem('caption-editor-store');
  if (existingData) {
    try {
      const parsed = JSON.parse(existingData);
      if (parsed.state && parsed.state.video) {
        delete parsed.state.video.storedFile;
        localStorage.setItem('caption-editor-store', JSON.stringify(parsed));
      }
    } catch (error) {
      console.warn('Error clearing stored video:', error);
    }
  }
};