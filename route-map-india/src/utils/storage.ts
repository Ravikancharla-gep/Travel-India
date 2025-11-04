// LocalStorage utilities for persisting trip data
import type { TripList, AppState } from '../types';

const STORAGE_KEY = 'route-map-india-data';

export const storageUtils = {
  // Save trip lists to localStorage
  saveTripLists: (tripLists: TripList[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tripLists));
    } catch (error) {
      console.error('Failed to save trip lists:', error);
    }
  },

  // Load trip lists from localStorage
  loadTripLists: (): TripList[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load trip lists:', error);
    }
    return [];
  },

  // Save entire app state
  saveAppState: (appState: AppState): void => {
    try {
      const dataToSave = {
        tripLists: appState.tripLists,
        selectedTripId: appState.selectedTripId,
        mapState: appState.mapState,
      };
      const jsonString = JSON.stringify(dataToSave);
      const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
      
      // Warn if data is getting large (localStorage limit is usually 5-10MB)
      if (sizeInMB > 4) {
        console.warn(`Data size is ${sizeInMB.toFixed(2)}MB. localStorage limit is typically 5-10MB.`);
      }
      
      localStorage.setItem(STORAGE_KEY, jsonString);
      console.log('Data saved successfully to localStorage', {
        tripListsCount: appState.tripLists.length,
        selectedTripId: appState.selectedTripId,
        sizeInMB: sizeInMB.toFixed(2),
      });
      
      // Verify it was saved
      const verify = localStorage.getItem(STORAGE_KEY);
      if (!verify || verify !== jsonString) {
        console.error('Save verification failed! Data might not be persisted.');
      } else {
        console.log('Save verified - data is in localStorage');
      }
    } catch (error: any) {
      // Re-throw to allow caller to handle quota errors
      throw error;
    }
  },

  // Load entire app state
  loadAppState: (): Partial<AppState> => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        // Handle backward compatibility: old format was just an array of tripLists
        if (Array.isArray(parsed)) {
          console.log('Detected old format (array), converting to new format');
          return {
            tripLists: parsed,
            selectedTripId: parsed[0]?.id || null,
            mapState: {
              center: [20.5937, 78.9629],
              zoom: 6,
            },
          };
        }
        
        // New format: object with tripLists, selectedTripId, mapState
        console.log('Loaded from localStorage:', {
          tripListsCount: parsed.tripLists?.length || 0,
          selectedTripId: parsed.selectedTripId,
          hasMapState: !!parsed.mapState,
        });
        return parsed;
      } else {
        console.log('No data found in localStorage');
      }
    } catch (error) {
      console.error('Failed to load app state:', error);
    }
    return {};
  },

  // Clear all data
  clearAllData: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  },
};
