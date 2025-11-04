import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Camera } from 'lucide-react';
import type { Place } from '../types';

interface AddPlaceFormProps {
  tripColor: string;
  onClose: () => void;
  onAddPlace: (placeData: Omit<Place, 'id' | 'createdAt'>) => void;
}

const AddPlaceForm: React.FC<AddPlaceFormProps> = ({
  tripColor,
  onClose,
  onAddPlace,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    coords: [0, 0] as [number, number],
    description: '',
    image: '',
    isIntermediate: false,
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when form opens
  useEffect(() => {
    // Small delay to ensure the modal is fully rendered
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Debounced place search using OpenStreetMap Nominatim (no API key required)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6`,
          {
            headers: { 'Accept': 'application/json' },
            signal: ctrl.signal,
          }
        );
        if (!res.ok) throw new Error('Search failed');
        const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
        setSuggestions(data);
      } catch (_) {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [searchQuery]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, image: result }));
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.coords[0] !== 0 && formData.coords[1] !== 0) {
      onAddPlace({
        name: formData.name.trim(),
        coords: formData.coords,
        description: formData.description || undefined,
        image: formData.image || undefined,
        isIntermediate: formData.isIntermediate,
      });
    }
  };


  return (
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
        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Header with gradient accent */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full shadow-lg ring-2 ring-white dark:ring-gray-800"
                style={{ backgroundColor: tripColor }}
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add New Place</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fill in the details below</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Close form"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Place Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Search Place
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 block mt-0.5">Auto-fills name and coordinates</span>
            </label>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setHighlightIndex(-1); }}
                onKeyDown={(e) => {
                  if (!suggestions.length) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightIndex(i => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const idx = highlightIndex === -1 ? 0 : highlightIndex;
                    const s = suggestions[idx];
                    if (s) {
                      const lat = parseFloat(s.lat);
                      const lon = parseFloat(s.lon);
                      setFormData(prev => ({ ...prev, name: prev.name || s.display_name.split(',')[0], coords: [lat, lon] }));
                      setSearchQuery(s.display_name.split(',')[0]);
                      setSuggestions([]);
                      setHighlightIndex(-1);
                    }
                  }
                }}
                placeholder="Type at least 3 characters... e.g., Kochi"
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 transition-all"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
              {suggestions.length > 0 && (
                <div className="absolute z-50 mt-2 w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl max-h-60 overflow-auto backdrop-blur-sm">
                  {suggestions.map((s, idx) => (
                    <button
                      type="button"
                      key={`${s.display_name}-${idx}`}
                      onClick={() => {
                        const lat = parseFloat(s.lat);
                        const lon = parseFloat(s.lon);
                        setFormData(prev => ({ ...prev, name: prev.name || s.display_name.split(',')[0], coords: [lat, lon] }));
                        setSearchQuery(s.display_name.split(',')[0]);
                        setSuggestions([]);
                      }}
                      className={`block w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-200 transition-colors ${highlightIndex === idx ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      {s.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Place Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Place Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 transition-all"
              placeholder="Enter place name..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 transition-all resize-none"
              rows={3}
              placeholder="Add a description..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Image
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center bg-gray-50 dark:bg-gray-800/50 hover:border-primary-400 dark:hover:border-primary-600 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {isUploadingImage ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                ) : formData.image ? (
                  <div className="space-y-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg mx-auto"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-300">Click to change image</p>
                  </div>
                ) : (
                  <>
                    <Camera size={24} className="text-gray-400 dark:text-gray-500" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Click to upload image</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">or drag and drop</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2 pb-2 border-t border-gray-200 dark:border-gray-700 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl transition-all font-medium border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 p-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
              style={{ backgroundColor: tripColor }}
            >
              Add Place
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddPlaceForm;
