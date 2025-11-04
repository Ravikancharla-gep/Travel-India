import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapClickHandlerProps {
  onMapClick: () => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // Add a small delay to allow marker click events to process first
      setTimeout(() => {
        // If clicking on the map (not on a marker), trigger callback
        const target = e.originalEvent?.target as HTMLElement;
        if (target && !target.closest('.leaflet-marker-icon') && !target.closest('.leaflet-popup')) {
          onMapClick();
        }
      }, 10);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onMapClick]);

  return null;
};

export default MapClickHandler;

