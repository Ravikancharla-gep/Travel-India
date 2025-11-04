import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import SegmentArrows from './components/SegmentArrows';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Navigation, Maximize2, LogIn, LogOut, User } from 'lucide-react';

import type { AppState, TripList, Place, TransportMode } from './types';
import { SAMPLE_KERALA_TRIP, TRIP_COLORS } from './types';
// Use API-based storage (with localStorage fallback)
import { storageUtils } from './utils/storageApi';
import { authUtils, type User as AuthUser } from './utils/auth';
import { fetchPlaceImage } from './utils/placeImageFetcher';
import Sidebar from './components/Sidebar';
import PlacePopup from './components/PlacePopup';
import ImageModal from './components/ImageModal';
import RouteEditor from './components/RouteEditor';
import ZoomConfig from './components/ZoomConfig';
import FitBounds from './components/FitBounds';
import FitIndiaBounds from './components/FitIndiaBounds';
import TravelChatbot from './components/TravelChatbot';
import AuthModal from './components/AuthModal';
import MapClickHandler from './components/MapClickHandler';

// Numbered marker as DivIcon
const createNumberedIcon = (num: number, color: string) =>
  L.divIcon({
    className: 'custom-number-marker',
    html: `
      <div style="
        background:${color};
        width:28px;height:28px;border-radius:9999px;
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-weight:700;font-size:12px;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        border:2px solid rgba(255,255,255,0.9);
      ">${num}</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });

// Intermediate/unnumbered marker (smaller dot)
const createIntermediateIcon = (color: string) =>
  L.divIcon({
    className: 'custom-intermediate-marker',
    html: `
      <div style="
        background:${color};
        width:16px;height:16px;border-radius:9999px;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
        border:2px solid rgba(255,255,255,0.9);
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });

// Initialize state - now async to load from API (only if authenticated)
const getInitialState = async (): Promise<AppState> => {
  // Only load from API if user is authenticated
  if (!authUtils.isAuthenticated()) {
    console.log('User not authenticated, using sample data');
    return {
      tripLists: [SAMPLE_KERALA_TRIP],
      selectedTripId: SAMPLE_KERALA_TRIP.id,
      mapState: {
        center: [20.5937, 78.9629],
        zoom: 6,
      },
      isAddPlaceModalOpen: false,
      hoveredPlace: null,
      headerImages: [],
    };
  }

  try {
    const savedState = await storageUtils.loadAppState();
    if (savedState.tripLists && savedState.tripLists.length > 0) {
      console.log('Initializing with saved data from server');
      return {
        tripLists: savedState.tripLists,
        selectedTripId: savedState.selectedTripId ?? savedState.tripLists[0]?.id ?? null,
        mapState: savedState.mapState ?? {
          center: [20.5937, 78.9629],
          zoom: 6,
        },
        isAddPlaceModalOpen: false,
        hoveredPlace: null,
        headerImages: savedState.headerImages || [],
      };
    }
  } catch (error) {
    console.error('Error loading initial state:', error);
  }
  
  console.log('Initializing with empty state');
  return {
    tripLists: [],
    selectedTripId: null,
    mapState: {
      center: [20.5937, 78.9629],
      zoom: 6,
    },
    isAddPlaceModalOpen: false,
    hoveredPlace: null,
    headerImages: [],
  };
};

function App() {
  const [user, setUser] = useState<AuthUser | null>(authUtils.getUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(!authUtils.isAuthenticated());
  const [profileImageLoaded, setProfileImageLoaded] = useState<boolean>(false);
  const [profileImageError, setProfileImageError] = useState<boolean>(false);
  
  const [appState, setAppState] = useState<AppState>({
    tripLists: [SAMPLE_KERALA_TRIP],
    selectedTripId: SAMPLE_KERALA_TRIP.id,
    mapState: {
      center: [20.5937, 78.9629],
      zoom: 6,
    },
    isAddPlaceModalOpen: false,
    hoveredPlace: null,
    headerImages: [],
  });
  
  // Check authentication on mount and load data if authenticated
  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      const savedUser = authUtils.getUser();
      if (savedUser) {
        console.log('Loaded user from storage:', savedUser);
        setUser(savedUser);
      }
      // Load user's data
      getInitialState().then((initialState) => {
        setAppState(initialState);
        hasLoadedSavedData.current = true;
      }).catch((error) => {
        console.error('Failed to load initial state:', error);
        hasLoadedSavedData.current = true;
      });
    } else {
      hasLoadedSavedData.current = true; // Allow saving even if not authenticated (will fail gracefully)
    }
  }, []);

  // Reset image loading state when user or picture URL changes
  useEffect(() => {
    if (user?.picture) {
      setProfileImageLoaded(false);
      setProfileImageError(false);
    } else {
      setProfileImageLoaded(false);
      setProfileImageError(true);
    }
  }, [user?.picture, user?.id]);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ place: Place; image: string } | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [viewingPlaceId, setViewingPlaceId] = useState<string | null>(null); // For modal popup
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [isRouteEditorOpen, setIsRouteEditorOpen] = useState(false);
  const [showTransportOnMap, setShowTransportOnMap] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320); // Sidebar width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const [fitBoundsActive, setFitBoundsActive] = useState(false);
  const [showAllTrips, setShowAllTrips] = useState(false); // Show all trips mode
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const hasLoadedSavedData = useRef(false);

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        // Constrain sidebar width between 250px and 600px
        if (newWidth >= 250 && newWidth <= 600) {
          setSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // No longer need to auto-open Leaflet popup - we use modal instead

  // Update marker icons when hover or selection changes
  useEffect(() => {
    const currentSelectedTrip = appState.tripLists.find(trip => trip.id === appState.selectedTripId);
    if (!currentSelectedTrip) return;
    
    // Use requestAnimationFrame to ensure DOM is ready and React state is updated
    requestAnimationFrame(() => {
      currentSelectedTrip.places.forEach((place) => {
        const marker = markerRefs.current[place.id];
        if (!marker) return;

        const displayNumber = place.assignedNumber;
        // Priority: Selected (red) > Hovered (orange) > Normal
        // IMPORTANT: selectedPlaceId takes absolute priority over hoveredPlaceId
        const markerColor = (selectedPlaceId === place.id) 
          ? '#EF4444' // Red for selected/clicked - highest priority
          : (hoveredPlaceId === place.id && selectedPlaceId !== place.id) 
            ? '#F97316' // Orange for hovered (only if not selected)
            : currentSelectedTrip.color; // Default trip color

        const newIcon = place.isIntermediate
          ? createIntermediateIcon(markerColor)
          : displayNumber !== undefined
            ? createNumberedIcon(displayNumber, markerColor)
            : createIntermediateIcon(markerColor);

        // Set icon - this ensures color changes are applied
        marker.setIcon(newIcon);
      });
    });
  }, [hoveredPlaceId, selectedPlaceId, appState.tripLists, appState.selectedTripId]);

  // Note: Images are no longer pre-fetched and saved automatically
  // Images are fetched on-demand when viewing places in PlacePopup
  // Only manually uploaded images (base64 data URLs) are saved to the database
  // Online images (Unsplash/Wikipedia) are displayed directly without saving

  // Save data to server (only if authenticated)
  useEffect(() => {
    // Skip save if not authenticated
    if (!authUtils.isAuthenticated()) {
      return;
    }
    
    // Skip save until we've checked for saved data on initial mount
    if (!hasLoadedSavedData.current) {
      return;
    }
    
    // Debounce saves to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      try {
        await storageUtils.saveAppState(appState);
      } catch (error: any) {
        console.error('Failed to save app state:', error);
        // Error is already handled in storageApi with localStorage fallback
      }
    }, 500); // Wait 500ms after last change before saving

    return () => clearTimeout(timeoutId);
  }, [appState.tripLists, appState.selectedTripId, appState.mapState]);

  const handleLogin = (loggedInUser: AuthUser) => {
    // Ensure user object is properly stored with all fields including picture
    const userData = {
      id: loggedInUser.id,
      email: loggedInUser.email,
      name: loggedInUser.name || loggedInUser.email.split('@')[0],
      picture: loggedInUser.picture || null,
    };
    console.log('handleLogin - received user from login:', loggedInUser);
    console.log('handleLogin - storing user:', userData);
    console.log('handleLogin - picture URL:', userData.picture);
    authUtils.setUser(userData);
    setUser(userData);
    // Reset image loading state for new user
    setProfileImageLoaded(false);
    setProfileImageError(false);
    setIsAuthModalOpen(false);
    // Reload data after login
    getInitialState().then((initialState) => {
      setAppState(initialState);
      hasLoadedSavedData.current = true;
    });
  };

  const handleLogout = () => {
    authUtils.logout();
    setUser(null);
    // Reset image loading state
    setProfileImageLoaded(false);
    setProfileImageError(false);
    setIsAuthModalOpen(true);
    // Reset to sample data
    setAppState({
      tripLists: [SAMPLE_KERALA_TRIP],
      selectedTripId: SAMPLE_KERALA_TRIP.id,
      mapState: {
        center: [20.5937, 78.9629],
        zoom: 6,
      },
      isAddPlaceModalOpen: false,
      hoveredPlace: null,
      headerImages: [],
    });
  };

  const selectedTrip = appState.tripLists.find(trip => trip.id === appState.selectedTripId);

  const handleAddPlace = (placeData: Omit<Place, 'id' | 'createdAt' | 'assignedNumber' | 'isRevisit' | 'originalPlaceId'>) => {
    if (!selectedTrip) return;

    // Check if this place already exists (revisit check)
    // Match by name (normalized) or by coordinates (within 0.01 degrees ~1km)
    const existingPlace = selectedTrip.places.find(p => {
      const nameMatch = p.name.toLowerCase().trim() === placeData.name.toLowerCase().trim();
      const coordMatch = Math.abs(p.coords[0] - placeData.coords[0]) < 0.01 &&
                        Math.abs(p.coords[1] - placeData.coords[1]) < 0.01;
      return nameMatch || coordMatch;
    });

    let assignedNumber: number | undefined;
    let isRevisit = false;
    let originalPlaceId: string | undefined;
    let isIntermediate = placeData.isIntermediate || false;

    if (existingPlace && !placeData.isIntermediate) {
      // This is a revisit - toggle off by default (set as intermediate so no number shows)
      isRevisit = true;
      originalPlaceId = existingPlace.isRevisit ? existingPlace.originalPlaceId : existingPlace.id;
      // Preserve original number but mark as intermediate so it doesn't display
      assignedNumber = existingPlace.assignedNumber;
      isIntermediate = true; // Revisits are intermediate by default (no number visible)
    } else if (!placeData.isIntermediate) {
      // New place - assign next available number
      // Count only non-intermediate places to determine next number
      const numberedPlaces = selectedTrip.places.filter(p => !p.isIntermediate);
      assignedNumber = numberedPlaces.length + 1;
    }
    // If intermediate, leave assignedNumber undefined

    const newPlace: Place = {
      ...placeData,
      id: `place-${Date.now()}`,
      createdAt: new Date().toISOString(),
      assignedNumber,
      isIntermediate,
      isRevisit: isRevisit || undefined,
      originalPlaceId,
    };

    setAppState(prev => ({
      ...prev,
      tripLists: prev.tripLists.map(trip =>
        trip.id === selectedTrip.id
          ? { ...trip, places: [...trip.places, newPlace] }
          : trip
      ),
      isAddPlaceModalOpen: false,
    }));
  };

  const handleDeletePlace = (placeId: string) => {
    if (!selectedTrip) return;

    setAppState(prev => ({
      ...prev,
      tripLists: prev.tripLists.map(trip =>
        trip.id === selectedTrip.id
          ? { ...trip, places: trip.places.filter(place => place.id !== placeId) }
          : trip
      ),
    }));
  };

  const handleUpdatePlace = (placeId: string, updates: { transport?: TransportMode; distance?: string; time?: string }) => {
    if (!selectedTrip) return;

    setAppState(prev => ({
      ...prev,
      tripLists: prev.tripLists.map(trip =>
        trip.id === selectedTrip.id
          ? {
              ...trip,
              places: trip.places.map(place =>
                place.id === placeId
                  ? { ...place, ...updates }
                  : place
              ),
            }
          : trip
      ),
    }));
  };

  const handleUpdatePlaceDetails = (placeId: string, updates: { name?: string; description?: string; image?: string }) => {
    if (!selectedTrip) return;

    setAppState(prev => ({
      ...prev,
      tripLists: prev.tripLists.map(trip =>
        trip.id === selectedTrip.id
          ? {
              ...trip,
              places: trip.places.map(place =>
                place.id === placeId
                  ? { ...place, ...updates }
                  : place
              ),
            }
          : trip
      ),
    }));
  };

  const togglePlaceNumbering = (placeId: string) => {
    if (!selectedTrip) return;

    setAppState(prev => ({
      ...prev,
      tripLists: prev.tripLists.map(trip => {
        if (trip.id !== selectedTrip.id) return trip;
        
        const placeIndex = trip.places.findIndex(p => p.id === placeId);
        if (placeIndex === -1) return trip;

        const place = trip.places[placeIndex];
        const isCurrentlyIntermediate = place.isIntermediate || false;
        
        // Toggle intermediate status
        const updatedPlace: Place = {
          ...place,
          isIntermediate: !isCurrentlyIntermediate,
        };

        // If becoming intermediate, remove assignedNumber
        if (!isCurrentlyIntermediate) {
          updatedPlace.assignedNumber = undefined;
        }

        // Update the place in the array
        const newPlaces = [...trip.places];
        newPlaces[placeIndex] = updatedPlace;

        // Renumber all non-intermediate places sequentially (no gaps, no duplicates)
        let numberCounter = 1;
        const renumberedPlaces = newPlaces.map(p => {
          if (p.isIntermediate) {
            // Intermediate places don't get numbers
            return { ...p, assignedNumber: undefined };
          } else {
            // Assign sequential numbers
            return { ...p, assignedNumber: numberCounter++ };
          }
        });

        return { ...trip, places: renumberedPlaces };
      }),
    }));
  };

  const movePlace = (placeId: string, direction: 'up' | 'down') => {
    const trip = selectedTrip;
    if (!trip) return;
    const idx = trip.places.findIndex(p => p.id === placeId);
    if (idx === -1) return;
    const newIndex = direction === 'up' ? idx - 1 : idx + 1;
    if (newIndex < 0 || newIndex >= trip.places.length) return;
    const newPlaces = [...trip.places];
    const [moved] = newPlaces.splice(idx, 1);
    newPlaces.splice(newIndex, 0, moved);
    setAppState(prev => ({
      ...prev,
      tripLists: prev.tripLists.map(t => t.id === trip.id ? { ...t, places: newPlaces } : t),
    }));
  };

  const reorderPlace = (placeId: string, targetIndex: number) => {
    const trip = selectedTrip;
    if (!trip) return;
    const currentIndex = trip.places.findIndex(p => p.id === placeId);
    if (currentIndex === -1) {
      console.warn('Place not found:', placeId);
      return;
    }
    
    console.log('reorderPlace called:', { placeId, targetIndex, currentIndex, currentLists: trip.places.map(p => p.name) });
    
    // Clamp targetIndex to valid range (0 to places.length)
    const clampedTargetIndex = Math.max(0, Math.min(targetIndex, trip.places.length));
    
    // Use the same logic as reorderTrip
    let finalIndex: number;
    if (currentIndex === clampedTargetIndex) {
      console.log('Already in correct position');
      return; // Already in correct position
    } else if (currentIndex < clampedTargetIndex) {
      // Moving forward (top to bottom): account for the removed item shifting indices
      // Special case: if moving from index 0 to targetIndex 1, we want finalIndex = 1
      if (currentIndex === 0 && clampedTargetIndex === 1) {
        finalIndex = 1;
      } else {
        finalIndex = clampedTargetIndex - 1;
      }
    } else {
      // Moving backward (bottom to top): target doesn't shift
      finalIndex = clampedTargetIndex;
    }
    
    // Ensure finalIndex is within valid bounds
    finalIndex = Math.max(0, Math.min(finalIndex, trip.places.length - 1));
    
    // Double-check: don't move if final position is the same
    if (finalIndex === currentIndex) {
      console.log('Final position same as current');
      return;
    }
    
    console.log('Moving from index', currentIndex, 'to finalIndex', finalIndex, '(targetIndex was', clampedTargetIndex, ')');
    
    const newPlaces = [...trip.places];
    const [moved] = newPlaces.splice(currentIndex, 1);
    newPlaces.splice(finalIndex, 0, moved);
    
    // Renumber all non-intermediate places sequentially
    let numberCounter = 1;
    const renumberedPlaces = newPlaces.map(p => {
      if (p.isIntermediate) {
        return { ...p, assignedNumber: undefined };
      } else {
        return { ...p, assignedNumber: numberCounter++ };
      }
    });
    
    setAppState(prev => ({
      ...prev,
      tripLists: prev.tripLists.map(t => t.id === trip.id ? { ...t, places: renumberedPlaces } : t),
    }));
  };

  const handleAddHeaderImage = (imageUrl: string) => {
    setAppState(prev => ({
      ...prev,
      headerImages: [...(prev.headerImages || []), imageUrl],
    }));
  };

  const handleDeleteHeaderImage = (imageIndex: number) => {
    setAppState(prev => {
      const newHeaderImages = [...(prev.headerImages || [])];
      newHeaderImages.splice(imageIndex, 1);
      return {
        ...prev,
        headerImages: newHeaderImages,
      };
    });
  };

  // Clean up problematic numbered PNG images from headerImages (27.png, 28.png, 29.png)
  useEffect(() => {
    if (appState.headerImages && appState.headerImages.length > 0) {
      const problematicPatterns = ['27.png', '28.png', '29.png'];
      const hasProblematicImages = appState.headerImages.some(img => 
        problematicPatterns.some(pattern => img.includes(pattern))
      );
      
      if (hasProblematicImages) {
        const cleanedImages = appState.headerImages.filter(img => 
          !problematicPatterns.some(pattern => img.includes(pattern))
        );
        
        if (cleanedImages.length !== appState.headerImages.length) {
          setAppState(prev => ({
            ...prev,
            headerImages: cleanedImages,
          }));
          console.log('Cleaned up problematic header images (27.png, 28.png, 29.png)');
        }
      }
    }
  }, [appState.headerImages]);

  const handleCreateTrip = async (tripName: string) => {
    const newTrip: TripList = {
      id: `trip-${Date.now()}`,
      name: tripName,
      color: TRIP_COLORS[appState.tripLists.length % TRIP_COLORS.length],
      places: [],
      createdAt: new Date().toISOString(),
    };

    // Add trip first
    setAppState(prev => ({
      ...prev,
      tripLists: [...prev.tripLists, newTrip],
      selectedTripId: newTrip.id,
    }));

    // Fetch background image automatically (in background, don't block UI)
    setTimeout(async () => {
      try {
        const imageUrl = await fetchPlaceImage(tripName);
        if (imageUrl) {
          setAppState(prev => ({
            ...prev,
            tripLists: prev.tripLists.map(trip =>
              trip.id === newTrip.id ? { ...trip, backgroundImage: imageUrl } : trip
            ),
          }));
        }
      } catch (error) {
        console.log(`Failed to fetch background image for ${tripName}:`, error);
      }
    }, 100); // Small delay to ensure state is updated
  };

  const handleDeleteTrip = (tripId: string) => {
    setAppState(prev => ({
      ...prev,
      tripLists: prev.tripLists.filter(trip => trip.id !== tripId),
      selectedTripId: prev.selectedTripId === tripId ? null : prev.selectedTripId,
    }));
  };

  const handleUpdateTrip = (tripId: string, newName: string) => {
    if (!newName.trim()) return; // Don't allow empty names
    setAppState(prev => ({
      ...prev,
      tripLists: prev.tripLists.map(trip =>
        trip.id === tripId ? { ...trip, name: newName.trim() } : trip
      ),
    }));
  };

  const handleUpdateTripBackground = (tripId: string, imageUrl: string) => {
    setAppState(prev => ({
      ...prev,
      tripLists: prev.tripLists.map(trip =>
        trip.id === tripId ? { ...trip, backgroundImage: imageUrl } : trip
      ),
    }));
  };

  const reorderTrip = (tripId: string, targetIndex: number) => {
    console.log('reorderTrip called:', { tripId, targetIndex, currentLists: appState.tripLists.map(t => t.name) });
    
    const currentIndex = appState.tripLists.findIndex(t => t.id === tripId);
    if (currentIndex === -1) {
      console.warn('Trip not found:', tripId);
      return;
    }
    
    // Clamp targetIndex to valid range
    const clampedTargetIndex = Math.max(0, Math.min(targetIndex, appState.tripLists.length));
    
    // Calculate the final insertion index
    // targetIndex represents the line position where we want to insert
    // Example: targetIndex = 1 means "insert at position 1" (after item at index 0, before item at index 1)
    let finalIndex: number;
    if (currentIndex === clampedTargetIndex) {
      console.log('Already in correct position');
      return; // Already in correct position
    } else if (currentIndex < clampedTargetIndex) {
      // Moving forward (down): targetIndex > currentIndex
      // Example: [A, B, C, D] - dragging A (idx 0) to targetIndex 2 (after B, before C)
      // After removing A: [B, C, D] - B is at 0, C is at 1, D is at 2
      // We want to insert at original position 2 (C's position), which is now position 1
      // So: finalIndex = clampedTargetIndex - 1
      // BUT: if currentIndex = 0 and targetIndex = 1, we want finalIndex = 1 (not 0)
      // Because after removing A, we want to insert at position 1 (after B)
      if (currentIndex === 0 && clampedTargetIndex === 1) {
        // Special case: moving first item to position 1
        finalIndex = 1;
      } else {
        finalIndex = clampedTargetIndex - 1;
      }
    } else {
      // Moving backward (up): targetIndex < currentIndex
      // Example: [A, B, C, D] - dragging D (idx 3) to targetIndex 1 (after A, before B)
      // After removing D: [A, B, C] - indices don't shift for items before removed item
      // We want to insert at position 1, which is still position 1
      // So: finalIndex = clampedTargetIndex
      finalIndex = clampedTargetIndex;
    }
    
    // Ensure finalIndex is within valid bounds
    finalIndex = Math.max(0, Math.min(finalIndex, appState.tripLists.length - 1));
    
    // Double-check: don't move if final position is the same
    if (finalIndex === currentIndex) {
      console.log('Final position same as current', { currentIndex, clampedTargetIndex, finalIndex });
      return;
    }
    
    console.log('Moving from index', currentIndex, 'to index', finalIndex);
    
    const newTripLists = [...appState.tripLists];
    const [moved] = newTripLists.splice(currentIndex, 1);
    newTripLists.splice(finalIndex, 0, moved);
    
    console.log('New order:', newTripLists.map(t => t.name));
    
    setAppState(prev => ({
      ...prev,
      tripLists: newTripLists,
    }));
  };

  const handleImageClick = (place: Place, image: string) => {
    setSelectedImage({ place, image });
    setIsImageModalOpen(true);
  };

  return (
    <div className="h-screen flex bg-white text-gray-900 text-[15px] md:text-base">
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          if (authUtils.isAuthenticated()) {
            setIsAuthModalOpen(false);
          }
        }}
        onLogin={handleLogin}
      />

      {/* Login/User Button - Top right corner */}
      <div className="fixed top-4 right-4 z-[9999]">
        {user ? (
          <>
            {/* Backdrop - Only show when dropdown is open */}
            <AnimatePresence>
              {isProfileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="fixed inset-0 z-[9998]"
                />
              )}
            </AnimatePresence>

            {/* Vertical Stack - Profile pic and Logout button (cylinder shape) */}
            <div className="relative flex flex-col gap-2 z-[9999]">
                {/* Profile Button with Google One-style multi-color border */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="relative w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                  style={{
                    padding: '2px',
                    background: 'conic-gradient(from 0deg, #EA4335 0deg, #4285F4 90deg, #34A853 180deg, #FBBC05 270deg, #EA4335 360deg)',
                  }}
                >
                  {/* Inner circle with profile picture */}
                  <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800 relative">
                    {user.picture && !profileImageError ? (
                      <img
                        key={user.picture}
                        src={user.picture}
                        alt={user.name || user.email}
                        className={`w-full h-full object-cover transition-opacity duration-200 ${
                          profileImageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onError={(e) => {
                          console.error('Failed to load profile picture:', {
                            url: user.picture,
                            error: e,
                            user: user
                          });
                          setProfileImageError(true);
                          setProfileImageLoaded(false);
                        }}
                        onLoad={() => {
                          console.log('Profile picture loaded successfully:', user.picture);
                          setProfileImageLoaded(true);
                          setProfileImageError(false);
                        }}
                        loading="lazy"
                      />
                    ) : null}
                    {/* Fallback icon - shown when no picture or error */}
                    <div 
                      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                        (!user.picture || profileImageError) ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <User size={24} className="text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>
                </motion.button>

                {/* Logout Button - Circular, below profile pic (slides down) */}
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0, y: -10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0, opacity: 0, y: -10 }}
                      transition={{ duration: 0.1, ease: 'easeOut' }}
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                      title="Logout"
                    >
                      <LogOut size={20} className="text-white" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
          </>
        ) : (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-lg px-4 py-2 transition-colors"
          >
            <LogIn size={18} />
            <span className="font-medium">Login</span>
          </motion.button>
        )}
      </div>

      {/* Sidebar */}
      <div style={{ width: `${sidebarWidth}px` }} className="relative z-10">
        <Sidebar
          tripLists={appState.tripLists}
          selectedTripId={appState.selectedTripId}
          onSelectTrip={(tripId) => setAppState(prev => ({ ...prev, selectedTripId: tripId }))}
          onCreateTrip={handleCreateTrip}
          onDeleteTrip={handleDeleteTrip}
          onUpdateTrip={handleUpdateTrip}
          onUpdateTripBackground={handleUpdateTripBackground}
          onReorderTrip={reorderTrip}
          onAddPlace={() => {
            // Close any open place popup when opening "Add Place"
            setViewingPlaceId(null);
            setSelectedPlaceId(null);
            setAppState(prev => ({ ...prev, isAddPlaceModalOpen: true }));
          }}
          onMovePlace={movePlace}
          onReorderPlace={reorderPlace}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={setSelectedPlaceId}
          onViewPlace={(placeId) => {
            setSelectedPlaceId(placeId);
            setViewingPlaceId(placeId);
          }}
          onTogglePlaceNumbering={togglePlaceNumbering}
          onHoverPlace={setHoveredPlaceId}
          onToggleShowAllTrips={() => setShowAllTrips(!showAllTrips)}
          showAllTrips={showAllTrips}
          onDeletePlace={handleDeletePlace}
          headerImages={appState.headerImages || []}
          onAddHeaderImage={handleAddHeaderImage}
          onDeleteHeaderImage={handleDeleteHeaderImage}
        />
        
        {/* Resizer Handle - Visible on hover */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className="absolute right-0 top-0 w-1 cursor-col-resize opacity-0 hover:opacity-100 transition-opacity z-50 group"
          style={{ height: '100%' }}
          title="Drag to resize sidebar"
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-0.5 h-8 bg-gray-400 group-hover:bg-gray-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative" style={{ minHeight: 0, minWidth: 0 }}>
        <MapContainer
          center={appState.mapState.center}
          zoom={appState.mapState.zoom}
          className="h-full w-full"
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          scrollWheelZoom={true}
          attributionControl={false}
        >
          <ZoomConfig />
          <MapClickHandler
            onMapClick={() => {
              // Clear selection when clicking on map (not on marker)
              setSelectedPlaceId(null);
              setHoveredPlaceId(null);
              setViewingPlaceId(null);
            }}
          />
          {selectedTrip && selectedTrip.places.length > 0 && (
            <FitBounds
              positions={selectedTrip.places.map(p => p.coords)}
              active={fitBoundsActive}
              onComplete={() => {
                // Reset active state after fit completes, allowing normal map interaction
                setFitBoundsActive(false);
              }}
            />
          )}
          {/* Fit to India when show all trips mode is activated */}
          <FitIndiaBounds active={showAllTrips} />
          <TileLayer
            attribution=""
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />

          {/* Render markers and routes */}
          {showAllTrips ? (
            // Show all trips mode - just dots, no numbers, no lines
            appState.tripLists.map((trip) =>
              trip.places.map((place) => (
                <Marker
                  key={place.id}
                  position={place.coords}
                  icon={createIntermediateIcon(trip.color)}
                  zIndexOffset={100}
                  eventHandlers={{
                    click: (e: any) => {
                      if (e.originalEvent) {
                        e.originalEvent.stopPropagation();
                        e.originalEvent.preventDefault();
                        e.originalEvent.stopImmediatePropagation();
                      }
                      setSelectedPlaceId(place.id);
                      setViewingPlaceId(place.id);
                    },
                  }}
                />
              ))
            )
          ) : (
            // Normal mode - show selected trip with numbers and lines
            selectedTrip && selectedTrip.places.map((place, index) => {
            // Use assignedNumber directly (managed by toggle/reorder functions)
            const displayNumber = place.assignedNumber;
            
            // Highlight on hover (orange) or click (red), otherwise use trip color
            const markerColor = (selectedPlaceId === place.id) 
              ? '#EF4444' // Red for selected/clicked
              : (hoveredPlaceId === place.id) 
                ? '#F97316' // Orange for hovered
                : selectedTrip.color; // Default trip color
            
            const icon = place.isIntermediate
              ? createIntermediateIcon(markerColor)
              : displayNumber !== undefined
                ? createNumberedIcon(displayNumber, markerColor)
                : createIntermediateIcon(markerColor);

            // Set z-index priority: numbered markers (higher) appear above intermediate markers (lower)
            // Also prioritize by number value so higher numbers appear above lower numbers when overlapping
            const zIndexOffset = place.isIntermediate 
              ? 100  // Intermediate markers (dots) - lower priority
              : displayNumber !== undefined
                ? 1000 + (displayNumber * 10)  // Numbered markers - higher priority, increasing with number
                : 100;  // Fallback for intermediate

            return (
            <React.Fragment key={place.id}>
              {/* Marker (numbered or intermediate) */}
              <Marker
                position={place.coords}
                icon={icon}
                zIndexOffset={zIndexOffset}
                riseOnHover
                ref={(instance) => {
                  if (instance) {
                    markerRefs.current[place.id] = instance;
                    // Set z-index programmatically to ensure numbered markers appear above intermediate
                    try {
                      (instance as any).setZIndexOffset(zIndexOffset);
                    } catch (e) {
                      // Fallback if method doesn't exist
                    }
                    
                    // Make marker cursor pointer
                    const markerElement = instance.getElement();
                    if (markerElement) {
                      markerElement.style.cursor = 'pointer';
                      // Make the entire marker clickable, not just the inner circle
                      markerElement.style.pointerEvents = 'auto';
                    }
                    // Don't set icon here - let useEffect handle all icon updates based on state
                  }
                }}
                eventHandlers={{
                  mouseover: (e: any) => {
                    // Stop propagation to prevent interference
                    if (e.originalEvent) {
                      e.originalEvent.stopPropagation();
                    }
                    
                    // Don't change to orange if already selected (red)
                    // Check both state and current marker ref to ensure consistency
                    if (selectedPlaceId === place.id) {
                      return; // Keep it red, don't set hover
                    }
                    
                    // Only set hover if not selected
                    setHoveredPlaceId(place.id);
                    setAppState(prev => ({ ...prev, hoveredPlace: place }));
                  },
                  mouseout: (e: any) => {
                    // Stop propagation
                    if (e.originalEvent) {
                      e.originalEvent.stopPropagation();
                    }
                    
                    // Don't clear hover if this is the selected place - keep it red
                    if (selectedPlaceId === place.id) {
                      return; // Keep it red, don't clear hover state
                    }
                    
                    // Clear hover state
                    setHoveredPlaceId(null);
                    setAppState(prev => ({ ...prev, hoveredPlace: null }));
                  },
                  click: (e: L.LeafletMouseEvent) => {
                    // CRITICAL: Stop ALL event propagation immediately
                    if (e.originalEvent) {
                      e.originalEvent.stopPropagation();
                      e.originalEvent.stopImmediatePropagation();
                      e.originalEvent.preventDefault();
                      
                      // Stop Leaflet event propagation
                      L.DomEvent.stopPropagation(e.originalEvent);
                      L.DomEvent.preventDefault(e.originalEvent);
                    }
                    
                    const clickedId = place.id;
                    const clickedDisplayNumber = place.assignedNumber;
                    
                    // Immediately clear hover and set selected state
                    // This ensures red color takes priority over orange hover
                    setHoveredPlaceId(null); // Clear hover first to prevent orange override
                    setSelectedPlaceId(clickedId); // Set selected (will trigger red color via useEffect)
                    setViewingPlaceId(clickedId); // Open popup modal
                    
                    // Immediately update the marker icon to red (synchronous DOM update)
                    // This provides instant visual feedback before React re-renders
                    const marker = markerRefs.current[clickedId];
                    if (marker) {
                      const redIcon = place.isIntermediate
                        ? createIntermediateIcon('#EF4444')
                        : clickedDisplayNumber !== undefined
                          ? createNumberedIcon(clickedDisplayNumber, '#EF4444')
                          : createIntermediateIcon('#EF4444');
                      marker.setIcon(redIcon);
                    }
                    
                    // Also use requestAnimationFrame to ensure icon is updated after React state updates
                    requestAnimationFrame(() => {
                      const marker = markerRefs.current[clickedId];
                      if (marker) {
                        const redIcon = place.isIntermediate
                          ? createIntermediateIcon('#EF4444')
                          : clickedDisplayNumber !== undefined
                            ? createNumberedIcon(clickedDisplayNumber, '#EF4444')
                            : createIntermediateIcon('#EF4444');
                        marker.setIcon(redIcon);
                      }
                    });
                  },
                }}
              >
                {/* Popup removed - we use modal instead */}
              </Marker>

              {/* Draw route lines between consecutive places */}
              {index > 0 && (
                <>
                  <Polyline
                    positions={[selectedTrip.places[index - 1].coords, place.coords]}
                    color={selectedTrip.color}
                    weight={4}
                    opacity={0.7}
                    className="route-line"
                  />
                  <SegmentArrows
                    from={selectedTrip.places[index - 1].coords}
                    to={place.coords}
                    color={selectedTrip.color}
                    transport={place.transport}
                    time={place.time}
                    distance={place.distance}
                    showInfo={showTransportOnMap}
                  />
                </>
              )}
            </React.Fragment>
            );
          })
          )}
        </MapContainer>

        {/* Floating Action Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            // Close any open place popup when opening "Add Place"
            setViewingPlaceId(null);
            setSelectedPlaceId(null);
            setAppState(prev => ({ ...prev, isAddPlaceModalOpen: true }));
          }}
          className="absolute bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-colors duration-200 z-10"
          disabled={!selectedTrip}
        >
          <Plus size={24} />
        </motion.button>

        {/* Hover Preview */}
        <AnimatePresence>
          {appState.hoveredPlace && appState.hoveredPlace.image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 z-20 max-w-xs"
            >
              <img
                src={appState.hoveredPlace.image}
                alt={appState.hoveredPlace.name}
                className="w-32 h-24 object-cover rounded image-preview"
              />
              <p className="text-sm font-medium text-gray-800 mt-1">
                {appState.hoveredPlace.name}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Route Details & Show Info Toggle Buttons */}
        {selectedTrip && (
          <>
            {/* Fit to Trip Button - Positioned to the right of zoom controls */}
            {selectedTrip.places.length > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setFitBoundsActive(false); // Reset first
                  setTimeout(() => setFitBoundsActive(true), 10); // Then activate
                }}
                className="absolute top-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center p-3 border border-gray-200 dark:border-gray-600 z-[1000]"
                style={{ left: '60px' }}
                title="Fit map to show all places"
              >
                <Maximize2 size={18} />
              </motion.button>
            )}
            
            {/* Route Editor Toggle */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRouteEditorOpen(true)}
              style={{
                background: 'linear-gradient(to right, #f97316, #ef4444)',
              }}
              className="absolute bottom-20 right-6 text-white p-2 rounded-lg shadow-xl transition-all duration-200 z-[1000] flex items-center gap-1.5 text-xs font-semibold border-2 border-white/20"
              title="Edit route details"
            >
              <Navigation size={16} />
              Route Details
            </motion.button>

            {/* Show Transport on Map Toggle - Circular button to left of chatbot */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTransportOnMap(!showTransportOnMap)}
              className="fixed bottom-6 right-[85px] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-[9997] flex items-center justify-center"
              style={{
                width: '48px',
                height: '48px',
                padding: 0,
                borderRadius: '50%',
                background: '#00bea4',
                border: '2px solid white',
                boxSizing: 'border-box',
              }}
              title={showTransportOnMap ? 'Hide transport info' : 'Show transport info'}
            >
              <div className="relative flex items-center justify-center">
                <span className="text-2xl relative z-10">🚂</span>
                {/* Train fumes/smoke effect */}
                <div className="absolute -top-1.5 -left-1 flex gap-0.5 opacity-60">
                  <span className="text-base">💨</span>
                </div>
                <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-50">
                  <span className="text-xs">💨</span>
                  <span className="text-[10px]">💨</span>
                </div>
              </div>
            </motion.button>
          </>
        )}
      </div>

      {/* Add Place Modal */}
      <AnimatePresence>
        {appState.isAddPlaceModalOpen && selectedTrip && (
          <PlacePopup
            key="create-place"
            mode="create"
            tripColor={selectedTrip.color}
            tripName={selectedTrip.name}
            sidebarWidth={sidebarWidth}
            onClose={() => setAppState(prev => ({ ...prev, isAddPlaceModalOpen: false }))}
            onCreate={(placeData) => handleAddPlace(placeData)}
          />
        )}
      </AnimatePresence>

      {/* View/Edit Place Modal */}
      <AnimatePresence>
        {viewingPlaceId && selectedTrip && (() => {
          const viewingPlace = selectedTrip.places.find(p => p.id === viewingPlaceId);
          return viewingPlace ? (
            <PlacePopup
              key={`view-${viewingPlaceId}`}
              place={viewingPlace}
              mode="edit"
              tripColor={selectedTrip.color}
              tripName={selectedTrip.name}
              sidebarWidth={sidebarWidth}
              onClose={() => {
                setViewingPlaceId(null);
                setSelectedPlaceId(null);
              }}
              onDelete={() => {
                handleDeletePlace(viewingPlace.id);
                setViewingPlaceId(null);
                setSelectedPlaceId(null);
              }}
              onUpdate={(updates) => {
                handleUpdatePlaceDetails(viewingPlace.id, updates);
              }}
            />
          ) : null;
        })()}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {isImageModalOpen && selectedImage && (
          <ImageModal
            place={selectedImage.place}
            image={selectedImage.image}
            onClose={() => {
              setIsImageModalOpen(false);
              setSelectedImage(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Route Editor Modal */}
      {isRouteEditorOpen && selectedTrip && (
        <RouteEditor
          trip={selectedTrip}
          onClose={() => setIsRouteEditorOpen(false)}
          onUpdatePlace={handleUpdatePlace}
        />
      )}

      {/* Travel Chatbot */}
      <TravelChatbot 
        sidebarWidth={sidebarWidth}
        isPlacePopupOpen={!!viewingPlaceId || appState.isAddPlaceModalOpen || isAuthModalOpen}
      />
    </div>
  );
}

export default App;
