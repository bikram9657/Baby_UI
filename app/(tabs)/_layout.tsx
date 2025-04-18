// START OF FILE - nurturetrack_tabs_layout_v1

import React from 'react';
import { Tabs } from 'expo-router';
// Import the custom component we created in the previous step
import CustomTabBar from '../../components/CustomTabBar';

export default function TabLayout() {

  return (
    <Tabs
      // Use the custom Tab Bar component for rendering
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        // The main header (with "NurtureTrack" title) is configured
        // in the root layout (app/_layout.tsx).
        // We hide the default headers for individual tab screens here
        // as they are part of the overall stack handled by the root layout.
        headerShown: false,
      }}
    >
      {/* Define the screens that correspond to the tabs */}
      {/* The 'name' must match the file name in the (tabs) directory */}
      {/* The 'title' option is used by CustomTabBar to display the label */}

      <Tabs.Screen
        name="index" // Corresponds to app/(tabs)/index.tsx
        options={{
          title: 'Home', // Label for the tab bar
          // Icon is rendered by CustomTabBar based on route name 'index'
        }}
      />
      <Tabs.Screen
        name="logs" // Corresponds to app/(tabs)/logs.tsx
        options={{
          title: 'Logs',
          // Icon is rendered by CustomTabBar based on route name 'logs'
        }}
      />
       {/* Note: We don't need a screen definition for the central '+' button here.
           The CustomTabBar component handles rendering the button visually
           and triggering its action (opening the modal). */}
      <Tabs.Screen
        name="analytics" // Corresponds to app/(tabs)/analytics.tsx
        options={{
          title: 'Analytics',
          // Icon is rendered by CustomTabBar based on route name 'analytics'
        }}
      />
      <Tabs.Screen
        name="profile" // Corresponds to app/(tabs)/profile.tsx
        options={{
          title: 'Profile',
          // Icon is rendered by CustomTabBar based on route name 'profile'
        }}
      />
    </Tabs>
  );
}

// END OF FILE - nurturetrack_tabs_layout_v1
