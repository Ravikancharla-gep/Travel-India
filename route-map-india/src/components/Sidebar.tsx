import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit2, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import type { TripList } from '../types';
import { compressImage } from '../utils/imageCompression';

interface SidebarProps {
  tripLists: TripList[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: (tripName: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onUpdateTrip?: (tripId: string, newName: string) => void;
  onUpdateTripBackground?: (tripId: string, imageUrl: string) => void;
  onReorderTrip?: (tripId: string, targetIndex: number) => void;
  onAddPlace: () => void;
  onMovePlace?: (placeId: string, direction: 'up' | 'down') => void;
  onReorderPlace?: (placeId: string, targetIndex: number) => void;
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
  onViewPlace?: (placeId: string) => void; // For opening modal popup
  onDeletePlace?: (placeId: string) => void; // For deleting a place
  onBackToLists?: () => void;
  onTogglePlaceNumbering?: (placeId: string) => void;
  onHoverPlace?: (placeId: string | null) => void;
  onToggleShowAllTrips?: () => void;
  showAllTrips?: boolean;
  headerImages?: string[]; // User-added favorite images
  onAddHeaderImage?: (imageUrl: string) => void; // Add image to header rotation
  onDeleteHeaderImage?: (imageIndex: number) => void; // Delete image from header rotation
}

const Sidebar: React.FC<SidebarProps> = ({
  tripLists,
  selectedTripId,
  onSelectTrip,
  onCreateTrip,
  onDeleteTrip,
  onUpdateTrip,
  onUpdateTripBackground,
  onReorderTrip,
  onAddPlace,
  onReorderPlace,
  selectedPlaceId,
  onSelectPlace,
  onViewPlace,
  onDeletePlace,
  onTogglePlaceNumbering,
  onHoverPlace,
  onToggleShowAllTrips,
  showAllTrips = false,
  headerImages = [],
  onAddHeaderImage,
  onDeleteHeaderImage,
}) => {
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [selectedPlaceIdLocal, setSelectedPlaceIdLocal] = useState<string | null>(null);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [draggedTripId, setDraggedTripId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedPlaceId, setDraggedPlaceId] = useState<string | null>(null);
  const [dragOverPlaceIndex, setDragOverPlaceIndex] = useState<number | null>(null);
  const [currentBgImageIndex, setCurrentBgImageIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const rotationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dragOverTripId, setDragOverTripId] = useState<string | null>(null); // Track which trip is being dragged over for image drop
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right'); // Track slide direction for transition
  const [previousImageIndex, setPreviousImageIndex] = useState<number | null>(null); // Track previous image for transition
  
  // Combine hardcoded images with user-added header images
  const hardcodedImages = [
    '/Assets/header-images/1)HawaMahal.png',
    '/Assets/header-images/2)Jaisalmer.png',
    '/Assets/header-images/3)Kanyakumari.png',
    '/Assets/header-images/4)Kedarnath.png',
    '/Assets/header-images/5)Kerala.png',
    '/Assets/header-images/6)Kutch.png',
    '/Assets/header-images/7)Ladakh.png',
    '/Assets/header-images/8)Manali.png',
    '/Assets/header-images/9)Munnar.png',
    '/Assets/header-images/10)Rajasthan.png',
    '/Assets/header-images/11)RedFort.png',
    '/Assets/header-images/12)Rishikesh.png',
    '/Assets/header-images/13)ScubaDiving.png',
    '/Assets/header-images/14)Skiing.png',
    '/Assets/header-images/15)SkyDiving.png',
    '/Assets/header-images/16)Varanasi.png',
  ];
  
  // Use only hardcoded images (user-added images removed)
  const availableImages = hardcodedImages;
  
  // Auto-rotate through background images
  useEffect(() => {
    if (availableImages.length <= 1 || !isAutoRotating) {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
      return;
    }
    
    rotationIntervalRef.current = setInterval(() => {
      setPreviousImageIndex(currentBgImageIndex);
      setSlideDirection('right'); // Auto-rotate slides right (forward)
      setCurrentBgImageIndex((prev) => {
        if (availableImages.length === 0) return 0;
        const newIndex = (prev + 1) % availableImages.length;
        setTimeout(() => setPreviousImageIndex(null), 500); // Clear previous after animation
        return newIndex;
      });
    }, 7000); // Rotate every 7 seconds
    
    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    };
  }, [isAutoRotating, availableImages.length]);
  
  // Get current background image (ensure circular rotation)
  const getCurrentBgImage = () => {
    if (availableImages.length === 0) {
      return ''; // Return empty string if no images
    }
    // Ensure index is always within bounds (circular)
    const validIndex = ((currentBgImageIndex % availableImages.length) + availableImages.length) % availableImages.length;
    const selectedImage = availableImages[validIndex];
    // Double-check we have a valid image
    if (selectedImage && selectedImage.trim() !== '') {
      return selectedImage;
    }
    // Fallback to first valid image
    return availableImages[0] || '';
  };
  
  // Get total number of images
  const getTotalImages = () => {
    return availableImages.length;
  };
  
  // Navigate to previous image (circular) - slides left (image comes from left)
  const goToPreviousImage = () => {
    setIsAutoRotating(false); // Pause auto-rotation when user manually navigates
    setPreviousImageIndex(currentBgImageIndex);
    setSlideDirection('left'); // Slide left for previous
    setCurrentBgImageIndex((prev) => {
      if (availableImages.length === 0) return 0;
      const newIndex = (prev - 1 + availableImages.length) % availableImages.length;
      setTimeout(() => setPreviousImageIndex(null), 500); // Clear previous after animation
      return newIndex;
    });
    // Resume auto-rotation after 15 seconds of inactivity
    setTimeout(() => {
      setIsAutoRotating(true);
    }, 15000);
  };
  
  // Navigate to next image (circular) - slides right (image comes from right)
  const goToNextImage = () => {
    setIsAutoRotating(false); // Pause auto-rotation when user manually navigates
    setPreviousImageIndex(currentBgImageIndex);
    setSlideDirection('right'); // Slide right for next
    setCurrentBgImageIndex((prev) => {
      if (availableImages.length === 0) return 0;
      const newIndex = (prev + 1) % availableImages.length;
      setTimeout(() => setPreviousImageIndex(null), 500); // Clear previous after animation
      return newIndex;
    });
    // Resume auto-rotation after 15 seconds of inactivity
    setTimeout(() => {
      setIsAutoRotating(true);
    }, 15000);
  };

  // Notion-like: single scroll area; no resizer

  const handleCreateTrip = () => {
    if (newTripName.trim()) {
      onCreateTrip(newTripName.trim());
      setNewTripName('');
      setIsCreatingTrip(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 dark:text-gray-100 shadow-lg flex flex-col h-full relative z-10">
      {/* Header */}
      <div 
        className="relative p-6 border-b border-gray-200 dark:border-gray-700 overflow-hidden min-h-[180px]"
      >
        {/* Background Image - Travel India image (rotating images) */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Previous image sliding out */}
          {previousImageIndex !== null && previousImageIndex !== currentBgImageIndex && availableImages[previousImageIndex] && (
            <div
              className={`absolute inset-0 ${
                slideDirection === 'right' 
                  ? 'animate-[slideOutToLeft_0.5s_ease-in-out_forwards]' 
                  : 'animate-[slideOutToRight_0.5s_ease-in-out_forwards]'
              }`}
              style={{
                backgroundImage: `url("${availableImages[previousImageIndex]}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 1,
              }}
            />
          )}
          
          {/* Current image sliding in */}
          <div
            key={`${currentBgImageIndex}-${slideDirection}`}
            className={`absolute inset-0 ${
              slideDirection === 'right' ? 'header-image-slide-right' : 'header-image-slide-left'
            }`}
            style={{
              backgroundImage: `url("${getCurrentBgImage()}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 2,
              willChange: 'transform, opacity',
            }}
          />
          {/* Light overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent"></div>
          
          {/* Navigation buttons for images */}
          {getTotalImages() > 1 && (
            <>
              <button
                onClick={goToPreviousImage}
                className="absolute left-3 bottom-4 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full p-1.5 shadow-lg transition-all duration-200 z-20 flex items-center justify-center group"
                title="Previous image"
                aria-label="Previous image"
              >
                <ChevronLeft size={16} className="group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={goToNextImage}
                className="absolute right-3 bottom-4 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full p-1.5 shadow-lg transition-all duration-200 z-20 flex items-center justify-center group"
                title="Next image"
                aria-label="Next image"
              >
                <ChevronRight size={16} className="group-hover:scale-110 transition-transform" />
              </button>
            </>
          )}
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-wide uppercase flex items-center gap-3 whitespace-nowrap" style={{ textShadow: '2px 2px 4px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8)' }}>
            <span className="hidden">TRAVEL INDIA</span>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0"
              style={{ 
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 3px white',
                filter: 'drop-shadow(2px 2px 4px rgba(255,255,255,0.8))'
              }}
            >
              <img 
                src="/Assets/india-map-icon.png" 
                alt="India Map Icon" 
                className="w-full h-full object-contain cursor-pointer"
                style={{ transform: 'scale(1.08) translate(2px, 2px)' }}
                onClick={() => {
                  if (onToggleShowAllTrips) {
                    onToggleShowAllTrips();
                  }
                }}
                title={showAllTrips ? "Show single trip view" : "Show all trips"}
                onError={(e) => {
                  // Fallback to flag emoji if image not found
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = '<span class="text-2xl" style="font-size: 22px; line-height: 1;">🇮🇳</span>';
                  }
                }}
              />
            </div>
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Always show lists section at top */}
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Caveat Brush', cursive" }}>
            🍁 T R A V E L  
            </h2>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreatingTrip(true)}
            style={{
              background: 'linear-gradient(to right, #f97316, #ef4444)',
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white hover:opacity-70 shadow-md hover:shadow-lg transition-all duration-200"
          >
            + Add List
          </motion.button>
        </div>

        {/* Create Trip Form */}
        {isCreatingTrip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <input
              type="text"
              placeholder="Trip name..."
              value={newTripName}
              onChange={(e) => setNewTripName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTripName.trim()) {
                  e.preventDefault();
                  handleCreateTrip();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsCreatingTrip(false);
                  setNewTripName('');
                }
              }}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreateTrip}
                style={{
                  background: 'linear-gradient(to right, #f97316, #ef4444)',
                }}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-md"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreatingTrip(false);
                  setNewTripName('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-100 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Trip List Items - expand inline like Notion */}
        <div 
          className="space-y-2"
          onDragOver={(e) => {
            // Allow dropping trips in the container (but not image files)
            if (draggedTripId && !e.dataTransfer.types.includes('Files')) {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'move';
            }
          }}
          onDrop={(e) => {
            // Handle drop at the end of the list
            const sourceId = e.dataTransfer.getData('text/trip-id');
            if (sourceId && draggedTripId === sourceId && onReorderTrip) {
              e.preventDefault();
              e.stopPropagation();
              onReorderTrip(sourceId, tripLists.length);
              setDraggedTripId(null);
              setDragOverIndex(null);
            }
          }}
        >
          {tripLists.map((trip, tripIndex) => {
            const isExpanded = selectedTripId === trip.id;
            // Don't show indicator above if it's at the dragged item's current position or adjacent to it
            const draggedItemIndex = draggedTripId ? tripLists.findIndex(t => t.id === draggedTripId) : -1;
            // Only show indicator if: there's a drag in progress, it's not the dragged item itself, 
            // and we're not dropping at the dragged item's original position or the position right after it (adjacent)
            const isAtDraggedPosition = dragOverIndex === draggedItemIndex;
            const isAtAdjacentPosition = dragOverIndex === draggedItemIndex + 1;
            const showDropIndicatorAbove = draggedTripId && 
                                          draggedTripId !== trip.id && 
                                          dragOverIndex === tripIndex && 
                                          !isAtDraggedPosition && 
                                          !isAtAdjacentPosition;
            const showDropIndicatorBelow = draggedTripId && draggedTripId !== trip.id && dragOverIndex === tripIndex + 1 && tripIndex === tripLists.length - 1;
            return (
              <React.Fragment key={trip.id}>
                {/* Drop indicator - gap/space above the item */}
                {showDropIndicatorAbove && (
                  <div className="h-1 bg-purple-400 dark:bg-purple-500 rounded-full mx-2 my-1 animate-pulse" />
                )}
                <div 
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/trip-id', trip.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedTripId(trip.id);
                    e.stopPropagation();
                  }}
                  onDragEnd={(e) => {
                    setDraggedTripId(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnter={(e) => {
                    if (draggedTripId && draggedTripId !== trip.id && !e.dataTransfer.types.includes('Files')) {
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const midpoint = rect.top + rect.height / 2;
                      // Add a small deadzone (5px) around midpoint to prevent flickering
                      const deadzone = 5;
                      let targetIndex: number;
                      if (e.clientY < midpoint - deadzone) {
                        targetIndex = tripIndex;
                      } else if (e.clientY > midpoint + deadzone) {
                        targetIndex = tripIndex + 1;
                      } else {
                        // In deadzone - keep current target if set, otherwise use current position
                        targetIndex = dragOverIndex !== null ? dragOverIndex : tripIndex;
                      }
                      const clampedTarget = Math.max(0, Math.min(targetIndex, tripLists.length));
                      
                      // Only update if target changed (prevents flickering)
                      if (dragOverIndex !== clampedTarget) {
                        setDragOverIndex(clampedTarget);
                      }
                    }
                  }}
                  onDragLeave={(e) => {
                    // Only clear if we're actually leaving the element boundaries
                    // Don't clear if we're entering a child element
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX;
                    const y = e.clientY;
                    // Only clear if cursor is truly outside the element
                    if (x < rect.left - 5 || x > rect.right + 5 || y < rect.top - 5 || y > rect.bottom + 5) {
                      // Check if we're moving to another draggable item
                      const related = e.relatedTarget as HTMLElement;
                      if (!related || !related.closest('[draggable="true"]')) {
                        setDragOverIndex(null);
                      }
                    }
                  }}
                  onDragOver={(e) => {
                    // Only handle trip dragging, not image files
                    if (draggedTripId && draggedTripId !== trip.id && !e.dataTransfer.types.includes('Files')) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = 'move';
                      const rect = e.currentTarget.getBoundingClientRect();
                      const midpoint = rect.top + rect.height / 2;
                      // Add a small deadzone (5px) around midpoint to prevent flickering
                      const deadzone = 5;
                      let targetIndex: number;
                      if (e.clientY < midpoint - deadzone) {
                        targetIndex = tripIndex;
                      } else if (e.clientY > midpoint + deadzone) {
                        targetIndex = tripIndex + 1;
                      } else {
                        // In deadzone - keep current target if set, otherwise use current position
                        targetIndex = dragOverIndex !== null ? dragOverIndex : tripIndex;
                      }
                      const clampedTarget = Math.max(0, Math.min(targetIndex, tripLists.length));
                      
                      // Only update if the target actually changed (prevents flickering)
                      if (dragOverIndex !== clampedTarget) {
                        setDragOverIndex(clampedTarget);
                      }
                    }
                  }}
                  onDrop={(e) => {
                    // Only handle trip reordering, not image files
                    if (e.dataTransfer.types.includes('Files')) {
                      return; // Let image drop handler handle this
                    }
                    
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const sourceId = e.dataTransfer.getData('text/trip-id');
                    if (sourceId && draggedTripId === sourceId && onReorderTrip) {
                      // Use dragOverIndex if available (more accurate), otherwise calculate from cursor position
                      let targetIndex: number;
                      if (dragOverIndex !== null && dragOverIndex >= 0 && dragOverIndex <= tripLists.length) {
                        targetIndex = dragOverIndex;
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const midpoint = rect.top + rect.height / 2;
                        const deadzone = 5;
                        if (e.clientY < midpoint - deadzone) {
                          targetIndex = tripIndex; // Insert before this item
                        } else if (e.clientY > midpoint + deadzone) {
                          targetIndex = tripIndex + 1; // Insert after this item
                        } else {
                          targetIndex = tripIndex; // Default to before
                        }
                      }
                      targetIndex = Math.max(0, Math.min(targetIndex, tripLists.length));
                      
                      const sourceIndex = tripLists.findIndex(t => t.id === sourceId);
                      console.log('Dropping trip:', sourceId, 'from index:', sourceIndex, 'to target index:', targetIndex, '(hovered over trip at index:', tripIndex, ')');
                      onReorderTrip(sourceId, targetIndex);
                      setDraggedTripId(null);
                      setDragOverIndex(null);
                    }
                  }}
                  className="opacity-100"
                  style={{
                    cursor: draggedTripId === trip.id ? 'grabbing' : 'grab',
                  }}
                >
                {/* Trip Header */}
                <motion.div
                  whileHover={draggedPlaceId ? {} : { scale: 1.01 }}
                  onDragOver={(e) => {
                    // Handle file drag (for image drop)
                    if (e.dataTransfer.types.includes('Files')) {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverTripId(trip.id);
                    }
                  }}
                  onDragLeave={(e) => {
                    // Only clear if leaving the trip area entirely
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX;
                    const y = e.clientY;
                    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                      setDragOverTripId(null);
                    }
                  }}
                  onDrop={async (e) => {
                    // Only handle image file drops, don't interfere with trip reordering
                    if (e.dataTransfer.types.includes('Files')) {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Handle image file drop
                      const files = e.dataTransfer.files;
                      if (files.length > 0 && files[0].type.startsWith('image/') && onUpdateTripBackground) {
                        const file = files[0];
                        try {
                          const compressedDataUrl = await compressImage(file, {
                            maxWidth: 1920,
                            maxHeight: 1080,
                            quality: 0.8,
                            maxSizeKB: 500,
                          });
                          onUpdateTripBackground(trip.id, compressedDataUrl);
                        } catch (error) {
                          console.error('Failed to compress image:', error);
                          // Fallback to original
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const result = event.target?.result as string;
                            if (onUpdateTripBackground) {
                              onUpdateTripBackground(trip.id, result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                        setDragOverTripId(null);
                        return;
                      }
                      setDragOverTripId(null);
                    }
                    // For trip-id drops, let it bubble up to parent
                  }}
                  className={`p-3 rounded-lg cursor-pointer ${draggedPlaceId ? '' : 'transition-all duration-200'} relative overflow-hidden border-2 opacity-100 ${
                    trip.name.toLowerCase().includes('kerala')
                      ? isExpanded
                        ? 'border-primary-300 dark:border-primary-800'
                        : 'border-transparent'
                      : isExpanded
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-800'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
                  } ${
                    dragOverTripId === trip.id
                      ? 'ring-4 ring-blue-400 dark:ring-blue-500 border-blue-400 dark:border-blue-500'
                      : ''
                  }`}
                  onClick={() => onSelectTrip(isExpanded ? '' : trip.id)}
                >
                  {/* Background Image for trip - using img tag for better compatibility */}
                  {(() => {
                    // Get background image - check trip.backgroundImage first, then fallback to name-based defaults
                    let bgImage = trip.backgroundImage;
                    
                    if (!bgImage) {
                      // Default images based on trip name
                      const nameLower = trip.name.toLowerCase();
                      if (nameLower.includes('kerala')) {
                        bgImage = '/Assets/header-images/5)Kerala.png';
                      } else if (nameLower.includes('gujarat') || nameLower.includes('kutch')) {
                        bgImage = '/Assets/header-images/6)Kutch.png';
                      } else if (nameLower.includes('varanasi')) {
                        bgImage = '/Assets/header-images/16)Varanasi.png';
                      }
                    }
                    
                    return bgImage ? (
                      <>
                        <img
                          src={bgImage}
                          alt={`${trip.name} background`}
                          className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-100 z-0 pointer-events-none"
                          onError={(e) => {
                            // Fallback to a test image if the original doesn't load
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format';
                            console.log('Background image not found, using fallback');
                          }}
                        />
                        {/* Overlay to ensure text is readable */}
                        <div 
                          className="absolute inset-0 bg-white/30 dark:bg-gray-800/30 z-[1] pointer-events-none rounded-lg transition-all duration-200"
                        />
                      </>
                    ) : null;
                  })()}
                  <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Drag handle (six dots) */}
                      <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 20 20" 
                        aria-hidden="true" 
                        className="text-gray-400 flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <circle cx="5" cy="5" r="1.5" fill="currentColor" />
                        <circle cx="10" cy="5" r="1.5" fill="currentColor" />
                        <circle cx="15" cy="5" r="1.5" fill="currentColor" />
                        <circle cx="5" cy="10" r="1.5" fill="currentColor" />
                        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                        <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                      </svg>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: trip.color }}
                      />
                      <div className="flex-1 min-w-0">
                        {editingTripId === trip.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => {
                              if (onUpdateTrip && editingName.trim()) {
                                onUpdateTrip(trip.id, editingName.trim());
                              }
                              setEditingTripId(null);
                              setEditingName('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (onUpdateTrip && editingName.trim()) {
                                  onUpdateTrip(trip.id, editingName.trim());
                                }
                                setEditingTripId(null);
                                setEditingName('');
                              } else if (e.key === 'Escape') {
                                setEditingTripId(null);
                                setEditingName('');
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border-2 border-purple-400 dark:border-purple-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            title="Edit trip name"
                            aria-label="Edit trip name"
                            placeholder="Enter trip name"
                            autoFocus
                          />
                        ) : (
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">{trip.name}</h3>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {editingTripId !== trip.id && (
                        <>
                          {/* Background Image Upload Button */}
                          {onUpdateTripBackground && (
                            <label
                              className={`p-1 hover:bg-white/20 dark:hover:bg-gray-700/30 text-white rounded transition-colors cursor-pointer ${
                                dragOverTripId === trip.id
                                  ? 'bg-blue-500/80 dark:bg-blue-600/80 ring-2 ring-blue-300 dark:ring-blue-400 scale-110'
                                  : ''
                              }`}
                              title={`Change background image for ${trip.name}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Camera size={16} />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                title={`Upload background image for ${trip.name}`}
                                aria-label={`Upload background image for ${trip.name}`}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file && onUpdateTripBackground) {
                                    try {
                                      const compressedDataUrl = await compressImage(file, {
                                        maxWidth: 1920,
                                        maxHeight: 1080,
                                        quality: 0.8,
                                        maxSizeKB: 500,
                                      });
                                      onUpdateTripBackground(trip.id, compressedDataUrl);
                                    } catch (error) {
                                      console.error('Failed to compress image:', error);
                                      // Fallback to original
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const result = event.target?.result as string;
                                        if (onUpdateTripBackground) {
                                          onUpdateTripBackground(trip.id, result);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                  // Reset input
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          )}
                          {/* Edit Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTripId(trip.id);
                              setEditingName(trip.name);
                            }}
                            className="p-1 hover:bg-white/20 dark:hover:bg-gray-700/30 text-white rounded transition-colors"
                            title={`Edit ${trip.name}`}
                            aria-label={`Edit ${trip.name}`}
                          >
                            <Edit2 size={16} />
                          </button>
                        </>
                      )}
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete "${trip.name}"? This action cannot be undone.`)) {
                            onDeleteTrip(trip.id);
                          }
                        }}
                        className="p-1 hover:bg-white/20 dark:hover:bg-gray-700/30 text-white rounded transition-colors"
                        title={`Delete ${trip.name}`}
                        aria-label={`Delete ${trip.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  </div>
                </motion.div>

                {/* Expanded Places - inline below the trip */}
                {isExpanded && (
                  <motion.div
                    // Animation commented out - can be re-enabled if needed later
                    // initial={{ opacity: 0, height: 0 }}
                    // animate={{ opacity: 1, height: 'auto' }}
                    // exit={{ opacity: 0, height: 0 }}
                    className="ml-6 mt-2 mb-4 pl-4 border-l-2 border-gray-300 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: trip.color }}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {trip.places.filter(p => !p.isIntermediate).length} place{trip.places.filter(p => !p.isIntermediate).length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddPlace();
                        }}
                        style={{
                          background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap flex-shrink-0"
                      >
                        + Add Place
                      </button>
                    </div>
                    
                    <div 
                      className="space-y-2"
                      onDragOver={(e) => {
                        // Allow dropping places in the container (but not image files)
                        // Only handle if NOT dragging over a place item (let items handle their own drag)
                        if (draggedPlaceId && !e.dataTransfer.types.includes('Files')) {
                          const target = e.target as HTMLElement;
                          // If we're dragging over a place item, don't interfere at all
                          if (target.closest('[draggable="true"]')) {
                            return;
                          }
                          // Only handle empty space at the bottom - don't interfere with upward drags
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'move';
                          // Only set to end if truly in empty space at the bottom
                          const rect = e.currentTarget.getBoundingClientRect();
                          const isNearBottom = e.clientY > rect.bottom - 20;
                          if (isNearBottom) {
                            setDragOverPlaceIndex(trip.places.length);
                          }
                          // Don't clear dragOverPlaceIndex when dragging over container
                          // Let the item's onDragOver/onDragEnter handle it
                        }
                      }}
                      onDrop={(e) => {
                        // Handle drop at the end of the list - only if not dropped on an item
                        const target = e.target as HTMLElement;
                        if (target.closest('[draggable="true"]')) {
                          return; // Let the item handle it
                        }
                        const sourceId = e.dataTransfer.getData('text/place-id');
                        if (sourceId && draggedPlaceId === sourceId && onReorderPlace && !e.dataTransfer.types.includes('Files')) {
                          e.preventDefault();
                          e.stopPropagation();
                          onReorderPlace(sourceId, trip.places.length);
                          setDraggedPlaceId(null);
                          setDragOverPlaceIndex(null);
                        }
                      }}
                    >
                      {trip.places.map((place, index) => {
                        // If intermediate, don't show number even if assignedNumber exists
                        const displayNumber = place.isIntermediate ? undefined : place.assignedNumber;
                        // Don't show indicator above if it's at the dragged item's current position or adjacent to it
                        const draggedPlaceItemIndex = draggedPlaceId ? trip.places.findIndex(p => p.id === draggedPlaceId) : -1;
                        const isAtDraggedPosition = dragOverPlaceIndex === draggedPlaceItemIndex;
                        const isAtAdjacentPosition = dragOverPlaceIndex === draggedPlaceItemIndex + 1;
                        const showDropIndicatorAbove = draggedPlaceId && 
                                                      draggedPlaceId !== place.id && 
                                                      dragOverPlaceIndex === index && 
                                                      !isAtDraggedPosition && 
                                                      !isAtAdjacentPosition;
                        
                        return (
                        <React.Fragment key={place.id}>
                          {/* Drop indicator - gap/space above the place item */}
                          {showDropIndicatorAbove && (
                            <div className="h-0.5 bg-purple-400 dark:bg-purple-500 rounded-full mx-4 my-1 animate-pulse" />
                          )}
                          <div
                            className="flex items-center justify-between gap-2 text-sm opacity-100"
                            style={{
                              cursor: draggedPlaceId === place.id ? 'grabbing' : 'grab',
                            }}
                            draggable={true}
                            onDragStart={(e) => {
                              // Set drag data immediately
                              e.dataTransfer.setData('text/place-id', place.id);
                              e.dataTransfer.effectAllowed = 'move';
                              
                              // Set dragged state immediately
                              setDraggedPlaceId(place.id);
                              
                              // Don't stop propagation - allow native drag to work
                            }}
                            onDragEnd={(e) => {
                              setDraggedPlaceId(null);
                              setDragOverPlaceIndex(null);
                              e.stopPropagation();
                            }}
                            onDragEnter={(e) => {
                              if (draggedPlaceId && draggedPlaceId !== place.id && !e.dataTransfer.types.includes('Files')) {
                                e.preventDefault();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const midpoint = rect.top + rect.height / 2;
                                // No deadzone - immediate response
                                // The purple line shows above this item when dragOverPlaceIndex === index
                                // If cursor is in top half, show line above this item (index)
                                // If cursor is in bottom half, show line above next item (index + 1)
                                const targetIndex = e.clientY < midpoint ? index : index + 1;
                                const clampedTarget = Math.max(0, Math.min(targetIndex, trip.places.length));
                                
                                // Update if target changed - this prevents unnecessary updates
                                if (dragOverPlaceIndex !== clampedTarget) {
                                  setDragOverPlaceIndex(clampedTarget);
                                }
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'move';
                              
                              if (!draggedPlaceId || draggedPlaceId === place.id) {
                                return;
                              }
                              
                              // Determine drop position based on cursor position relative to item midpoint
                              // No deadzone - immediate response
                              // The purple line shows above this item when dragOverPlaceIndex === index
                              const rect = e.currentTarget.getBoundingClientRect();
                              const midpoint = rect.top + rect.height / 2;
                              // If cursor is in top half, show line above this item (index)
                              // If cursor is in bottom half, show line above next item (index + 1)
                              const targetIndex = e.clientY < midpoint ? index : index + 1;
                              
                              // Clamp targetIndex to valid range
                              const clampedTarget = Math.max(0, Math.min(targetIndex, trip.places.length));
                              
                              // Update target index only if it changed - this prevents flickering
                              // The line appears when dragOverPlaceIndex === index (above this item)
                              if (dragOverPlaceIndex !== clampedTarget) {
                                setDragOverPlaceIndex(clampedTarget);
                              }
                            }}
                            onDragLeave={(e) => {
                              // Never clear dragOverPlaceIndex in onDragLeave
                              // This ensures the drop indicator line position is preserved when dragging upward
                              // The position will be updated by onDragOver/onDragEnter of the target item
                              // Only clear when actually dropping or canceling drag
                            }}
                            onDrop={(e) => {
                              // Only handle place reordering, not image files
                              if (e.dataTransfer.types.includes('Files')) {
                                return; // Let image drop handler handle this
                              }
                              
                              e.preventDefault();
                              e.stopPropagation();
                              
                              const sourceId = e.dataTransfer.getData('text/place-id');
                              if (sourceId && draggedPlaceId === sourceId && onReorderPlace) {
                                // The purple line shows when dragOverPlaceIndex === index (above that item)
                                // Use dragOverPlaceIndex directly - it matches exactly where the purple line shows
                                let targetIndex: number;
                                if (dragOverPlaceIndex !== null && dragOverPlaceIndex >= 0 && dragOverPlaceIndex <= trip.places.length) {
                                  // Use dragOverPlaceIndex - this is where the purple line is showing
                                  targetIndex = dragOverPlaceIndex;
                                } else {
                                  // Fallback: calculate from cursor position if dragOverPlaceIndex is not set
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const midpoint = rect.top + rect.height / 2;
                                  targetIndex = e.clientY < midpoint ? index : index + 1;
                                }
                                targetIndex = Math.max(0, Math.min(targetIndex, trip.places.length));
                                
                                console.log('Dropping place:', sourceId, 'from index:', trip.places.findIndex(p => p.id === sourceId), 'to target index:', targetIndex, '(dragOverPlaceIndex was:', dragOverPlaceIndex, ', current item index:', index, ')');
                                onReorderPlace(sourceId, targetIndex);
                                setDraggedPlaceId(null);
                                setDragOverPlaceIndex(null);
                              }
                            }}
                            onMouseEnter={() => {
                              if (onHoverPlace) {
                                onHoverPlace(place.id);
                              }
                            }}
                            onMouseLeave={() => {
                              if (onHoverPlace) {
                                onHoverPlace(null);
                              }
                            }}
                            onClick={(e) => {
                              // Don't trigger click if we just finished dragging
                              if (draggedPlaceId === place.id) {
                                return;
                              }
                              e.stopPropagation();
                              if (onSelectPlace) onSelectPlace(place.id);
                              else setSelectedPlaceIdLocal(place.id);
                              // Open modal popup when clicking place name
                              if (onViewPlace) {
                                onViewPlace(place.id);
                              }
                            }}
                          >
                          <div 
                            className="flex items-center gap-2 cursor-grab active:cursor-grabbing select-none min-w-0 flex-1"
                            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                          >
                            {/* Drag handle (six dots) */}
                            <svg 
                              width="14" 
                              height="14" 
                              viewBox="0 0 20 20" 
                              aria-hidden="true" 
                              className="text-gray-400 flex-shrink-0 cursor-grab active:cursor-grabbing"
                              style={{ userSelect: 'none', pointerEvents: 'auto' }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <circle cx="5" cy="5" r="1.5" fill="currentColor" />
                              <circle cx="10" cy="5" r="1.5" fill="currentColor" />
                              <circle cx="15" cy="5" r="1.5" fill="currentColor" />
                              <circle cx="5" cy="10" r="1.5" fill="currentColor" />
                              <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                              <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                            </svg>
                            {/* Number badge or dot for intermediate - clickable to toggle */}
                            {displayNumber !== undefined ? (
                              <span
                                onMouseDown={(e) => {
                                  // Prevent drag from starting when clicking the number badge
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (onTogglePlaceNumbering) {
                                    onTogglePlaceNumbering(place.id);
                                  }
                                }}
                                className="w-6 h-6 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
                                title="Click to remove number"
                                style={{ userSelect: 'none' }}
                              >
                                {displayNumber}
                              </span>
                            ) : (
                              <span
                                onMouseDown={(e) => {
                                  // Prevent drag from starting when clicking the dot
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (onTogglePlaceNumbering) {
                                    onTogglePlaceNumbering(place.id);
                                  }
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                title="Click to add number"
                                style={{ userSelect: 'none' }}
                              >
                                <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                              </span>
                            )}
                            <span 
                              className={`${(selectedPlaceId ?? selectedPlaceIdLocal) === place.id ? 'text-red-600 font-semibold' : 'text-gray-700 dark:text-gray-200'} whitespace-nowrap pointer-events-none flex-1 min-w-0`}
                              style={{ userSelect: 'none' }}
                            >
                              {place.name}
                            </span>
                          </div>
                          {/* Edit and Delete buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onViewPlace) {
                                  onViewPlace(place.id);
                                }
                              }}
                              className="p-1 hover:bg-white/20 dark:hover:bg-gray-700/30 text-white rounded transition-colors"
                              title={`Edit ${place.name}`}
                              aria-label={`Edit ${place.name}`}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete "${place.name}"?`)) {
                                  if (onDeletePlace) {
                                    onDeletePlace(place.id);
                                  }
                                }
                              }}
                              className="p-1 hover:bg-white/20 dark:hover:bg-gray-700/30 text-white rounded transition-colors"
                              title={`Delete ${place.name}`}
                              aria-label={`Delete ${place.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        </React.Fragment>
                        );
                      })}
                      {/* Drop indicator at the end if dragging to last position */}
                      {draggedPlaceId && dragOverPlaceIndex !== null && dragOverPlaceIndex === trip.places.length && (
                        <div className="h-0.5 bg-purple-400 dark:bg-purple-500 rounded-full mx-4 my-1 animate-pulse" />
                      )}
                    </div>
                  </motion.div>
                )}
                </div>
              </React.Fragment>
            );
          })}
          {/* Drop indicator at the end if dragging to last position */}
          {draggedTripId && dragOverIndex === tripLists.length && (
            <div className="h-1 bg-purple-400 dark:bg-purple-500 rounded-full mx-2 my-1 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
