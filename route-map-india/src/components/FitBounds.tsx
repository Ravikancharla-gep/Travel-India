import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

interface FitBoundsProps {
  positions: LatLngExpression[];
  active: boolean;
  onComplete?: () => void; // Callback when fit is complete
}

/**
 * Component to fit map bounds to show all positions
 * Only fits once when active changes from false to true
 */
const FitBounds: React.FC<FitBoundsProps> = ({ positions, active, onComplete }) => {
  const map = useMap();
  const hasFitted = useRef(false);
  const wasActive = useRef(false);

  useEffect(() => {
    // Only trigger when active becomes true (button clicked) and hasn't fitted yet for this activation
    if (active && !wasActive.current && positions.length > 0 && !hasFitted.current) {
      try {
        const bounds = positions.map(pos => {
          const lat = Array.isArray(pos) ? pos[0] : (pos as any).lat;
          const lng = Array.isArray(pos) ? pos[1] : (pos as any).lng;
          return [lat, lng] as [number, number];
        });
        map.fitBounds(bounds, {
          padding: [50, 50], // Add padding around bounds
          maxZoom: 15, // Don't zoom in too much
          animate: true,
        });
        hasFitted.current = true;
        // Call onComplete after a short delay to ensure animation started
        if (onComplete) {
          setTimeout(() => {
            onComplete();
          }, 100);
        }
      } catch (error) {
        console.error('Failed to fit bounds:', error);
        if (onComplete) onComplete();
      }
    }
    
    // Track active state
    wasActive.current = active;
    
    // Reset hasFitted when active becomes false (allows next click to work)
    if (!active) {
      hasFitted.current = false;
    }
  }, [map, positions, active, onComplete]);

  return null;
};

export default FitBounds;

