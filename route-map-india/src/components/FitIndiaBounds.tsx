import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

interface FitIndiaBoundsProps {
  active: boolean;
}

/**
 * Component to fit map bounds to show all of India
 * Triggers when active becomes true
 */
const FitIndiaBounds: React.FC<FitIndiaBoundsProps> = ({ active }) => {
  const map = useMap();
  const hasFitted = useRef(false);
  const wasActive = useRef(false);

  useEffect(() => {
    // Only trigger when active becomes true (show all trips mode activated)
    if (active && !wasActive.current && !hasFitted.current) {
      try {
        // India's approximate bounds: [north, east], [south, west]
        // Roughly from 6.5°N to 35°N latitude and 68°E to 97°E longitude
        const indiaBounds: [[number, number], [number, number]] = [
          [35.5, 97.5], // Northeast corner
          [6.5, 68.0],  // Southwest corner
        ];
        
        map.fitBounds(indiaBounds, {
          padding: [50, 50], // Add padding around bounds
          maxZoom: 6, // Don't zoom in too much, keep it zoomed out to show all of India
          animate: true,
          duration: 1.0, // Smooth animation
        });
        
        hasFitted.current = true;
      } catch (error) {
        console.error('Failed to fit India bounds:', error);
      }
    }
    
    // Track active state
    wasActive.current = active;
    
    // Reset hasFitted when active becomes false (allows next activation to work)
    if (!active) {
      hasFitted.current = false;
    }
  }, [map, active]);

  return null;
};

export default FitIndiaBounds;

