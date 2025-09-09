## 🚨 CRITICAL localStorage Persistence Implementation Rules

**FULLY WORKING** - Implements complete recovery spec with all edge cases handled:

1. **Recovery specification** (See @docs/spec/recovery_spec.txt for details):
   - ✅ **No auto-restore on startup**: Captions cleared from UI on app launch
   - ✅ **Conditional restore for same file**: Captions restore when EXACT same video uploaded
   - ✅ **No restore for different file**: Captions stay cleared for different videos

2. **File metadata matching**:

   ```typescript
   interface VideoFileMetadata {
     name: string; // Exact filename match required
     size: number; // Byte-perfect size match required
     lastModified: number; // Exact timestamp match required
   }
   ```

3. **Critical implementation patterns**:

   ```typescript
   // Store caption data AND file metadata together
   const persistedState = {
     captionFile: state.captionFile,
     videoFileMetadata: state.video.fileMetadata,
     lastSaved: state.lastSaved,
   };

   // Reset captionsCleared flag on successful operations
   setCaptionFile: (captionFile) => {
     set({ captionFile, captionsCleared: false });
   };

   // Preserve localStorage during startup clearing
   if (state.captionsCleared && state.captionFile === null) {
     const existingData = localStorage.getItem('caption-editor-store');
     // Preserve both captionFile AND videoFileMetadata
   }
   ```

4. **Edge case handling**:
   - **Startup clearing preserves data**: App startup clears UI but keeps localStorage intact
   - **Recovery re-enables persistence**: Restored captions immediately become persistable
   - **Multiple recovery cycles**: Works across unlimited browser open/close cycles
   - **Different video protection**: Stored captions preserved even when different videos loaded

5. **Key store location**: `src/stores/caption-store.ts` with Zustand persist middleware
6. **localStorage key**: `caption-editor-store`
7. **Debugging**: Console logs with 🔧 🔍 ✅ ❌ prefixes for persistence tracking
