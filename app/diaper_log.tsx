import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, ActivityIndicator, Button, Divider, useTheme, Chip } from 'react-native-paper';
import { useLogContext, SavedLogEntry } from '../context/LogContext'; // Import context and type

export default function DiaperLogScreen() {
  // Get data and functions from the context
  const { allEntries, isLoadingEntries, deleteEntry } = useLogContext();
  const theme = useTheme();

  // Filter entries specifically for diaper changes
  const diaperEntries = useMemo(() => {
    return allEntries.filter(entry => entry.event === 'diaper change');
  }, [allEntries]);

   // --- Confirmation before deleting a single entry ---
   const confirmDeleteEntry = (id: string) => {
    Alert.alert(
      "Delete Log?",
      "Are you sure you want to delete this log entry?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteEntry(id) }
      ]
    );
  };

  // --- Render function for each diaper entry item ---
  const renderEntry = ({ item }: { item: SavedLogEntry }) => {
    const { type, color, consistency } = item.details || {};

    return (
        <Card style={styles.entryCard}>
        <Card.Content>
            <View style={styles.timeContainer}>
                <Text variant="titleMedium">Diaper Change</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                    {new Date(item.savedAt).toLocaleString()} {/* Show full date/time */}
                    {item.time ? ` (${item.time})` : ''}
                </Text>
            </View>

             {type && (
                <Chip
                    icon={type.includes('poop') ? "emoticon-poop" : "water-outline"}
                    style={[styles.chip, { backgroundColor: type.includes('poop') ? '#EFEBE9' : '#E3F2FD' }]}
                    textStyle={styles.chipText}
                 >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                 </Chip>
             )}

            {type?.includes('poop') && (color || consistency) && (
                <View style={styles.detailsContainer}>
                    {color && <Text style={styles.detailText}>Color: {color}</Text>}
                    {consistency && <Text style={styles.detailText}>Consistency: {consistency}</Text>}
                </View>
            )}

            {item.originalTranscription && (
                <Text style={styles.transcriptionText}>
                    "{item.originalTranscription}"
                </Text>
            )}

        </Card.Content>
         <Card.Actions style={styles.cardActions}>
           <Button
              icon="pencil-outline" // Add Edit button placeholder
              onPress={() => Alert.alert("Edit", "Edit functionality not implemented yet.")}
              compact
              style={{ marginRight: 8 }}
            >
              Edit
            </Button>
           <Button
              icon="delete-outline"
              textColor={theme.colors.error}
              onPress={() => confirmDeleteEntry(item.id)}
              compact
            >
              Delete
            </Button>
         </Card.Actions>
        </Card>
    );
   };


  if (isLoadingEntries) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={{ marginTop: 10 }}>Loading logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={diaperEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No diaper logs saved yet.</Text>}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
        ItemSeparatorComponent={() => <Divider />}
      />
    </View>
  );
}

// Styles (similar to previous diaper screen, minor adjustments possible)
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  entryCard: {
    marginVertical: 5,
    marginHorizontal: 10,
  },
  timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
  },
  chip: {
      alignSelf: 'flex-start',
      marginBottom: 8,
      marginRight: 8,
  },
  chipText: {
      fontSize: 12,
  },
  detailsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 5,
      marginLeft: 5, // Indent details slightly
  },
  detailText: {
      marginRight: 15,
      fontSize: 13,
      color: 'grey'
  },
  transcriptionText: {
      marginTop: 5,
      fontStyle: 'italic',
      fontSize: 12,
      color: 'grey',
      marginLeft: 5,
  },
  cardActions: {
      justifyContent: 'flex-end',
      paddingTop: 0,
      paddingBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontStyle: 'italic',
    color: 'grey',
  },
});
