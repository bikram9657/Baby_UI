// START OF FILE - nurturetrack_custom_tabbar_v1

import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useTheme, Text, FAB, Portal, Modal, Button } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// Import font constants from root layout
import { FONT_REGULAR, FONT_BOLD } from '../app/_layout'; // Adjust path if needed

// Define structure for tab icons props
interface TabIconProps {
    route: { name: string };
    focused: boolean;
    color: string;
    size: number;
}

// Helper function to get the correct icon based on route name and focus state
const getIcon = ({ route, focused, color, size }: TabIconProps): React.ReactNode => {
    let iconName: keyof typeof MaterialCommunityIcons.glyphMap | keyof typeof Ionicons.glyphMap = 'help-circle';

    switch (route.name) {
        case 'index': // Home screen (maps to index.tsx inside tabs)
            iconName = focused ? 'home-variant' : 'home-variant-outline';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        case 'logs': // Logs screen
            iconName = focused ? 'clipboard-text' : 'clipboard-text-outline';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        case 'analytics': // Analytics screen
            iconName = focused ? 'chart-line' : 'chart-line';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        case 'profile': // Profile screen
            iconName = focused ? 'account-circle' : 'account-circle-outline';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        default:
            // Return null for routes that shouldn't have a standard icon (like a placeholder for FAB)
            return null;
    }
};


export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const theme = useTheme();
    // State to control the visibility of the voice input modal
    const [voiceModalVisible, setVoiceModalVisible] = useState(false);

    const showVoiceModal = () => setVoiceModalVisible(true);
    const hideVoiceModal = () => setVoiceModalVisible(false);

    // We map all routes provided by the navigator that should be visible tabs
    const routesToDisplay = state.routes;

    return (
        // Use React.Fragment to return multiple elements (TabBar and FAB/Modal)
        <>
            {/* Container for the tab bar items */}
            <View style={[styles.tabBarContainer, { backgroundColor: theme.colors.elevation.level2 }]}>
                {routesToDisplay.map((route, index) => {
                    const { options } = descriptors[route.key];
                    // Determine the label for the tab
                    const label = options.tabBarLabel ?? options.title ?? route.name;

                    // Check if the current tab is focused
                    const isFocused = state.index === index;

                    // Function to handle tab press
                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            // Navigate to the screen associated with the tab
                            // Ensure route.params are passed if they exist
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    // Function to handle long press (optional)
                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    const iconColor = isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant;
                    const labelColor = isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant;

                    return (
                         // Render all pressable tab items normally
                         <Pressable
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.tabItem} // Use standard tab item style for all
                        >
                            {/* Render Icon and Label for all tabs */}
                            {getIcon({ route, focused: isFocused, color: iconColor, size: 26 })}
                            <Text style={[styles.tabLabel, { color: labelColor }]}>
                                {String(label)}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Floating Action Button - Positioned absolutely over the center */}
            {/* Ensure this FAB is rendered *after* the tabBarContainer View but before the Modal Portal */}
            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color={theme.colors.onPrimary} // Color of the '+' icon
                onPress={showVoiceModal} // Open the voice modal on press
                mode='flat' // Use flat mode for circle without extra shadow layer
                size='medium' // Or 'large' if you prefer
                accessibilityLabel="Add new log entry via voice"
            />

            {/* Portal and Modal for Voice Input (placeholder content) */}
            <Portal>
                <Modal visible={voiceModalVisible} onDismiss={hideVoiceModal} contentContainerStyle={[styles.modalStyle, {backgroundColor: theme.colors.background}]}>
                    <Text style={[styles.modalTitle, {color: theme.colors.onBackground}]}>Record Log Entry</Text>
                    {/* Placeholder for Voice Recording UI */}
                    <View style={styles.modalContent}>
                        <MaterialCommunityIcons name="microphone-outline" size={80} color={theme.colors.primary} />
                        <Text style={{textAlign: 'center', marginVertical: 20, fontFamily: FONT_REGULAR, color: theme.colors.onSurfaceVariant}}>
                            Voice recording UI and logic will go here...
                        </Text>
                        {/* Example Button */}
                        <Button mode="contained" onPress={hideVoiceModal} style={{marginTop: 20}}>
                             Close Modal (TEMP)
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </>
    );
}

// Styles for the Tab Bar and Modal
const styles = StyleSheet.create({
    tabBarContainer: {
        flexDirection: 'row',
        height: 70, // Standard height
        borderTopWidth: StyleSheet.hairlineWidth, // Thinner border
        borderTopColor: '#E0E0E0', // Or theme.colors.outlineVariant
        paddingBottom: 5, // Space for labels below icons
        paddingTop: 5,
        // backgroundColor: 'white', // Set by theme dynamically
    },
    tabItem: {
        flex: 1, // All tabs take up equal space
        alignItems: 'center',
        justifyContent: 'center', // Center icon and label vertically
        padding: 4,
    },
    tabLabel: {
        fontSize: 11,
        marginTop: 3,
        fontFamily: FONT_REGULAR, // Use loaded font
    },
    // fabPlaceholder style is removed
    fab: {
        position: 'absolute', // Position over the tab bar
        // Center the FAB horizontally
        left: Dimensions.get('window').width / 2 - 28, // FAB 'medium' size is 56, radius 28
        bottom: 35, // Position it so it sits nicely above the bar baseline (adjust as needed)
        borderRadius: 28, // Make it circular
        // elevation: 8, // Add shadow for Android
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8, // Also add elevation for Android shadow consistency
    },
     modalStyle: {
        // Styling for the placeholder modal content
        padding: 25,
        margin: 20,
        borderRadius: 15,
        alignItems: 'center',
     },
     modalTitle: {
         fontSize: 20,
         fontFamily: FONT_BOLD, // Use loaded font
         marginBottom: 20,
     },
     modalContent: {
         alignItems: 'center',
         width: '100%',
     }
});

// END OF FILE - nurturetrack_custom_tabbar_v1
