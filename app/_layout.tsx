import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { LogProvider } from '../context/LogContext';
import { useEffect } from 'react';
// Import font loading hooks and specific fonts
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources (fonts)
SplashScreen.preventAutoHideAsync();

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

  // Define font family names to use in styles
  // These MUST match the keys used in useFonts hook
  const FONT_REGULAR = 'Poppins_400Regular';
  const FONT_BOLD = 'Poppins_700Bold';

  // Note: To apply the font globally via react-native-paper theme,
  // you would create a custom theme object here and pass it to PaperProvider.
  // For now, we'll apply it selectively in screen styles.

  return (
    // Wrap the entire app with PaperProvider for UI components
    <PaperProvider>
      {/* Wrap the navigation stack with LogProvider so all screens can access logs */}
      <LogProvider>
        {/* Stack navigator defines screens */}
        <Stack>
          {/* Apply bold font to headers */}
          <Stack.Screen name="index" options={{ title: 'NurtureTrack Dashboard', headerTitleStyle: { fontFamily: FONT_BOLD } }} />
          <Stack.Screen name="diaper_log" options={{ title: 'Diaper Log', headerTitleStyle: { fontFamily: FONT_BOLD } }} />
          <Stack.Screen name="sleep_log" options={{ title: 'Sleep Log', headerTitleStyle: { fontFamily: FONT_BOLD } }} />
          <Stack.Screen name="feed_log" options={{ title: 'Feeding Log', headerTitleStyle: { fontFamily: FONT_BOLD } }} />
          <Stack.Screen name="temp_log" options={{ title: 'Temperature Log', headerTitleStyle: { fontFamily: FONT_BOLD } }} />
        </Stack>
      </LogProvider>
    </PaperProvider>
  );
}
