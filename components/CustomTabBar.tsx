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
            return null;
    }
};

// Helper component for individual tab buttons
const TabBarButton = ({ route, descriptor, navigation, isFocused }: any) => {
    const { options } = descriptor;
    const label = options.tabBarLabel ?? options.title ?? route.name;
    const theme = useTheme();

    const onPress = () => {
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
        }
    };

    const onLongPress = () => {
        navigation.emit({ type: 'tabLongPress', target: route.key });
    };

    const iconColor = isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant;
    const labelColor = isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant;

    return (
        <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem} // Use standard tab item style for all actual tabs
        >
            {getIcon({ route, focused: isFocused, color: iconColor, size: 26 })}
            <Text style={[styles.tabLabel, { color: labelColor }]}>
                {String(label)}
            </Text>
        </Pressable>
    );
};


export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const theme = useTheme();
    const [voiceModalVisible, setVoiceModalVisible] = useState(false);

    const showVoiceModal = () => setVoiceModalVisible(true);
    const hideVoiceModal = () => setVoiceModalVisible(false);

    // Expecting 4 routes for the tabs: index, logs, analytics, profile
    const routes = state.routes;

    return (
        <>
            {/* Container for the tab bar items */}
            <View style={[styles.tabBarContainer, { backgroundColor: theme.colors.elevation.level2 }]}>
                {/* Render Tab 1 (Home) */}
                {routes[0] && descriptors[routes[0].key] && (
                    <TabBarButton
                        route={routes[0]}
                        descriptor={descriptors[routes[0].key]}
                        navigation={navigation}
                        isFocused={state.index === 0}
                    />
                )}
                {/* Render Tab 2 (Logs) */}
                 {routes[1] && descriptors[routes[1].key] && (
                    <TabBarButton
                        route={routes[1]}
                        descriptor={descriptors[routes[1].key]}
                        navigation={navigation}
                        isFocused={state.index === 1}
                    />
                )}

                {/* Render Spacer View */}
                <View style={styles.fabSpacer} />

                {/* Render Tab 3 (Analytics) */}
                 {routes[2] && descriptors[routes[2].key] && (
                    <TabBarButton
                        route={routes[2]}
                        descriptor={descriptors[routes[2].key]}
                        navigation={navigation}
                        isFocused={state.index === 2}
                    />
                 )}
                {/* Render Tab 4 (Profile) */}
                 {routes[3] && descriptors[routes[3].key] && (
                    <TabBarButton
                        route={routes[3]}
                        descriptor={descriptors[routes[3].key]}
                        navigation={navigation}
                        isFocused={state.index === 3}
                    />
                 )}
            </View>

            {/* Floating Action Button - Positioned absolutely over the spacer */}
            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color={theme.colors.onPrimary}
                onPress={showVoiceModal}
                mode='flat'
                size='medium'
                accessibilityLabel="Add new log entry via voice"
            />

            {/* Portal and Modal for Voice Input (placeholder content) */}
            <Portal>
                <Modal visible={voiceModalVisible} onDismiss={hideVoiceModal} contentContainerStyle={[styles.modalStyle, {backgroundColor: theme.colors.background}]}>
                    <Text style={[styles.modalTitle, {color: theme.colors.onBackground}]}>Record Log Entry</Text>
                    <View style={styles.modalContent}>
                        <MaterialCommunityIcons name="microphone-outline" size={80} color={theme.colors.primary} />
                        <Text style={{textAlign: 'center', marginVertical: 20, fontFamily: FONT_REGULAR, color: theme.colors.onSurfaceVariant}}>
                            Voice recording UI and logic will go here...
                        </Text>
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
        height: 70,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E0E0E0',
        paddingBottom: 5,
        paddingTop: 5,
    },
    tabItem: {
        flex: 1, // Each actual tab takes equal remaining space
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    tabLabel: {
        fontSize: 11,
        marginTop: 3,
        fontFamily: FONT_REGULAR,
    },
    // Spacer view style
    fabSpacer: {
        width: 70, // Fixed width for the central gap - adjust as needed
        // backgroundColor: 'rgba(0, 255, 0, 0.1)', // Optional: for debugging layout
    },
    fab: {
        position: 'absolute',
        left: Dimensions.get('window').width / 2 - 28, // Center based on FAB size (medium=56)
        bottom: 35, // Position above the tab bar baseline
        borderRadius: 28,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
     modalStyle: {
        padding: 25,
        margin: 20,
        borderRadius: 15,
        alignItems: 'center',
     },
     modalTitle: {
         fontSize: 20,
         fontFamily: FONT_BOLD,
         marginBottom: 20,
     },
     modalContent: {
         alignItems: 'center',
         width: '100%',
     }
});

// END OF FILE - nurturetrack_custom_tabbar_v1
