import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, ArrowRight } from 'lucide-react';
import type { TransportMode, TripList } from '../types';

interface RouteEditorProps {
  trip: TripList;
  onClose: () => void;
  onUpdatePlace: (placeId: string, updates: { transport?: TransportMode; distance?: string; time?: string }) => void;
}

const TRANSPORT_MODES: TransportMode[] = [
  'Bus', 'Train', 'Car', 'Flight', 'Bike', 'Walk', 'Boat', 'Other'
];

const RouteEditor: React.FC<RouteEditorProps> = ({ trip, onClose, onUpdatePlace }) => {
  // Only show non-intermediate places for route editing
  const numberedPlaces = trip.places.filter(p => !p.isIntermediate);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full shadow-lg ring-2 ring-white dark:ring-gray-800"
                  style={{ backgroundColor: trip.color }}
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Route Details</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Set transport, time & distance between places</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-all text-sm font-medium"
                  title="Done"
                >
                  Done
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  title="Close editor"
                  aria-label="Close editor"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Horizontal Scrollable Route */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex items-center">
            {numberedPlaces.length === 0 ? (
              <div className="w-full text-center py-12">
                <Navigation size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No places to show route details</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Add some places to your trip to see route information</p>
              </div>
            ) : (
              <div className="flex items-center gap-4 min-w-max">
                {numberedPlaces.map((place, index) => (
                <React.Fragment key={place.id}>
                  {/* Place Card */}
                  <div className="flex-shrink-0 w-72">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-base font-bold text-gray-700 dark:text-gray-200">
                          {place.assignedNumber}
                        </span>
                        <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">{place.name}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Route Segment Editor (between places) */}
                  {index < numberedPlaces.length - 1 && (
                    <>
                      {/* Arrow between Place and Route Segment */}
                      <ArrowRight size={32} className="text-purple-500 dark:text-purple-400 flex-shrink-0" />
                      
                      <div className="flex-shrink-0 w-80">
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
                          <div className="flex items-center gap-2 mb-4">
                            <Navigation size={20} className="text-purple-600 dark:text-purple-400" />
                            <h4 className="font-semibold text-base text-purple-900 dark:text-purple-200">
                              {place.assignedNumber} → {numberedPlaces[index + 1].assignedNumber}
                            </h4>
                          </div>

                          {/* Transport Mode */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Transport Mode
                            </label>
                            <select
                              value={numberedPlaces[index + 1].transport || 'Car'}
                              onChange={(e) => onUpdatePlace(numberedPlaces[index + 1].id, { transport: e.target.value as TransportMode })}
                              className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              title="Select transport mode"
                              aria-label="Transport mode"
                            >
                              {TRANSPORT_MODES.map(mode => (
                                <option key={mode} value={mode}>{mode}</option>
                              ))}
                            </select>
                          </div>

                          {/* Distance and Time */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Distance
                              </label>
                              <input
                                type="text"
                                value={numberedPlaces[index + 1].distance || ''}
                                onChange={(e) => onUpdatePlace(numberedPlaces[index + 1].id, { distance: e.target.value })}
                              className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              placeholder="e.g., 120 km"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Time
                            </label>
                            <input
                              type="text"
                              value={numberedPlaces[index + 1].time || ''}
                              onChange={(e) => onUpdatePlace(numberedPlaces[index + 1].id, { time: e.target.value })}
                              className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                placeholder="e.g., 4 hrs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Arrow after Route Segment */}
                      <ArrowRight size={32} className="text-purple-500 dark:text-purple-400 flex-shrink-0" />
                    </>
                  )}
                </React.Fragment>
              ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RouteEditor;

