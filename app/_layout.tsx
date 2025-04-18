// START OF FILE - nurturetrack_root_layout_v1

import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper'; // Import PaperProvider
import { LogProvider } from '../context/LogContext'; // Import the LogProvider
import { useEffect } from 'react'; // Import useEffect
// Import font loading hooks and specific fonts
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen'; // Import SplashScreen

// Keep the splash screen visible while we fetch resources (fonts)
SplashScreen.preventAutoHideAsync();

// Define font family names globally if needed
export const FONT_REGULAR = 'Poppins_400Regular';
export const FONT_BOLD = 'Poppins_700Bold';

export default function RootLayout() {
  // Load fonts using the hook
  let [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
    // Add other weights like Poppins_600SemiBold if needed
  });

  useEffect(() => {
    // Hide the splash screen once the fonts have loaded (or errored)
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      if (fontError) {
          console.warn("Error loading fonts: ", fontError); // Log font errors
      }
    }
  }, [fontsLoaded, fontError]);

  // Prevent rendering until the fonts are loaded (or an error occurs)
  // This avoids layout shifts or incorrect font rendering initially
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // --- App Structure ---
  return (
    // Provide Paper theme
    <PaperProvider>
      {/* Provide Log data */}
      <LogProvider>
        {/* Main Navigation Stack */}
        <Stack>
          {/* Tabs Screen: Configures the bottom tabs layout */}
          {/* It points to the layout file in the (tabs) directory */}
          <Stack.Screen
             name="(tabs)" // This should match the directory name for tabs layout
             options={{
                headerShown: true, // Show the header bar for the tabs section
                headerTitleAlign: 'center', // Center the title
                headerTitle: 'NurtureTrack', // App name as title
                headerTitleStyle: {
                    fontFamily: FONT_BOLD, // Apply modern font
                    fontSize: 20,
                 },
                 // Add other header styling if needed (e.g., background color using theme)
                 // headerStyle: { backgroundColor: '#673AB7' }, // Example purple
                 // headerTintColor: '#FFFFFF', // Example white
             }}
          />
          {/* Detail Screens (will be pushed onto the stack OVER the tabs) */}
          {/* Define them here so the header title is set correctly when navigated to */}
          {/* Using headerBackTitle: '' to hide back button text on iOS */}
          <Stack.Screen name="diaper_log" options={{ title: 'Diaper Log', headerBackTitle: '', headerTitleStyle: { fontFamily: FONT_BOLD } }} />
          <Stack.Screen name="sleep_log" options={{ title: 'Sleep Log', headerBackTitle: '', headerTitleStyle: { fontFamily: FONT_BOLD } }} />
          <Stack.Screen name="feed_log" options={{ title: 'Feeding Log', headerBackTitle: '', headerTitleStyle: { fontFamily: FONT_BOLD } }} />
          <Stack.Screen name="temp_log" options={{ title: 'Temperature Log', headerBackTitle: '', headerTitleStyle: { fontFamily: FONT_BOLD } }} />
          {/* Add placeholders for new detail screens */}
          <Stack.Screen name="meds_log" options={{ title: 'Medication Log', headerBackTitle: '', headerTitleStyle: { fontFamily: FONT_BOLD } }} />
          <Stack.Screen name="dev_log" options={{ title: 'Development Log', headerBackTitle: '', headerTitleStyle: { fontFamily: FONT_BOLD } }} />
          <Stack.Screen name="custom_log" options={{ title: 'Custom Log', headerBackTitle: '', headerTitleStyle: { fontFamily: FONT_BOLD } }} />

           {/* Add screen for voice input modal if using a dedicated screen route (alternative to modal) */}
           {/* <Stack.Screen name="voice_input" options={{ presentation: 'modal', title: 'Add Log Entry' }} /> */}
        </Stack>
      </LogProvider>
    </PaperProvider>
  );
}
// END OF FILE - nurturetrack_root_layout_v1
