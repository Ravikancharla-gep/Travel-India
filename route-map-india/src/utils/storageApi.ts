// API-based storage utilities for persisting trip data to MongoDB
import type { AppState } from '../types';
import { authUtils } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const storageUtils = {
  // Save entire app state to server
  saveAppState: async (appState: AppState): Promise<void> => {
    try {
      const dataToSave = {
        tripLists: appState.tripLists,
        selectedTripId: appState.selectedTripId,
        mapState: appState.mapState,
      };

      const response = await fetch(`${API_BASE_URL}/app-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authUtils.getAuthHeader(),
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`);
      }

      const sizeInMB = new Blob([JSON.stringify(dataToSave)]).size / (1024 * 1024);
      console.log('Data saved successfully to server', {
        tripListsCount: appState.tripLists.length,
        selectedTripId: appState.selectedTripId,
        sizeInMB: sizeInMB.toFixed(2),
      });
    } catch (error) {
      console.error('Failed to save app state to server:', error);
      // Fallback to localStorage if server is unavailable
      try {
        const dataToSave = {
          tripLists: appState.tripLists,
          selectedTripId: appState.selectedTripId,
          mapState: appState.mapState,
        };
        localStorage.setItem('route-map-india-data', JSON.stringify(dataToSave));
        console.log('Fell back to localStorage');
      } catch (localError) {
        console.error('Failed to save to localStorage as fallback:', localError);
        throw error; // Re-throw original error
      }
    }
  },

  // Load entire app state from server
  loadAppState: async (): Promise<Partial<AppState>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/app-state`, {
        headers: {
          ...authUtils.getAuthHeader(),
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, return empty state
          return {};
        }
        throw new Error(`Failed to load: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('Loaded from server:', {
        tripListsCount: data.tripLists?.length || 0,
        selectedTripId: data.selectedTripId,
        hasMapState: !!data.mapState,
      });

      // Handle backward compatibility
      if (Array.isArray(data)) {
        console.log('Detected old format (array), converting to new format');
        return {
          tripLists: data,
          selectedTripId: data[0]?.id || null,
          mapState: {
            center: [20.5937, 78.9629],
            zoom: 6,
          },
        };
      }

      return data;
    } catch (error) {
      console.error('Failed to load app state from server:', error);
      
      // Fallback to localStorage
      try {
        const localData = localStorage.getItem('route-map-india-data');
        if (localData) {
          const parsed = JSON.parse(localData);
          console.log('Loaded from localStorage (fallback)');
          
          // Handle backward compatibility
          if (Array.isArray(parsed)) {
            return {
              tripLists: parsed,
              selectedTripId: parsed[0]?.id || null,
              mapState: {
                center: [20.5937, 78.9629],
                zoom: 6,
              },
            };
          }
          
          return parsed;
        }
      } catch (localError) {
        console.error('Failed to load from localStorage:', localError);
      }
      
      return {};
    }
  },

  // Clear all data (localStorage fallback)
  clearAllData: (): void => {
    try {
      localStorage.removeItem('route-map-india-data');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  },
};

