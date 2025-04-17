import React, { useMemo, useState } from 'react';
import { View, StyleSheet, SectionList, Alert, SafeAreaView, Pressable } from 'react-native';
import { Text, Card, ActivityIndicator, Button, Divider, Chip, List, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLogContext, SavedLogEntry } from '../context/LogContext';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
dayjs.extend(isToday);
dayjs.extend(isYesterday);

// Define font family constants
const FONT_REGULAR = 'Poppins_400Regular';
const FONT_BOLD = 'Poppins_700Bold';

// Define a purple color palette
const purplePalette = {
    primary: '#673AB7', primaryLight: '#D1C4E9', primaryDark: '#512DA8',
    accent: '#9C27B0', textPrimary: '#212121', textSecondary: '#757575',
    background: '#F3E5F5', surface: '#FFFFFF', outline: '#BDBDBD', error: '#D32F2F',
};

// --- Helper functions ---
interface GroupedEntries { title: string; data: SavedLogEntry[]; }
const groupEntriesByDate = (entries: SavedLogEntry[]): GroupedEntries[] => {
    const groups: { [key: string]: SavedLogEntry[] } = {};
    entries.forEach(entry => {
        const date = dayjs(entry.savedAt);
        let groupTitle: string;
        if (date.isToday()) groupTitle = 'Today';
        else if (date.isYesterday()) groupTitle = 'Yesterday';
        else groupTitle = date.format('MMM D, YYYY'); // Use YYYY for clarity
        if (!groups[groupTitle]) groups[groupTitle] = [];
        groups[groupTitle].push(entry);
    });
     const sortedTitles = Object.keys(groups).sort((a, b) => {
        if (a === 'Today') return -1; if (b === 'Today') return 1;
        if (a === 'Yesterday') return -1; if (b === 'Yesterday') return 1;
        // Sort remaining dates descending
        return dayjs(b, 'MMM D, YYYY').valueOf() - dayjs(a, 'MMM D, YYYY').valueOf();
    });
    return sortedTitles.map(title => ({ title, data: groups[title] }));
};

// Updated calculation function for new summary structure
const calculateDailyTotals = (entries: SavedLogEntry[]) => {
    // Using the refined logic from context debugging
    const todayEntries = entries.filter(entry => dayjs(entry.savedAt).isToday());
    let totalBottleAndPumpMl = 0; // Combined total
    let breastSessionCount = 0;

    todayEntries.forEach(entry => {
        // Amount calculation for bottle/pump
        if ((entry.event === 'feed' && entry.details?.type === 'bottle') || entry.event === 'pump') {
            if (entry.details && typeof entry.details.amount === 'string') {
                const amountString = entry.details.amount.replace(/[^0-9.]/g, '');
                const amount = parseFloat(amountString);
                if (!isNaN(amount)) {
                    let amountMl = amount;
                    const unit = entry.details.unit?.toLowerCase() || '';
                    if (unit.includes('oz')) { amountMl *= 29.5735; }
                    totalBottleAndPumpMl += amountMl;
                }
            }
        }
        // Count breast sessions
        else if (entry.event === 'feed' && entry.details?.type === 'breast') {
            breastSessionCount++;
        }
    });
    return {
        // Combined Bottle + Pump volume
        totalBottlePumpDisplay: `${totalBottleAndPumpMl.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ml`,
        // Count of breast sessions
        totalBreastSessionsDisplay: `${breastSessionCount} session${breastSessionCount !== 1 ? 's' : ''}`,
    };
};


export default function FeedLogScreen() {
  const { allEntries, isLoadingEntries, deleteEntry } = useLogContext();
  const theme = useTheme(); // Get theme for potential use
  // Updated filter state type
  const [filterType, setFilterType] = useState<'all' | 'bottle_pump' | 'breast'>('all');

  // Filter and group entries based on the updated filterType state
  const filteredAndGroupedEntries = useMemo(() => {
    // Use allEntries directly from context
    const relevantEntries = allEntries.filter(entry => entry.event === 'feed' || entry.event === 'pump');

    let filtered = relevantEntries;
    if (filterType === 'bottle_pump') {
        // Filter for bottle feeds OR pump sessions
        filtered = relevantEntries.filter(entry =>
            (entry.event === 'feed' && entry.details?.type === 'bottle') || entry.event === 'pump'
        );
    } else if (filterType === 'breast') {
        // Filter specifically for breast feeds
        filtered = relevantEntries.filter(entry => entry.event === 'feed' && entry.details?.type === 'breast');
    }
    // else filterType is 'all', use relevantEntries

    return groupEntriesByDate(filtered);
  }, [allEntries, filterType]); // Depend on context state and local filter state

  // Calculate today's totals using the updated calculation logic
  const dailyTotals = useMemo(() => calculateDailyTotals(allEntries), [allEntries]); // Depend on context state


  const confirmDeleteEntry = (id: string) => {
    Alert.alert("Delete Log?", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEntry(id) }
    ]);
  };

  // --- Render function for each feed entry item - Updated Title & Details ---
  const renderEntry = ({ item }: { item: SavedLogEntry }) => {
    // Destructure details including milkType
    const { type, amount, unit, food, duration, milkType } = item.details || {};
    const isPump = item.event === 'pump';
    // Use the RESOLVED time from backend (item.time) for the title
    const eventTime = item.time ? ` at ${item.time}` : ''; // Use resolved time
    const baseTitle = isPump ? 'Pump Session' : (type ? `${type.charAt(0).toUpperCase() + type.slice(1)} Feed` : 'Feed');
    const title = `${baseTitle}${eventTime}`; // Title includes resolved time

    let icon: keyof typeof MaterialCommunityIcons.glyphMap = "help-circle-outline";
    if (isPump) icon = "pump";
    else if (type === 'bottle') icon = "baby-bottle-outline";
    else if (type === 'breast') icon = "food-variant";
    else if (type === 'solids') icon = "food-apple-outline";

    return (
        <Card style={styles.entryCard} elevation={1}>
            <Card.Title
                title={title} // Use combined title with resolved time
                titleStyle={styles.cardTitle}
                subtitle={`Saved: ${new Date(item.savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`} // Show saved time here
                subtitleStyle={styles.cardSubtitle}
                left={(props) => <List.Icon {...props} icon={icon} color={purplePalette.primary} />}
                style={{ minHeight: 50 }}
                titleNumberOfLines={2}
            />
            <Card.Content>
                 <View style={styles.detailsContainer}>
                    {/* Display milkType if available */}
                    {milkType && (
                        <Chip icon="cup-water" /* Choose better icon */ style={styles.chip} textStyle={styles.chipText}>
                            {milkType.charAt(0).toUpperCase() + milkType.slice(1)}
                        </Chip>
                    )}
                    {amount && unit && ( <Chip icon="beaker-outline" style={styles.chip} textStyle={styles.chipText}> {amount} {unit} </Chip> )}
                    {duration && ( <Chip icon="clock-outline" style={styles.chip} textStyle={styles.chipText}> {duration} </Chip> )}
                    {food && ( <Chip icon="food-outline" style={styles.chip} textStyle={styles.chipText}> {food} </Chip> )}
                </View>
                {item.originalTranscription && (
                    <Text style={styles.transcriptionText}>
                        {item.originalTranscription.trim()}
                    </Text>
                )}
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
                <Button icon="pencil-outline" onPress={() => Alert.alert("Edit", "Not implemented yet.")} compact style={{ marginRight: 8 }} labelStyle={styles.actionButtonText} textColor={purplePalette.accent}>Edit</Button>
                <Button icon="delete-outline" onPress={() => confirmDeleteEntry(item.id)} compact mode="contained" buttonColor={purplePalette.error} labelStyle={[styles.actionButtonText, { color: '#FFFFFF' }]}>Delete</Button>
            </Card.Actions>
        </Card>
    );
   };

   // --- Render function for section headers (Unchanged) ---
   const renderSectionHeader = ({ section: { title } }: { section: GroupedEntries }) => (
        <Text variant="titleMedium" style={styles.sectionHeader}>{title}</Text>
    );

  // --- Toggle Filter Function - Updated ---
  const toggleFilter = (type: 'bottle_pump' | 'breast') => {
      setFilterType(prev => (prev === type ? 'all' : type)); // Toggle between type and 'all'
  };

  if (isLoadingEntries) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" color={purplePalette.primary}/>
        <Text style={{ marginTop: 10, fontFamily: FONT_REGULAR }}>Loading logs...</Text>
      </View>
    );
   }

  // --- Main Render - Updated Summary Card ---
  return (
    <SafeAreaView style={styles.container}>
        {/* Daily Summary Card - Updated Rows */}
        <Card style={styles.summaryCard} elevation={2}>
            <Card.Title
                title="Today's Summary"
                titleStyle={styles.summaryTitle}
                right={(props) => filterType !== 'all' ? <Button {...props} onPress={() => setFilterType('all')} compact labelStyle={{fontSize: 12, fontFamily: FONT_REGULAR}}>Show All</Button> : null}
            />
            <Card.Content>
                {/* Bottle + Pump Row - Clickable */}
                <Pressable onPress={() => toggleFilter('bottle_pump')} style={[styles.summaryRow, filterType === 'bottle_pump' && styles.summaryRowActive]}>
                    <MaterialCommunityIcons name="baby-bottle-outline" size={24} color={purplePalette.primary} />
                    {/* Updated Label */}
                    <Text style={styles.summaryText}>Bottle/Pump Total: {dailyTotals.totalBottlePumpDisplay}</Text>
                </Pressable>
                 {/* Breast Row - Clickable */}
                <Pressable onPress={() => toggleFilter('breast')} style={[styles.summaryRow, filterType === 'breast' && styles.summaryRowActive]}>
                    <MaterialCommunityIcons name="food-variant" /* Breast icon */ size={24} color={purplePalette.accent} />
                     {/* Updated Label */}
                    <Text style={styles.summaryText}>Breast Total: {dailyTotals.totalBreastSessionsDisplay}</Text>
                </Pressable>
            </Card.Content>
        </Card>

        {/* Log List */}
        <SectionList
            sections={filteredAndGroupedEntries} // Use filtered data
            renderItem={renderEntry} // Uses updated renderEntry
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id}
            style={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>{filterType === 'all' ? 'No logs saved yet.' : `No ${filterType.replace('_', '/')} logs found for today.`}</Text>} // Updated empty text
            contentContainerStyle={{ paddingBottom: 20 }}
            ItemSeparatorComponent={() => <Divider />}
            stickySectionHeadersEnabled={false}
        />
    </SafeAreaView>
  );
}

// Styles - Incorporating Font and Purple Theme
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: purplePalette.background },
  container: { flex: 1, backgroundColor: purplePalette.background }, // Use light purple background
  summaryCard: {
      margin: 10,
      backgroundColor: purplePalette.surface, // White card background
  },
  summaryTitle: {
      fontFamily: FONT_BOLD, // Use bold font
      color: purplePalette.primaryDark, // Use dark purple
      marginLeft: 8, // Adjust title position slightly
  },
  summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      paddingVertical: 6, // Increased padding
      paddingHorizontal: 12, // Increased padding
      borderRadius: 6, // Slightly more rounded
      borderWidth: 1, // Add border
      borderColor: 'transparent', // Default transparent border
  },
  summaryRowActive: { // Style for active filter
      backgroundColor: purplePalette.primaryLight, // Highlight active filter
      borderColor: purplePalette.primary, // Add border color for active
  },
  summaryText: {
      marginLeft: 12,
      fontFamily: FONT_REGULAR, // Apply font
      fontSize: 15,
      color: purplePalette.textPrimary,
  },
  list: { flex: 1, marginTop: 5 },
  sectionHeader: {
      paddingVertical: 6,
      paddingHorizontal: 15,
      backgroundColor: purplePalette.primaryLight, // Light purple header background
      fontFamily: FONT_BOLD, // Bold font for headers
      color: purplePalette.primaryDark, // Dark purple text
      fontSize: 16,
  },
  entryCard: {
      marginVertical: 6,
      marginHorizontal: 10,
      backgroundColor: purplePalette.surface, // White card background
  },
  cardTitle: {
      fontFamily: FONT_BOLD, // Use bold font
      color: purplePalette.textPrimary,
      fontSize: 15, // Slightly smaller title
  },
  cardSubtitle: {
      fontFamily: FONT_REGULAR,
      fontSize: 11, // Smaller subtitle
      color: purplePalette.textSecondary,
      marginTop: -2, // Adjust spacing
  },
  detailsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 6,
      marginBottom: 6,
      paddingLeft: 16, // Indent details
  },
  chip: {
      alignSelf: 'flex-start',
      marginBottom: 6,
      marginRight: 6,
      backgroundColor: '#ECEFF1', // Light grey chip background
  },
  chipText: {
      fontSize: 12,
      fontFamily: FONT_REGULAR,
  },
  transcriptionText: {
      marginTop: 8,
      fontStyle: 'italic',
      fontSize: 13, // Slightly larger transcription
      color: purplePalette.textSecondary,
      paddingHorizontal: 16, // Indent transcription
      fontFamily: FONT_REGULAR,
      marginBottom: 5, // Add margin below transcription
  },
  cardActions: {
      justifyContent: 'flex-end',
      paddingTop: 0,
      paddingBottom: 4,
      paddingRight: 8,
  },
  actionButtonText: {
      fontFamily: FONT_REGULAR, // Apply font to button text
      fontSize: 13,
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 50,
      fontStyle: 'italic',
      color: purplePalette.textSecondary,
      fontFamily: FONT_REGULAR,
  },
});
