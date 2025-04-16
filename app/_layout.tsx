import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { LogProvider } from '../context/LogContext'; // Import the LogProvider

export default function RootLayout() {
  // The PaperProvider should wrap your navigation for react-native-paper components
  return (
    <PaperProvider>
      {/* Wrap the navigation stack with LogProvider so all screens can access logs */}
      <LogProvider>
        {/* Stack navigator defines screens */}
        <Stack>
          {/* Define the main dashboard screen (index.tsx) */}
          {/* You can customize the header title here */}
          <Stack.Screen name="index" options={{ title: 'NurtureTrack Dashboard' }} />

          {/* Define detail screens (these files should exist in the app/ directory) */}
          <Stack.Screen name="diaper_log" options={{ title: 'Diaper Log' }} />
          <Stack.Screen name="sleep_log" options={{ title: 'Sleep Log' }} />
          <Stack.Screen name="feed_log" options={{ title: 'Feeding Log' }} />
          <Stack.Screen name="temp_log" options={{ title: 'Temperature Log' }} />
          {/* Add Stack.Screen entries for any other detail screens you create */}

        </Stack>
      </LogProvider>
    </PaperProvider>
  );
}