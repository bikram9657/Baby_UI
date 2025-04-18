// START OF FILE - nurturetrack_tabs_layout_v1

import React from 'react';
import { Tabs } from 'expo-router';
// Import the custom component we created
import CustomTabBar from '../../components/CustomTabBar';
// Font import no longer needed here if headers defined in root layout
// import { FONT_BOLD } from '../_layout';

export default function TabLayout() {

  return (
    <Tabs
      // Use the custom Tab Bar component for rendering
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        // The main header (with "NurtureTrack" title) is configured
        // in the root layout (app/_layout.tsx).
        // We hide the default headers for individual tab screens here.
        headerShown: false,
      }}
    >
      {/* Define the main screens that appear as tabs */}
      <Tabs.Screen
        name="index" // Corresponds to app/(tabs)/index.tsx
        options={{
          title: 'Home', // Label used in CustomTabBar
        }}
      />
      <Tabs.Screen
        name="logs" // Corresponds to app/(tabs)/logs.tsx
        options={{
          title: 'Logs',
        }}
      />
      <Tabs.Screen
        name="analytics" // Corresponds to app/(tabs)/analytics.tsx
        options={{
          title: 'Analytics',
        }}
      />
      <Tabs.Screen
        name="profile" // Corresponds to app/(tabs)/profile.tsx
        options={{
          title: 'Profile',
        }}
      />

      {/* Define Detail Screens here but hide them from the tab bar */}
      {/* This keeps the tab bar visible when navigating to them. */}
      {/* Header options (title, back button etc.) for these are set in app/_layout.tsx */}
      <Tabs.Screen name="diaper_log" options={{ href: null }} />
      <Tabs.Screen name="sleep_log" options={{ href: null }} />
      <Tabs.Screen name="feed_log" options={{ href: null }} />
      <Tabs.Screen name="temp_log" options={{ href: null }} />
      <Tabs.Screen name="meds_log" options={{ href: null }} />
      <Tabs.Screen name="dev_log" options={{ href: null }} />
      <Tabs.Screen name="custom_log" options={{ href: null }} />

    </Tabs>
  );
}

// END OF FILE - nurturetrack_tabs_layout_v1
