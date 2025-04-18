// START OF FILE - nurturetrack_log_context_v1

import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
dayjs.extend(isToday);

const ASYNC_STORAGE_KEY = '@NurtureTrack:entries_v1';

// --- Interfaces ---
interface ProcessedLogData {
    babyName: string | null;
    event: string | null;
    time: string | null; // Should now be specific time string from backend
    details: Record<string, any>; // May include milkType now
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
    getLatestEntryTime: (eventType: string | string[]) => string | null;
    calculateDailyTotalsDebug: () => void; // Expose debug function
}

const LogContext = createContext<LogContextType | undefined>(undefined);

// --- Provider Component ---
interface LogProviderProps { children: ReactNode; }

export const LogProvider: React.FC<LogProviderProps> = ({ children }) => {
    const [allEntries, setAllEntries] = useState<SavedLogEntry[]>([]);
    const [isLoadingEntries, setIsLoadingEntries] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- DEBUGGING: Enhanced calculateDailyTotals logging ---
    // Note: This function is primarily for adding console logs.
    // The actual calculation for display should happen in the component using useMemo.
    const calculateDailyTotalsDebug = useCallback(() => {
        console.log('\n--- DEBUG: Calculating Daily Totals ---');
        const todayEntries = allEntries.filter(entry => {
            const isTodayResult = dayjs(entry.savedAt).isToday();
            // console.log(`Entry ${entry.id} savedAt ${new Date(entry.savedAt).toISOString()}, isToday: ${isTodayResult}`); // Optional detailed log
            return isTodayResult;
        });
        console.log(`DEBUG: Found ${todayEntries.length} entries saved today.`);
        if (todayEntries.length === 0) {
            console.log('DEBUG: No entries found for today to calculate totals.');
            console.log('--- END DEBUG ---');
            return;
        }
        let totalBottleMl = 0; let totalPumpMl = 0; // Keep pump total for debugging calculation
        let breastSessionCount = 0; // Count breast sessions

        todayEntries.forEach(entry => {
            console.log(`\nDEBUG: Processing entry ID: ${entry.id}`);
            console.log(`  Event: ${entry.event}, Type: ${entry.details?.type}, Time: ${entry.time}, SavedAt: ${new Date(entry.savedAt).toLocaleTimeString()}`);
            console.log(`  Details:`, JSON.stringify(entry.details));

            // Check only feed/pump events for amount calculation
            if (entry.event === 'feed' || entry.event === 'pump') {
                // Amount calculation for bottle/pump
                if (entry.details && typeof entry.details.amount === 'string') {
                    const amountString = entry.details.amount.replace(/[^0-9.]/g, '');
                    const amount = parseFloat(amountString);
                    console.log(`  Amount string found: "${entry.details.amount}", Parsed number: ${amount}`);
                    if (!isNaN(amount)) {
                        let amountMl = amount;
                        const unit = entry.details.unit?.toLowerCase() || '';
                        console.log(`  Unit found: "${unit}"`);
                        if (unit.includes('oz')) { amountMl *= 29.5735; console.log(`  Converted "${amount} ${unit}" to ~${amountMl.toFixed(1)} ml`); }
                        else { console.log(`  Using amount as ml: ${amountMl}`); }

                        // Add to totals based on event/type
                        if (entry.event === 'feed' && entry.details.type === 'bottle') {
                            totalBottleMl += amountMl; console.log(`  ✅ Added to BOTTLE total. New total: ${totalBottleMl.toFixed(1)} ml`);
                        } else if (entry.event === 'pump') {
                            totalPumpMl += amountMl; console.log(`  ✅ Added to PUMP total. New total: ${totalPumpMl.toFixed(1)} ml`);
                        } else {
                            console.log(`  Amount found but not bottle/pump relevant for these totals.`);
                        }
                    } else { console.warn(`  ⚠️ Could not parse amount: "${entry.details.amount}"`); }
                } else { console.log(`  ℹ️ No amount string found in details.`); }

                // Count breast sessions
                if (entry.event === 'feed' && entry.details?.type === 'breast') {
                    breastSessionCount++;
                    console.log(`  ✅ Counted BREAST session. New count: ${breastSessionCount}`);
                }

            } else { console.log(`  Skipping entry (not feed/pump) for summary calculation.`); }
        });
        console.log(`\nDEBUG: Final Totals - Bottle: ${totalBottleMl.toFixed(1)} ml, Pump: ${totalPumpMl.toFixed(1)} ml, Breast Sessions: ${breastSessionCount}`);
        console.log('--- END DEBUG ---\n');
    }, [allEntries]); // Recalculate when entries change

    // Load entries
    const loadEntries = useCallback(async () => {
        setIsLoadingEntries(true); setError(null);
        try {
            const jsonValue = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
            const loadedEntries = jsonValue != null ? JSON.parse(jsonValue) : [];
            loadedEntries.sort((a: SavedLogEntry, b: SavedLogEntry) => b.savedAt - a.savedAt);
            setAllEntries(loadedEntries);
            console.log('LogContext: Loaded entries:', loadedEntries.length);
            // Optional: Run debug calc after loading
            // calculateDailyTotalsDebug(); // Keep commented unless needed on initial load
        } catch (e: any) { // Catch any error
            console.error('LogContext: Failed to load entries from AsyncStorage', e);
            setError('Could not load saved entries.');
            Speech.speak('Error loading saved data.');
        }
        finally { setIsLoadingEntries(false); }
    }, [/* calculateDailyTotalsDebug */]); // Remove calculateDailyTotalsDebug if not called here

    useEffect(() => { loadEntries(); }, [loadEntries]);

    // Save entry
    const saveEntry = async (entryData: ProcessedLogData): Promise<SavedLogEntry | null> => {
        const newEntry: SavedLogEntry = {
            ...entryData,
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            savedAt: Date.now(),
        };
        console.log('LogContext: Saving entry:', newEntry); setError(null);
        const originalEntries = [...allEntries];
        try {
            const updatedEntries = [newEntry, ...allEntries];
            updatedEntries.sort((a, b) => b.savedAt - a.savedAt);
            setAllEntries(updatedEntries);
            // *** UNCOMMENT THIS LINE FOR DEBUGGING SUMMARY ISSUES ***
            // calculateDailyTotalsDebug(); // Call debug function
            const jsonValue = JSON.stringify(updatedEntries);
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, jsonValue);
            console.log('LogContext: Entry saved successfully!'); Speech.speak("Data entered Successfully.");
            return newEntry;
        } catch (e: any) { // Catch any error
            console.error('LogContext: Failed to save entry', e); setError('Failed to save.'); Speech.speak("Error saving data.");
            setAllEntries(originalEntries);
            // *** UNCOMMENT THIS LINE FOR DEBUGGING SUMMARY ISSUES ***
            // calculateDailyTotalsDebug(); // Call debug function
            return null;
        }
    };

    // Delete entry
    const deleteEntry = async (id: string) => {
        console.log('LogContext: Deleting entry:', id); setError(null);
        const originalEntries = [...allEntries];
        try {
            const updatedEntries = allEntries.filter(entry => entry.id !== id);
            setAllEntries(updatedEntries);
            // *** UNCOMMENT THIS LINE FOR DEBUGGING SUMMARY ISSUES ***
            // calculateDailyTotalsDebug(); // Call debug function
            const jsonValue = JSON.stringify(updatedEntries);
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, jsonValue);
            console.log('LogContext: Entry deleted successfully!');
        } catch (e: any) { // Catch any error
            console.error('LogContext: Failed to delete entry', e); setError('Failed to delete.'); Speech.speak("Error deleting entry.");
            setAllEntries(originalEntries);
            // *** UNCOMMENT THIS LINE FOR DEBUGGING SUMMARY ISSUES ***
            // calculateDailyTotalsDebug(); // Call debug function
        }
    };

    // Clear all entries
    const clearAllEntries = async () => {
        console.log('LogContext: Clearing all entries...');
        setError(null);
        try {
            await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
            setAllEntries([]);
            console.log('LogContext: All entries cleared successfully!');
            Speech.speak("All logs cleared.");
        } catch (e: any) { // Catch any error
            console.error('LogContext: Failed to clear entries from AsyncStorage', e);
            setError('Failed to clear entries.');
            Speech.speak("Error clearing logs.");
        }
    };

    // Update entry details
    const updateEntryDetails = async (id: string, newDetails: Record<string, any>) => {
        console.log(`LogContext: Updating details for entry ${id}`, newDetails);
        setError(null);
        const originalEntries = [...allEntries];
        try {
            const updatedEntries = allEntries.map(entry => {
                if (entry.id === id) {
                    // Merge new details, ensuring prompt is removed if details are added
                    const updatedEntry = {
                        ...entry,
                        details: { ...entry.details, ...newDetails },
                        promptForDetails: null // Assume prompt is resolved after manual update
                    };
                    return updatedEntry;
                }
                return entry;
            });
            setAllEntries(updatedEntries); // Optimistic update
            // Optional: Run debug calc after updating
            // calculateDailyTotalsDebug();
            const jsonValue = JSON.stringify(updatedEntries);
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, jsonValue);
            console.log('LogContext: Entry details updated successfully!');
        } catch (e: any) { // Catch any error
            console.error('LogContext: Failed to update entry details in AsyncStorage', e);
            setError('Failed to update details.');
            Speech.speak("Error updating details.");
            setAllEntries(originalEntries); // Revert optimistic update
        }
    };

    // Get latest entry time
    const getLatestEntryTime = useCallback((eventType: string | string[]): string | null => {
        const eventTypes = Array.isArray(eventType) ? eventType : [eventType];
        // Ensure allEntries is sorted newest first before finding
        const sortedEntries = [...allEntries].sort((a, b) => b.savedAt - a.savedAt);
        const latestEntry = sortedEntries.find(entry => eventTypes.includes(entry.event ?? ''));
        // Use resolved time first, fallback to saved time
        return latestEntry ? (latestEntry.time || new Date(latestEntry.savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })) : null;
    }, [allEntries]);


    // Value provided by the context
    const value: LogContextType = {
        allEntries, isLoadingEntries, loadEntries, saveEntry,
        deleteEntry, clearAllEntries, updateEntryDetails, getLatestEntryTime,
        calculateDailyTotalsDebug // Expose debug function
    };

    return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
};

// Custom Hook to use the Context
export const useLogContext = (): LogContextType => {
    const context = useContext(LogContext);
    if (context === undefined) throw new Error('useLogContext must be used within a LogProvider');
    return context;
};

// END OF FILE - nurturetrack_log_context_v1
