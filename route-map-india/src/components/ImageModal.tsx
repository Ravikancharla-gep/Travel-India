import React from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Clock, Route, Calendar } from 'lucide-react';
import type { Place } from '../types';

interface ImageModalProps {
  place: Place;
  image: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  place,
  image,
  onClose,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{place.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Close image modal"
              aria-label="Close image modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Image */}
          <div className="flex-1 p-6">
            <img
              src={image}
              alt={place.name}
              className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
            />
          </div>

          {/* Details */}
          <div className="w-full lg:w-80 p-6 bg-gray-50 dark:bg-gray-800 space-y-4">
            {/* Description */}
            {place.description && (
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {place.description}
                </p>
              </div>
            )}

            {/* Travel Information */}
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Travel Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Route size={14} className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-200">
                    Transport: <span className="font-medium">{place.transport}</span>
                  </span>
                </div>

                {place.distance && (
                  <div className="flex items-center gap-2 text-sm">
                    <Route size={14} className="text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-200">
                      Distance: <span className="font-medium">{place.distance}</span>
                    </span>
                  </div>
                )}

                {place.time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-200">
                      Travel Time: <span className="font-medium">{place.time}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Location</h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div>Latitude: {place.coords[0].toFixed(6)}</div>
                <div>Longitude: {place.coords[1].toFixed(6)}</div>
              </div>
            </div>

            {/* Date Added */}
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Date Added</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Calendar size={14} />
                <span>{formatDate(place.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImageModal;
