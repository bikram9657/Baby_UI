// START OF FILE - nurturetrack_dashboard_v1

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Alert, ScrollView, Pressable } from 'react-native';
import { Audio } from 'expo-av';
// Import Modal, Portal, TextInput, RadioButton components
import { Button, Card, Text, ActivityIndicator, useTheme, IconButton, Modal, Portal, TextInput, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// *** Import types from context instead of redefining ***
import { useLogContext, SavedLogEntry } from '../context/LogContext';

// Interface for data coming from backend
interface ProcessedLogData {
  babyName: string | null;
  event: string | null;
  time: string | null; // Should now be specific time string
  details: Record<string, any>;
  originalTranscription: string | null;
  promptForDetails?: string[] | null;
  error?: string;
}

// Define card colors (customize these)
const cardColors = {
    diaper: '#FFF9C4', sleep: '#B3E5FC', feed: '#C8E6C9', temp: '#FFCCBC',
    pump: '#D1C4E9', meds: '#F8BBD0',
};

// Define font families (ensure these match loaded fonts in _layout.tsx)
const FONT_REGULAR = 'Poppins_400Regular';
const FONT_BOLD = 'Poppins_700Bold';


export default function DashboardScreen() {
  const { saveEntry, getLatestEntryTime, updateEntryDetails } = useLogContext();
  const router = useRouter();
  const theme = useTheme(); // Get theme object HERE

  // --- State for Voice Recording & API Call ---
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- State for Modal Prompt ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [entryToDetail, setEntryToDetail] = useState<SavedLogEntry | null>(null);
  // Modal input state
  const [modalAmount, setModalAmount] = useState('');
  const [modalUnit, setModalUnit] = useState<'ml' | 'oz'>('ml');
  // Renamed modalFeedType to modalBottleContentType for clarity
  const [modalBottleContentType, setModalBottleContentType] = useState<'formula' | 'breast milk' | null>(null);
  // Added state for feed METHOD
  const [modalFeedMethod, setModalFeedMethod] = useState<'bottle' | 'breast' | 'solids' | null>(null);
  const [modalPoopColor, setModalPoopColor] = useState<string | null>(null);
  const [modalPoopConsistency, setModalPoopConsistency] = useState<string | null>(null);

  // --- Get latest times for cards ---
  const lastDiaperTime = getLatestEntryTime('diaper change');
  const lastSleepTime = getLatestEntryTime('sleep');
  const lastFeedTime = getLatestEntryTime(['feed', 'pump']);
  const lastTempTime = getLatestEntryTime('temperature');

  // --- Recording & API Logic ---
   async function startRecording() {
     setError(null);
     setIsModalVisible(false); // Ensure modal is hidden
     setEntryToDetail(null);
     try {
       // Check permissions first
       let currentPermissions = permissionResponse;
       if (currentPermissions?.status !== 'granted') {
         console.log('Requesting permission..');
         currentPermissions = await requestPermission(); // Request permissions
       }

       // Check status again after requesting (important!)
        if (currentPermissions?.status !== 'granted') {
           Alert.alert('Permissions required', 'Microphone permission is needed to record audio.');
           console.error('Permission not granted after request:', currentPermissions?.status);
           return; // Exit if permission still not granted
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
       setIsRecording(false); // Ensure state is correct on error
       setRecording(null); // Clean up recording object
     }
   }

   async function stopRecording() {
      if (!recording) return;
      console.log('Stopping recording..');
      setIsRecording(false);
      setIsLoading(true);
      setError(null);
      try {
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        const uri = recording.getURI();
        setRecording(null); // Clear recording object after stopping
        console.log('Recording stopped and stored at', uri);
        if (uri) {
            await sendAudioToServer(uri);
        } else {
            throw new Error("Failed to get recording URI.");
        }
      } catch (err: any) {
          console.error('Failed to stop recording or send audio', err);
          setError(`Error stopping/sending: ${err.message}`);
          setIsLoading(false); // Ensure loading stops on error
      }
   }

   async function sendAudioToServer(uri: string) {
     const BACKEND_URL = 'http://192.168.1.150:3001/process-audio-log'; // Ensure correct IP
     console.log(`Sending audio from ${uri} to ${BACKEND_URL}`);
     setError(null);
     // setIsLoading(true); // Loading is already set in stopRecording

     try {
       const formData = new FormData();
       const filename = uri.split('/').pop() || 'audio.m4a';
       let type = 'audio/m4a'; // Default, common for expo-av
       if (filename.endsWith('.wav')) type = 'audio/wav';
       else if (filename.endsWith('.mp3')) type = 'audio/mpeg';
       else if (filename.endsWith('.aac')) type = 'audio/aac';
       else if (filename.endsWith('.amr')) type = 'audio/amr';
       else if (filename.endsWith('.ogg')) type = 'audio/ogg';
       else if (filename.endsWith('.webm')) type = 'audio/webm';

       // Ensure URI is correctly formatted for the platform
       const platformUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');

       formData.append('audio', {
         uri: platformUri,
         name: filename,
         type: type,
       } as any); // Use 'as any' for FormData structure

       console.log('FormData prepared, sending request...');
       const response = await fetch(BACKEND_URL, {
         method: 'POST',
         body: formData,
         headers: {
           // 'Content-Type': 'multipart/form-data' // fetch sets this automatically
         },
       });

       const responseText = await response.text();
       console.log('Response status:', response.status, 'Raw response text:', responseText);

       if (!response.ok) {
         let errorData;
         let errorDetail = responseText; // Default to raw text
         try {
            errorData = JSON.parse(responseText);
            errorDetail = errorData?.details || errorDetail; // Use details if available
         } catch { /* Ignore parsing error */ }
         throw new Error(`Server error: ${response.status}. ${errorDetail}`);
       }

       const processedDataFromServer: ProcessedLogData = JSON.parse(responseText);
       console.log('Data received:', processedDataFromServer);

       // Auto-Save the entry
       const savedEntry: SavedLogEntry | null = await saveEntry(processedDataFromServer);
       console.log('Type of savedEntry:', typeof savedEntry, 'Value:', savedEntry);

       // Check if save was successful and prompt if needed
       if (savedEntry) {
           if (savedEntry.promptForDetails && savedEntry.promptForDetails.length > 0) {
               console.log('Prompting for details:', savedEntry.promptForDetails);
               // Reset modal state before showing
               setModalAmount(''); setModalUnit('ml'); setModalBottleContentType(null);
               setModalFeedMethod(null);
               setModalPoopColor(null); setModalPoopConsistency(null);
               setEntryToDetail(savedEntry);
               setIsModalVisible(true);
           }
       } else {
           setError("Failed to save the entry."); // Error occurred during save
       }

     } catch (err: any) {
       console.error('Failed to send audio or process response', err);
       setError(`Network/Server Error: ${err.message}`);
     } finally {
       setIsLoading(false); // Ensure loading stops
     }
   }

   // --- Function to handle saving details from the Modal ---
   const handleSaveDetailsFromModal = async () => {
       if (!entryToDetail) return;
       const newDetails: Record<string, any> = {};

       // Feed Method (Type)
       if (entryToDetail.promptForDetails?.includes('type') && modalFeedMethod) {
           newDetails.type = modalFeedMethod;
       }
       // Amount
       if (entryToDetail.promptForDetails?.includes('amount')) {
           if (modalAmount && !isNaN(parseFloat(modalAmount))) {
               newDetails.amount = modalAmount; newDetails.unit = modalUnit;
           } else { Alert.alert("Invalid Amount", "Please enter a valid number."); return; }
       }
       // Bottle Content Type (Milk Type)
       if (entryToDetail.promptForDetails?.includes('milkType') && modalBottleContentType) {
            newDetails.milkType = modalBottleContentType;
       }
       // Poop details
       if (entryToDetail.promptForDetails?.includes('color') && modalPoopColor) { newDetails.color = modalPoopColor; }
       if (entryToDetail.promptForDetails?.includes('consistency') && modalPoopConsistency) { newDetails.consistency = modalPoopConsistency; }

       // Only proceed if some details were actually added
       if (Object.keys(newDetails).length > 0) {
           console.log(`Updating entry ${entryToDetail.id} with details:`, newDetails);
           await updateEntryDetails(entryToDetail.id, newDetails);
       } else {
           console.log("No new details entered in modal.");
       }
       hideModal();
   };

   // --- Function to hide modal ---
   const hideModal = () => {
       setIsModalVisible(false);
       setEntryToDetail(null);
   }

   // *** Styles definition INSIDE the component ***
   const styles = StyleSheet.create({
     outerContainer: { flex: 1, backgroundColor: '#F5F5F5' },
     scrollContainer: { padding: 10, paddingBottom: 120 }, // Space for bottom bar
     cardContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
     card: { width: '46%', marginBottom: 15, minHeight: 120, justifyContent: 'center', borderRadius: 12 }, // Added border radius
     errorCard: { width: '95%', borderColor: theme.colors.error, borderWidth: 1, backgroundColor: theme.colors.errorContainer, borderRadius: 12 },
     cardContent: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 5 }, // Added horizontal padding
     cardTitle: { fontFamily: FONT_BOLD, marginTop: 5, marginBottom: 3, textAlign: 'center' },
     cardSubText: { fontFamily: FONT_REGULAR, fontSize: 12, color: theme.colors.onSurfaceVariant, textAlign: 'center' }, // Centered subtext
     bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: theme.colors.elevation.level2, justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant, paddingBottom: 10 },
     recordButton: {},
     recordButtonText: { marginTop: 4, fontSize: 12, color: theme.colors.onSurfaceVariant, fontFamily: FONT_REGULAR },
     loader: { position: 'absolute', bottom: 80 }, // Position loader slightly higher
     snackbar: { position: 'absolute', bottom: 105, left: 10, right: 10, borderRadius: 8 }, // Position Snackbar above bottom bar, rounded
     // Modal Styles
     modalContainer: { backgroundColor: theme.colors.background, padding: 25, margin: 30, borderRadius: 10 },
     modalTitle: { fontSize: 20, fontFamily: FONT_BOLD, marginBottom: 15, textAlign: 'center', color: theme.colors.onBackground },
     modalInfo: { fontSize: 14, fontFamily: FONT_REGULAR, marginBottom: 20, textAlign: 'center', color: theme.colors.onSurfaceVariant },
     modalInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
     modalInputGroup: { marginBottom: 15 },
     modalLabel: { fontSize: 14, fontFamily: FONT_REGULAR, color: theme.colors.onSurfaceVariant, marginBottom: 5 },
     modalInputAmount: { flex: 1, marginRight: 10 },
     modalInput: { marginBottom: 15 },
     radioRow: { flexDirection: 'row', alignItems: 'center', marginRight: 10 }, // Added right margin
     radioRowHorizontal: { flexDirection: 'row', justifyContent: 'space-evenly', flexWrap: 'wrap' }, // Allow wrapping, even spacing
     modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25 },
     modalButton: { marginLeft: 10 }
   });
   // *** END of moved styles definition ***

  // --- Render ---
  return (
    <Portal.Host>
        <View style={styles.outerContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Error Display Area */}
            {error && (
                 <Card style={styles.errorCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.colors.onErrorContainer }}>Error</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onErrorContainer }}>{error}</Text>
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
                <Text variant="bodySmall" style={styles.cardSubText}>Last: {lastDiaperTime || 'N/A'}</Text>
                </Card.Content>
            </Card>
            {/* Sleep Card */}
            <Card style={[styles.card, { backgroundColor: cardColors.sleep }]} onPress={() => router.push('/sleep_log')}>
                <Card.Content style={styles.cardContent}>
                <MaterialCommunityIcons name="sleep" size={30} color="#0277BD" />
                <Text variant="titleLarge" style={styles.cardTitle}>Sleep</Text>
                <Text variant="bodySmall" style={styles.cardSubText}>Last: {lastSleepTime || 'N/A'}</Text>
                </Card.Content>
            </Card>
            {/* Feed Card */}
            <Card style={[styles.card, { backgroundColor: cardColors.feed }]} onPress={() => router.push('/feed_log')}>
                <Card.Content style={styles.cardContent}>
                <MaterialCommunityIcons name="baby-bottle-outline" size={30} color="#2E7D32" />
                <Text variant="titleLarge" style={styles.cardTitle}>Feed</Text>
                <Text variant="bodySmall" style={styles.cardSubText}>Last: {lastFeedTime || 'N/A'}</Text>
                </Card.Content>
            </Card>
            {/* Temperature Card */}
            <Card style={[styles.card, { backgroundColor: cardColors.temp }]} onPress={() => router.push('/temp_log')}>
                <Card.Content style={styles.cardContent}>
                <MaterialCommunityIcons name="thermometer" size={30} color="#BF360C" />
                <Text variant="titleLarge" style={styles.cardTitle}>Temp</Text>
                <Text variant="bodySmall" style={styles.cardSubText}>Last: {lastTempTime || 'N/A'}</Text>
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

        {/* Modal for Adding Details */}
        <Portal>
            <Modal visible={isModalVisible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Missing Details</Text>
            <Text style={styles.modalInfo}>For {entryToDetail?.event} at {entryToDetail?.time || new Date(entryToDetail?.savedAt ?? Date.now()).toLocaleTimeString()}</Text>

             {/* Feed Method Input */}
             {entryToDetail?.promptForDetails?.includes('type') && entryToDetail.event === 'feed' && (
                 <View style={styles.modalInputGroup}>
                     <Text style={styles.modalLabel}>Feed Method:</Text>
                     <RadioButton.Group onValueChange={newValue => setModalFeedMethod(newValue as any)} value={modalFeedMethod ?? ''}>
                         <View style={styles.radioRowHorizontal}>
                             <View style={styles.radioRow}><Text>Bottle</Text><RadioButton value="bottle" /></View>
                             <View style={styles.radioRow}><Text>Breast</Text><RadioButton value="breast" /></View>
                             <View style={styles.radioRow}><Text>Solids</Text><RadioButton value="solids" /></View>
                         </View>
                     </RadioButton.Group>
                 </View>
             )}

            {/* Amount Input */}
            {entryToDetail?.promptForDetails?.includes('amount') && (
                 <View style={styles.modalInputRow}>
                    <TextInput label="Amount" value={modalAmount} onChangeText={setModalAmount} keyboardType="numeric" style={styles.modalInputAmount} mode="outlined"/>
                    <RadioButton.Group onValueChange={newValue => setModalUnit(newValue as 'ml' | 'oz')} value={modalUnit}>
                        <View style={styles.radioRow}><Text>ml</Text><RadioButton value="ml" /></View>
                        <View style={styles.radioRow}><Text>oz</Text><RadioButton value="oz" /></View>
                    </RadioButton.Group>
                 </View>
             )}

            {/* Bottle Content (Milk Type) Input */}
             {entryToDetail?.promptForDetails?.includes('milkType') &&
              (entryToDetail.event === 'feed' && (entryToDetail.details?.type === 'bottle' || modalFeedMethod === 'bottle')) && // Show only if method is bottle
                 <View style={styles.modalInputGroup}>
                     <Text style={styles.modalLabel}>Bottle Content:</Text>
                     <RadioButton.Group onValueChange={newValue => setModalBottleContentType(newValue as any)} value={modalBottleContentType ?? ''}>
                         <View style={styles.radioRowHorizontal}>
                             <View style={styles.radioRow}><Text>Breast Milk</Text><RadioButton value="breast milk" /></View>
                             <View style={styles.radioRow}><Text>Formula</Text><RadioButton value="formula" /></View>
                         </View>
                     </RadioButton.Group>
                 </View>
             }

             {/* Poop Inputs */}
              {entryToDetail?.promptForDetails?.includes('color') && entryToDetail.event === 'diaper change' && ( <TextInput label="Poop Color..." value={modalPoopColor ?? ''} onChangeText={setModalPoopColor} style={styles.modalInput} mode="outlined" /> )}
              {entryToDetail?.promptForDetails?.includes('consistency') && entryToDetail.event === 'diaper change' && ( <TextInput label="Poop Consistency..." value={modalPoopConsistency ?? ''} onChangeText={setModalPoopConsistency} style={styles.modalInput} mode="outlined" /> )}

            {/* Modal Actions */}
            <View style={styles.modalActions}>
                <Button onPress={hideModal} style={styles.modalButton}>Cancel</Button>
                <Button mode="contained" onPress={handleSaveDetailsFromModal} style={styles.modalButton}>Save Details</Button>
            </View>
            </Modal>
        </Portal>
        </View>
    </Portal.Host>
  );
}

// Styles definition is inside the component function above

// END OF FILE - nurturetrack_dashboard_v1
