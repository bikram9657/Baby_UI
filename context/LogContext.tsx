import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

const ASYNC_STORAGE_KEY = '@NurtureTrack:entries_v1';

// --- Interfaces ---
interface ProcessedLogData {
  babyName: string | null;
  event: string | null;
  time: string | null;
  details: Record<string, any>;
  originalTranscription: string | null;
  promptForDetails?: string[] | null;
  error?: string;
}

export interface SavedLogEntry extends ProcessedLogData {
  id: string;
  savedAt: number;
}

// --- Context Shape ---
interface LogContextType {
  allEntries: SavedLogEntry[];
  isLoadingEntries: boolean;
  loadEntries: () => Promise<void>;
  saveEntry: (entryData: ProcessedLogData) => Promise<SavedLogEntry | null>;
  deleteEntry: (id: string) => Promise<void>;
  clearAllEntries: () => Promise<void>;
  updateEntryDetails: (id: string, newDetails: Record<string, any>) => Promise<void>;
  // *** NEW: Function to get latest time for a specific event ***
  getLatestEntryTime: (eventType: string | string[]) => string | null;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

// --- Provider Component ---
interface LogProviderProps {
  children: ReactNode;
}

export const LogProvider: React.FC<LogProviderProps> = ({ children }) => {
  const [allEntries, setAllEntries] = useState<SavedLogEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load entries on initial mount
  const loadEntries = useCallback(async () => {
    // ... (loadEntries implementation remains the same) ...
    console.log('LogContext: Loading entries...');
    setIsLoadingEntries(true);
    setError(null);
    try {
      const jsonValue = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      const loadedEntries = jsonValue != null ? JSON.parse(jsonValue) : [];
      // Ensure sorting happens here
      loadedEntries.sort((a: SavedLogEntry, b: SavedLogEntry) => b.savedAt - a.savedAt);
      setAllEntries(loadedEntries);
      console.log('LogContext: Loaded entries:', loadedEntries.length);
    } catch (e) {
      console.error('LogContext: Failed to load entries from AsyncStorage', e);
      setError('Could not load saved entries.');
      Speech.speak('Error loading saved data.');
    } finally {
      setIsLoadingEntries(false);
    }
  }, []); // Empty dependency array

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Save a new entry
  const saveEntry = async (entryData: ProcessedLogData): Promise<SavedLogEntry | null> => {
    // ... (saveEntry implementation remains the same) ...
    const newEntry: SavedLogEntry = {
      ...entryData,
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      savedAt: Date.now(),
    };
    console.log('LogContext: Saving entry:', newEntry);
    setError(null);
    const originalEntries = [...allEntries];
    try {
      const updatedEntries = [newEntry, ...allEntries];
      updatedEntries.sort((a, b) => b.savedAt - a.savedAt); // Keep sorted
      setAllEntries(updatedEntries); // Optimistic update
      const jsonValue = JSON.stringify(updatedEntries);
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, jsonValue);
      console.log('LogContext: Entry saved successfully!');
      Speech.speak("Data entered Successfully.");
      return newEntry;
    } catch (e) {
      console.error('LogContext: Failed to save entry to AsyncStorage', e);
      setError('Failed to save the entry. Please try again.');
      Speech.speak("Error saving data.");
      setAllEntries(originalEntries); // Revert
      return null;
    }
  };

   // Delete an entry
   const deleteEntry = async (id: string) => {
     // ... (implementation remains the same) ...
     console.log('LogContext: Deleting entry:', id);
     setError(null);
     const originalEntries = [...allEntries];
     try {
       const updatedEntries = allEntries.filter(entry => entry.id !== id);
       setAllEntries(updatedEntries);
       const jsonValue = JSON.stringify(updatedEntries);
       await AsyncStorage.setItem(ASYNC_STORAGE_KEY, jsonValue);
       console.log('LogContext: Entry deleted successfully!');
     } catch (e) {
       console.error('LogContext: Failed to delete entry from AsyncStorage', e);
       setError('Failed to delete the entry.');
       Speech.speak("Error deleting entry.");
       setAllEntries(originalEntries);
     }
   };

   // Clear all entries
   const clearAllEntries = async () => {
     // ... (implementation remains the same) ...
      console.log('LogContext: Clearing all entries...');
      setError(null);
      try {
        await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
        setAllEntries([]);
        console.log('LogContext: All entries cleared successfully!');
        Speech.speak("All logs cleared.");
      } catch (e) {
        console.error('LogContext: Failed to clear entries from AsyncStorage', e);
        setError('Failed to clear entries.');
        Speech.speak("Error clearing logs.");
      }
   };

   // Update entry details
   const updateEntryDetails = async (id: string, newDetails: Record<string, any>) => {
       // ... (implementation remains the same) ...
        console.log(`LogContext: Updating details for entry ${id}`, newDetails);
        setError(null);
        const originalEntries = [...allEntries];
        try {
            const updatedEntries = allEntries.map(entry => {
                if (entry.id === id) {
                    return { ...entry, details: { ...entry.details, ...newDetails } };
                }
                return entry;
            });
            setAllEntries(updatedEntries);
            const jsonValue = JSON.stringify(updatedEntries);
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, jsonValue);
            console.log('LogContext: Entry details updated successfully!');
        } catch (e) {
            console.error('LogContext: Failed to update entry details in AsyncStorage', e);
            setError('Failed to update details.');
            Speech.speak("Error updating details.");
            setAllEntries(originalEntries);
        }
   };

   // *** NEW: Function to get the time of the latest entry for specific event(s) ***
   const getLatestEntryTime = useCallback((eventType: string | string[]): string | null => {
        const eventTypes = Array.isArray(eventType) ? eventType : [eventType];
        // Assumes allEntries is sorted newest first
        const latestEntry = allEntries.find(entry => eventTypes.includes(entry.event ?? ''));
        if (latestEntry) {
            // Prefer the AI-parsed time, fallback to saved time
            return latestEntry.time || new Date(latestEntry.savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        }
        return null; // Return null if no matching entry found
   }, [allEntries]); // Recalculate when entries change


  // Value provided by the context
  const value: LogContextType = {
    allEntries,
    isLoadingEntries,
    loadEntries,
    saveEntry,
    deleteEntry,
    clearAllEntries,
    updateEntryDetails,
    getLatestEntryTime, // Expose the new function
    // Note: lastPoopTime state is removed, get it via getLatestEntryTime('diaper change') if needed
  };

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
};

// Custom Hook to use the Context
export const useLogContext = (): LogContextType => {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error('useLogContext must be used within a LogProvider');
  }
  return context;
};
