import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

// Component to configure smooth zoom behavior
const ZoomConfig = () => {
  const map = useMap();
  const wheelZoomDisabled = useRef(false);

  useEffect(() => {
    if (!map || wheelZoomDisabled.current) return;
    wheelZoomDisabled.current = true;

    // Disable default wheel zoom temporarily to replace with custom smooth handler
    map.scrollWheelZoom.disable();
    
    // Configure map zoom options - no animation to prevent white flash
    (map as any).options.zoomSnap = 0.1; // Very fine fractional zoom levels
    (map as any).options.zoomAnimation = false; // Disable zoom animation to prevent white flash
    (map as any).options.zoomAnimationThreshold = Infinity; // Never animate zoom changes

    // Get the map container
    const container = map.getContainer();
    let zoomTimeout: ReturnType<typeof setTimeout> | null = null;
    let accumulatedDelta = 0;

    // Custom smooth wheel zoom handler
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Accumulate wheel deltas for smoother zooming
      accumulatedDelta += e.deltaY;

      // Clear existing timeout
      if (zoomTimeout) {
        clearTimeout(zoomTimeout);
      }

      // Only zoom after accumulating enough delta (balanced smoothness and responsiveness)
      const sensitivity = 100; // Lower = more sensitive = faster zooming
      const absAccumulated = Math.abs(accumulatedDelta);

      if (absAccumulated >= sensitivity) {
        const zoomDirection = accumulatedDelta > 0 ? -1 : 1;
        const currentZoom = map.getZoom();
        
        // Balanced zoom increment for smooth but responsive zooming
        const zoomIncrement = 0.3 * zoomDirection;
        const newZoom = Math.max(0, Math.min(20, currentZoom + zoomIncrement));
        
        // Instant zoom without animation to prevent white flash
        map.setZoom(newZoom, { animate: false });
        
        // Reset accumulated delta
        accumulatedDelta = 0;
      } else {
        // If not enough delta yet, wait a bit and zoom if user stops scrolling
        zoomTimeout = setTimeout(() => {
          if (Math.abs(accumulatedDelta) > 30) {
            const zoomDirection = accumulatedDelta > 0 ? -1 : 1;
            const currentZoom = map.getZoom();
            const zoomIncrement = 0.2 * zoomDirection;
            const newZoom = Math.max(0, Math.min(20, currentZoom + zoomIncrement));
            map.setZoom(newZoom, { animate: false });
          }
          accumulatedDelta = 0;
        }, 100);
      }
    };

    // Add custom wheel handler
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Re-enable scroll wheel zoom (but our custom handler will take precedence)
    map.scrollWheelZoom.enable();

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (zoomTimeout) {
        clearTimeout(zoomTimeout);
      }
    };
  }, [map]);

  return null;
};

export default ZoomConfig;

