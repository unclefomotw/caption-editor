'use client';

import { useEffect } from 'react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CaptionEditor } from '@/components/CaptionEditor';
import { StorageStatus } from '@/components/StorageStatus';
import { CaptionActions } from '@/components/CaptionActions';
import { useCaptionStore } from '@/stores/caption-store';
import packageJson from '../../package.json';

export default function Home() {
  const { clearCaptionsOnStartup } = useCaptionStore();

  // Clear captions on app startup per recovery spec
  useEffect(() => {
    clearCaptionsOnStartup();
  }, [clearCaptionsOnStartup]);
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Caption Editor
              </h1>
            </div>
            <div className="text-sm text-gray-500">v{packageJson.version}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Player */}
          <div className="space-y-6">
            <VideoPlayer className="w-full" />

            {/* Storage Status */}
            <StorageStatus />

            {/* Caption Actions */}
            <CaptionActions />
          </div>

          {/* Caption Editor */}
          <div className="space-y-6">
            <CaptionEditor className="w-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
