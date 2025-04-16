import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, ActivityIndicator, Button, Divider, useTheme, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLogContext, SavedLogEntry } from '../context/LogContext';

export default function SleepLogScreen() {
  const { allEntries, isLoadingEntries, deleteEntry } = useLogContext();
  const theme = useTheme();

  // Filter entries for sleep events
  const sleepEntries = useMemo(() => {
    return allEntries.filter(entry => entry.event === 'sleep');
  }, [allEntries]);

  const confirmDeleteEntry = (id: string) => {
    Alert.alert("Delete Log?", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEntry(id) }
    ]);
  };

  const renderEntry = ({ item }: { item: SavedLogEntry }) => {
    const { duration, location, type } = item.details || {}; // Safely destructure

    return (
        <Card style={styles.entryCard}>
        <Card.Content>
            <View style={styles.timeContainer}>
                <Text variant="titleMedium">{type ? `${type.charAt(0).toUpperCase() + type.slice(1)} Sleep` : 'Sleep'}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                    {new Date(item.savedAt).toLocaleString()}
                    {item.time ? ` (${item.time})` : ''}
                </Text>
            </View>

            {duration && (
                <Chip icon="clock-outline" style={styles.chip} textStyle={styles.chipText}>
                    Duration: {duration}
                </Chip>
             )}
             {location && (
                 <Chip icon="map-marker-outline" style={styles.chip} textStyle={styles.chipText}>
                    Location: {location}
                 </Chip>
             )}

            {item.originalTranscription && (
                <Text style={styles.transcriptionText}>
                    "{item.originalTranscription}"
                </Text>
            )}
        </Card.Content>
         <Card.Actions style={styles.cardActions}>
            <Button icon="pencil-outline" onPress={() => Alert.alert("Edit", "Not implemented yet.")} compact style={{ marginRight: 8 }}>Edit</Button>
            <Button icon="delete-outline" textColor={theme.colors.error} onPress={() => confirmDeleteEntry(item.id)} compact>Delete</Button>
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
        data={sleepEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No sleep logs saved yet.</Text>}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
        ItemSeparatorComponent={() => <Divider />}
      />
    </View>
  );
}

// Styles (similar to diaper log)
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  list: { flex: 1 },
  entryCard: { marginVertical: 5, marginHorizontal: 10 },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chip: { alignSelf: 'flex-start', marginBottom: 5, marginRight: 5 },
  chipText: { fontSize: 12 },
  transcriptionText: { marginTop: 8, fontStyle: 'italic', fontSize: 12, color: 'grey' },
  cardActions: { justifyContent: 'flex-end', paddingTop: 0, paddingBottom: 4 },
  emptyText: { textAlign: 'center', marginTop: 50, fontStyle: 'italic', color: 'grey' },
});
