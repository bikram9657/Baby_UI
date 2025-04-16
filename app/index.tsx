import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Alert, ScrollView, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { Button, Card, Text, ActivityIndicator, useTheme, Snackbar, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useLogContext, SavedLogEntry } from '../context/LogContext';

// Interface for data coming from backend
interface ProcessedLogData {
  babyName: string | null;
  event: string | null;
  time: string | null;
  details: Record<string, any>;
  originalTranscription: string | null;
  promptForDetails?: string[] | null;
  error?: string;
}

// Define card colors (customize these)
// Defined outside as they don't depend on the theme hook
const cardColors = {
    diaper: '#FFF9C4', sleep: '#B3E5FC', feed: '#C8E6C9', temp: '#FFCCBC',
    pump: '#D1C4E9', meds: '#F8BBD0',
};

export default function DashboardScreen() {
  const { saveEntry, getLatestEntryTime } = useLogContext();
  const router = useRouter();
  const theme = useTheme(); // Get theme object HERE

  // --- State for Voice Recording ---
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsPrompt, setShowDetailsPrompt] = useState(false);
  const [entryToDetail, setEntryToDetail] = useState<SavedLogEntry | null>(null);

  // --- Get latest times for cards ---
  const lastDiaperTime = getLatestEntryTime('diaper change');
  const lastSleepTime = getLatestEntryTime('sleep');
  const lastFeedTime = getLatestEntryTime(['feed', 'pump']);
  const lastTempTime = getLatestEntryTime('temperature');

  // --- Recording & API Logic (implementation unchanged) ---
   async function startRecording() {
     // ... (same as before) ...
     setError(null);
     setShowDetailsPrompt(false);
     setEntryToDetail(null);
     try {
       if (permissionResponse?.status !== 'granted') {
         console.log('Requesting permission..');
         await requestPermission();
         const updatedPermissions = await Audio.getPermissionsAsync();
         if (updatedPermissions.status !== 'granted') {
           Alert.alert('Permissions required', 'Microphone permission is needed to record audio.');
           return;
         }
       }
       console.log('Permission granted, setting audio mode...');
       await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
       console.log('Starting recording..');
       const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
       setRecording(newRecording);
       setIsRecording(true);
       console.log('Recording started');
     } catch (err: any) {
       console.error('Failed to start recording', err);
       setError(`Failed to start recording: ${err.message}`);
       setIsRecording(false);
       setRecording(null);
     }
   }

   async function stopRecording() {
     // ... (same as before) ...
      if (!recording) return;
      console.log('Stopping recording..');
      setIsRecording(false);
      setIsLoading(true);
      setError(null);
      setShowDetailsPrompt(false);
      setEntryToDetail(null);
      try {
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        const uri = recording.getURI();
        setRecording(null);
        console.log('Recording stopped and stored at', uri);
        if (uri) {
          await sendAudioToServer(uri);
        } else {
          throw new Error("Failed to get recording URI.");
        }
      } catch (err: any) {
        console.error('Failed to stop recording or send audio', err);
        setError(`Error stopping/sending: ${err.message}`);
        setIsLoading(false);
      }
   }

   async function sendAudioToServer(uri: string) {
     // ... (same as before, ensure BACKEND_URL is correct) ...
     const BACKEND_URL = 'http://192.168.1.150:3001/process-audio-log'; // Ensure correct IP
     console.log(`Sending audio from ${uri} to ${BACKEND_URL}`);
     setError(null);
     setIsLoading(true);
     try {
       const formData = new FormData();
       const filename = uri.split('/').pop() || 'audio.m4a';
       let type = 'audio/m4a';
       if (filename.endsWith('.wav')) type = 'audio/wav';
       else if (filename.endsWith('.mp3')) type = 'audio/mpeg';
       const platformUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
       formData.append('audio', { uri: platformUri, name: filename, type: type } as any);
       console.log('FormData prepared, sending request...');
       const response = await fetch(BACKEND_URL, { method: 'POST', body: formData });
       console.log('Response status:', response.status);
       const responseText = await response.text();
       console.log('Raw response text:', responseText);
       if (!response.ok) {
         let errorData;
         try { errorData = JSON.parse(responseText); } catch { /* Ignore */ }
         throw new Error(`Server error: ${response.status} ${response.statusText}. ${errorData?.details || ''}`);
       }
       const processedDataFromServer: ProcessedLogData = JSON.parse(responseText);
       console.log('Data received from server:', processedDataFromServer);
       const savedEntry: SavedLogEntry | null = await saveEntry(processedDataFromServer); // Auto-save
       console.log('Type of savedEntry:', typeof savedEntry, 'Value:', savedEntry);
       if (savedEntry) { // Check if save was successful
           if (savedEntry.promptForDetails && savedEntry.promptForDetails.length > 0) {
               console.log('Prompting for details:', savedEntry.promptForDetails);
               setEntryToDetail(savedEntry);
               setShowDetailsPrompt(true);
           }
       }
     } catch (err: any) {
       console.error('Failed to send audio or process response', err);
       setError(`Network/Server Error: ${err.message}`);
     } finally {
       setIsLoading(false);
     }
   }

   // --- Function to handle adding details (placeholder) ---
   const handleAddDetails = () => {
       // ... (same as before) ...
       if (!entryToDetail) return;
       console.log(`User wants to add details for entry ID: ${entryToDetail.id}`);
       setShowDetailsPrompt(false);
       setEntryToDetail(null);
       Alert.alert("Add Details", "Navigation to detail editing screen not implemented yet.");
   }

   // *** Styles definition MOVED INSIDE the component ***
   // Now it has access to the 'theme' variable from useTheme()
   const styles = StyleSheet.create({
     outerContainer: {
       flex: 1,
       backgroundColor: '#F5F5F5',
     },
     scrollContainer: {
       padding: 10,
       paddingBottom: 120, // Space for bottom bar
     },
     cardContainer: {
       flexDirection: 'row',
       flexWrap: 'wrap',
       justifyContent: 'space-around',
     },
     card: {
       width: '46%',
       marginBottom: 15,
       minHeight: 120,
       justifyContent: 'center',
     },
      errorCard: {
        width: '95%',
        borderColor: 'red',
        borderWidth: 1,
        backgroundColor: '#FFEBEE'
      },
     cardContent: {
       alignItems: 'center',
     },
     cardTitle: {
       marginTop: 5,
       marginBottom: 3,
     },
     bottomBar: {
       position: 'absolute',
       bottom: 0,
       left: 0,
       right: 0,
       height: 100,
       // Use theme colors now that 'theme' is in scope
       backgroundColor: theme.colors.elevation.level2,
       justifyContent: 'center',
       alignItems: 'center',
       borderTopWidth: 1,
       borderTopColor: theme.colors.outlineVariant,
       paddingBottom: 10,
     },
     recordButton: {
       // Style inherited from IconButton size prop
     },
     recordButtonText: {
         marginTop: 4,
         fontSize: 12,
         color: 'grey',
     },
     loader: {
       position: 'absolute',
       bottom: 80,
     },
     snackbar: {
       position: 'absolute',
       bottom: 100, // Above bottom bar
       left: 10,
       right: 10,
     },
   });
   // *** END of moved styles definition ***

  // --- Render ---
  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Error Display Area */}
        {error && (
            <Card style={[styles.card, styles.errorCard]}>
                <Card.Content>
                <Text variant="titleMedium" style={{ color: theme.colors.error }}>Error</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.error }}>{error}</Text>
                </Card.Content>
            </Card>
        )}

        {/* Category Cards */}
        <View style={styles.cardContainer}>
          {/* Diaper Card */}
          <Card style={[styles.card, { backgroundColor: cardColors.diaper }]} onPress={() => router.push('/diaper_log')}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="baby-carriage" size={30} color="#795548" />
              <Text variant="titleLarge" style={styles.cardTitle}>Diaper</Text>
              <Text variant="bodySmall">Last: {lastDiaperTime || 'N/A'}</Text>
            </Card.Content>
          </Card>

          {/* Sleep Card */}
          <Card style={[styles.card, { backgroundColor: cardColors.sleep }]} onPress={() => router.push('/sleep_log')}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="sleep" size={30} color="#0277BD" />
              <Text variant="titleLarge" style={styles.cardTitle}>Sleep</Text>
              <Text variant="bodySmall">Last: {lastSleepTime || 'N/A'}</Text>
            </Card.Content>
          </Card>

          {/* Feed Card */}
          <Card style={[styles.card, { backgroundColor: cardColors.feed }]} onPress={() => router.push('/feed_log')}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="baby-bottle-outline" size={30} color="#2E7D32" />
              <Text variant="titleLarge" style={styles.cardTitle}>Feed</Text>
              <Text variant="bodySmall">Last: {lastFeedTime || 'N/A'}</Text>
            </Card.Content>
          </Card>

          {/* Temperature Card */}
           <Card style={[styles.card, { backgroundColor: cardColors.temp }]} onPress={() => router.push('/temp_log')}>
             <Card.Content style={styles.cardContent}>
               <MaterialCommunityIcons name="thermometer" size={30} color="#BF360C" />
               <Text variant="titleLarge" style={styles.cardTitle}>Temp</Text>
               <Text variant="bodySmall">Last: {lastTempTime || 'N/A'}</Text>
             </Card.Content>
           </Card>

        </View>
      </ScrollView>

      {/* Bottom Recording Area */}
      <View style={styles.bottomBar}>
        {isLoading && <ActivityIndicator animating={true} size="small" style={styles.loader} />}
        <IconButton
            icon={isRecording ? "stop-circle" : "record-circle"}
            iconColor={theme.colors.onPrimary}
            containerColor={isRecording ? theme.colors.error : theme.colors.primary}
            size={50}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isLoading && !isRecording}
            style={styles.recordButton}
        />
         <Text style={styles.recordButtonText}>{isRecording ? 'Recording...' : 'Tap to Record'}</Text>
      </View>

      {/* Snackbar Prompt */}
      <Snackbar
            visible={showDetailsPrompt}
            onDismiss={() => { setShowDetailsPrompt(false); setEntryToDetail(null); }}
            action={{ label: 'Add Details', onPress: handleAddDetails }}
            duration={Snackbar.DURATION_LONG}
            style={styles.snackbar}
        >
            {`Add details for ${entryToDetail?.event || 'last entry'}? (${entryToDetail?.promptForDetails?.join(', ')})`}
        </Snackbar>
    </View>
  );
}

// Styles definition was moved inside the component function above
