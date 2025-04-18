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
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      if (fontError) {
          console.warn("Error loading fonts: ", fontError);
      }
    }
  }, [fontsLoaded, fontError]);

  // Prevent rendering until the fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // --- App Structure ---
  return (
    <PaperProvider>
      <LogProvider>
        {/* Main Navigation Stack */}
        <Stack>
          {/* The Tabs navigator is now the primary screen managed by the stack */}
          <Stack.Screen
             name="(tabs)" // Points to the layout file in the (tabs) directory
             options={{
                headerShown: true, // Keep the main header
                headerTitleAlign: 'center',
                headerTitle: 'NurtureTrack',
                headerTitleStyle: {
                    fontFamily: FONT_BOLD,
                    fontSize: 20,
                 },
             }}
          />
          {/* Detail screens definitions are REMOVED from here */}
        </Stack>
      </LogProvider>
    </PaperProvider>
  );
}
// END OF FILE - nurturetrack_root_layout_v1
