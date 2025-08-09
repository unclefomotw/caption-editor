import { VideoPlayer } from '@/components/VideoPlayer';
import { CaptionEditor } from '@/components/CaptionEditor';
import { StorageStatus } from '@/components/StorageStatus';
import { CaptionActions } from '@/components/CaptionActions';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Caption Editor</h1>
              <p className="text-sm text-gray-600">
                Upload a video and edit captions with AI assistance
              </p>
            </div>
            <div className="text-sm text-gray-500">
              v0.1.0
            </div>
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

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Built with Next.js, TypeScript, and ❤️
            </div>
            <div className="flex space-x-4 text-sm text-gray-400">
              <span>Keyboard shortcuts: Space (play/pause), ← → (seek)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
