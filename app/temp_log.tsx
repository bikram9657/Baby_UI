import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, ActivityIndicator, Button, Divider, useTheme, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLogContext, SavedLogEntry } from '../context/LogContext';

export default function TempLogScreen() {
  const { allEntries, isLoadingEntries, deleteEntry } = useLogContext();
  const theme = useTheme();

  // Filter entries for temperature events
  const tempEntries = useMemo(() => {
    return allEntries.filter(entry => entry.event === 'temperature');
  }, [allEntries]);

  const confirmDeleteEntry = (id: string) => {
    Alert.alert("Delete Log?", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEntry(id) }
    ]);
  };

  const renderEntry = ({ item }: { item: SavedLogEntry }) => {
    const { value, unit } = item.details || {};

    return (
        <Card style={styles.entryCard}>
        <Card.Content>
            <View style={styles.timeContainer}>
                <Text variant="titleMedium">Temperature</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                    {new Date(item.savedAt).toLocaleString()}
                    {item.time ? ` (${item.time})` : ''}
                </Text>
            </View>

            {value && (
                <Chip icon="thermometer" style={styles.chip} textStyle={styles.chipText}>
                    {value}{unit ? ` °${unit}` : ''}
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
        data={tempEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No temperature logs saved yet.</Text>}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
        ItemSeparatorComponent={() => <Divider />}
      />
    </View>
  );
}

// Styles
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
