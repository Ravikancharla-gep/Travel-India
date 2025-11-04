// Types for the Route Map application
export interface Place {
  id: string;
  name: string;
  coords: [number, number]; // [latitude, longitude]
  transport?: TransportMode; // Optional - set via Route Editor
  distance?: string;
  time?: string;
  description?: string;
  image?: string; // base64 string
  createdAt: string;
  isIntermediate?: boolean; // If true, doesn't get a number in the list
  isRevisit?: boolean; // If true, this is a revisit to a previously visited place
  originalPlaceId?: string; // ID of the original place if this is a revisit
  assignedNumber?: number; // The number assigned when first visited (preserved on revisits)
}

export interface TripList {
  id: string;
  name: string;
  color: string;
  places: Place[];
  createdAt: string;
  backgroundImage?: string; // Optional background image URL or base64
}

export type TransportMode = 
  | 'Bus'
  | 'Train'
  | 'Car'
  | 'Flight'
  | 'Bike'
  | 'Walk'
  | 'Boat'
  | 'Other';

export interface MapState {
  center: [number, number];
  zoom: number;
}

export interface AppState {
  tripLists: TripList[];
  selectedTripId: string | null;
  mapState: MapState;
  isAddPlaceModalOpen: boolean;
  hoveredPlace: Place | null;
  headerImages?: string[]; // User-added favorite images for header rotation
}

// Default trip list colors
export const TRIP_COLORS = [
  '#00BFA5', // Teal
  '#FF6B6B', // Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Lavender
];

// Sample data for Kerala Trip
export const SAMPLE_KERALA_TRIP: TripList = {
  id: 'kerala-trip-1',
  name: 'Kerala',
  color: '#00BFA5',
  createdAt: new Date().toISOString(),
  places: [
    // Start: Hyderabad -> Madurai (Train)
    {
      id: 'hyderabad-start',
      name: 'Hyderabad (Start)',
      coords: [17.385, 78.4867],
      transport: 'Train',
      time: 'Overnight',
      description: 'Starting from Hyderabad by train towards Madurai.',
      createdAt: new Date().toISOString(),
      assignedNumber: 1,
    },
    {
      id: 'madurai',
      name: 'Madurai',
      coords: [9.9252, 78.1198],
      transport: 'Train',
      description: 'Start after overnight train from Hyderabad to Madurai.',
      createdAt: new Date().toISOString(),
      assignedNumber: 2,
    },
    {
      id: 'rameshwaram',
      name: 'Rameshwaram',
      coords: [9.2876, 79.3129],
      transport: 'Car',
      time: '3.5 hrs',
      description: 'Temple town and the iconic Pamban Bridge.',
      createdAt: new Date().toISOString(),
      assignedNumber: 3,
    },
    {
      id: 'kanyakumari',
      name: 'Kanyakumari',
      coords: [8.0883, 77.5385],
      transport: 'Car',
      time: '4 hrs',
      description: 'Southern tip of India; sunrise/sunset point.',
      createdAt: new Date().toISOString(),
      assignedNumber: 4,
    },
    {
      id: 'padmanabhaswamy',
      name: 'Padmanabhaswamy Temple',
      coords: [8.4829, 76.9431],
      transport: 'Car',
      time: '2.5 hrs',
      description: 'Historic temple in Kerala capital.',
      createdAt: new Date().toISOString(),
      assignedNumber: 5,
    },
    {
      id: 'varkala',
      name: 'Varkala Beach',
      coords: [8.7379, 76.716],
      transport: 'Car',
      time: '1.5 hrs',
      description: 'Cliffside beach views and cafes.',
      createdAt: new Date().toISOString(),
      assignedNumber: 6,
    },
    {
      id: 'jatayu',
      name: 'Jatayu Earth Center',
      coords: [8.8156, 76.8646],
      transport: 'Car',
      time: '1 hr',
      description: 'World\'s largest bird sculpture, zipline & adventure park.',
      createdAt: new Date().toISOString(),
      assignedNumber: 7,
    },
    {
      id: 'alleppey',
      name: 'Alleppey',
      coords: [9.4981, 76.3388],
      transport: 'Car',
      time: '2.5 hrs',
      description: 'Backwaters and houseboat cruise.',
      createdAt: new Date().toISOString(),
      assignedNumber: 8,
    },
    {
      id: 'ernakulam-1',
      name: 'Ernakulam',
      coords: [9.9816, 76.2999],
      transport: 'Car',
      time: '1.5 hrs',
      createdAt: new Date().toISOString(),
      assignedNumber: 9,
    },
    {
      id: 'athirapally',
      name: 'Athirapally Waterfalls',
      coords: [10.2849, 76.5698],
      transport: 'Car',
      time: '2 hrs',
      description: 'Niagara of India in Kerala.',
      createdAt: new Date().toISOString(),
      assignedNumber: 10,
    },
    // comeback to Ernakulam
    {
      id: 'ernakulam-2',
      name: 'Ernakulam (Return)',
      coords: [9.9816, 76.2999],
      transport: 'Car',
      time: '2 hrs',
      createdAt: new Date().toISOString(),
      isRevisit: true,
      isIntermediate: true, // Revisits are intermediate by default (no number visible)
      originalPlaceId: 'ernakulam-1',
      assignedNumber: 9, // Preserve original number
    },
    {
      id: 'munnar',
      name: 'Munnar',
      coords: [10.0892, 77.0597],
      transport: 'Car',
      time: '4.5 hrs',
      description: 'Tea gardens, viewpoints and cool climate.',
      createdAt: new Date().toISOString(),
      assignedNumber: 11,
    },
    // comeback to Ernakulam
    {
      id: 'ernakulam-3',
      name: 'Ernakulam (Return)',
      coords: [9.9816, 76.2999],
      transport: 'Car',
      time: '4.5 hrs',
      createdAt: new Date().toISOString(),
      isRevisit: true,
      isIntermediate: true, // Revisits are intermediate by default (no number visible)
      originalPlaceId: 'ernakulam-1',
      assignedNumber: 9, // Preserve original number
    },
    {
      id: 'kochi',
      name: 'Kochi (Fort Kochi)',
      coords: [9.9667, 76.2425],
      transport: 'Car',
      time: '45 mins',
      description: 'Chinese fishing nets, colonial streets.',
      createdAt: new Date().toISOString(),
      assignedNumber: 12,
    },
    // comeback to Ernakulam
    {
      id: 'ernakulam-4',
      name: 'Ernakulam (Return)',
      coords: [9.9816, 76.2999],
      transport: 'Car',
      time: '30 mins',
      createdAt: new Date().toISOString(),
      isRevisit: true,
      isIntermediate: true, // Revisits are intermediate by default (no number visible)
      originalPlaceId: 'ernakulam-1',
      assignedNumber: 9, // Preserve original number
    },
    {
      id: 'guruvayur',
      name: 'Guruvayur Temple',
      coords: [10.594, 76.0417],
      transport: 'Car',
      time: '2.5 hrs',
      createdAt: new Date().toISOString(),
      assignedNumber: 13,
    },
    {
      id: 'coimbatore',
      name: 'Coimbatore',
      coords: [11.0168, 76.9558],
      transport: 'Car',
      time: '4 hrs',
      createdAt: new Date().toISOString(),
      assignedNumber: 14,
    },
    // Final train to Bangalore then Hyderabad (optional endpoints)
    {
      id: 'bengaluru',
      name: 'Bengaluru',
      coords: [12.9716, 77.5946],
      transport: 'Train',
      time: 'Overnight',
      createdAt: new Date().toISOString(),
      assignedNumber: 15,
    },
    {
      id: 'hyderabad',
      name: 'Hyderabad (Return)',
      coords: [17.385, 78.4867],
      transport: 'Train',
      time: 'Overnight',
      createdAt: new Date().toISOString(),
      isRevisit: true,
      isIntermediate: true, // Revisits are intermediate by default (no number visible)
      originalPlaceId: 'hyderabad-start',
      assignedNumber: 1, // Preserve original number from start
    },
  ],
};
