## 🚨 CRITICAL Bidirectional Synchronization Implementation Rules

**MUST READ**: Key patterns for maintaining video/caption sync that have been tested and verified:

1. **Use HTML5 video element for direct seeking**:

   ```tsx
   // When clicking caption segments
   const videoElement = document.querySelector('video');
   if (videoElement) {
     videoElement.currentTime = segment.startTime;
   }
   ```

2. **Implement smooth auto-scrolling with refs**:

   ```tsx
   const segmentListRef = useRef<HTMLDivElement>(null);
   const selectedSegmentRef = useRef<HTMLDivElement>(null);

   // Auto-scroll selected segment into view
   useEffect(() => {
     if (selectedSegmentId && selectedSegmentRef.current) {
       // Calculate scroll position and use smooth scrolling
     }
   }, [selectedSegmentId]);
   ```

3. **Enhanced visual feedback for active segments**:
   ```tsx
   className={`${
     isSelected
       ? 'bg-blue-100 border-l-4 border-blue-500 shadow-sm transform translate-x-1'
       : 'hover:bg-gray-50 hover:translate-x-0.5'
   }`}
   ```
