import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-polylinedecorator';

interface SegmentArrowsProps {
  from: [number, number];
  to: [number, number];
  color: string;
  transport?: string;
  time?: string;
  distance?: string;
  showInfo?: boolean;
}

// Get transport icon emoji
const getTransportIcon = (transport?: string): string => {
  if (!transport) return '🚗';
  const transportLower = transport.toLowerCase();
  if (transportLower.includes('train')) return '🚂';
  if (transportLower.includes('bus')) return '🚌';
  if (transportLower.includes('flight') || transportLower.includes('plane')) return '✈️';
  if (transportLower.includes('bike')) return '🏍️';
  if (transportLower.includes('walk')) return '🚶';
  if (transportLower.includes('boat')) return '🚢';
  return '🚗'; // Default to car
};

// Adds arrowheads along the segment to show direction of travel
const SegmentArrows = ({ from, to, color, transport, time, distance, showInfo }: SegmentArrowsProps) => {
  const map = useMap();

  useEffect(() => {
    const line = L.polyline([from, to]);
    // @ts-ignore - polylineDecorator is added by side-effect import
    const decorator = L.polylineDecorator(line, {
      patterns: [
        {
          offset: 20,
          repeat: 60,
          symbol: L.Symbol.arrowHead({
            pixelSize: 10,
            pathOptions: { color, weight: 2, fillOpacity: 0.9, opacity: 0.9 },
          }),
        },
      ],
    });
    decorator.addTo(map);

    // Add transport info with large icon if enabled and data exists
    let infoMarker: L.Marker | null = null;
    if (showInfo) {
      const midLat = (from[0] + to[0]) / 2;
      const midLng = (from[1] + to[1]) / 2;
      
      // Get transport icon (default to car if not specified)
      const transportEmoji = getTransportIcon(transport || 'Car');
      
      // Format time and distance
      const infoText = [];
      if (time) infoText.push(time);
      if (distance) infoText.push(`(${distance})`);
      const timeDistanceText = infoText.join(' ');
      
      // If no transport/time/distance, still show icon with default transport
      
      const infoIcon = L.divIcon({
        className: 'route-info-icon',
        html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          ">
            <div style="
              background: ${color};
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 3px solid white;
            ">${transportEmoji}</div>
            ${timeDistanceText ? `
            <div style="
              background: white;
              color: ${color};
              padding: 4px 8px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 600;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              border: 2px solid ${color};
            ">${timeDistanceText}</div>
            ` : ''}
          </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 30],
      });

      infoMarker = L.marker([midLat, midLng], { icon: infoIcon, zIndexOffset: 500 }).addTo(map);
    }

    return () => {
      decorator.remove();
      if (infoMarker) {
        infoMarker.remove();
      }
    };
  }, [map, from, to, color, transport, time, distance, showInfo]);

  return null;
};

export default SegmentArrows;


