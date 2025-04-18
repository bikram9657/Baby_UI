// START OF FILE - nurturetrack_home_screen_v1

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useLogContext } from '../../context/LogContext'; // Import context hook
import { FONT_REGULAR, FONT_BOLD } from '../_layout'; // Import font constants

// Define card colors using a purplish/complementary theme palette
// (Adjust these colors to your preference)
const cardColors = {
    mamasMilk: '#CE93D8', // Purple 200
    giveMeds: '#B39DDB', // Deep Purple 200
    diaper: '#9FA8DA', // Indigo 200
    feed: '#A5D6A7', // Green 200
    temp: '#FFCC80', // Orange 200
    sleep: '#90CAF9', // Blue 200
    development: '#EF9A9A', // Red 200
    custom: '#B0BEC5', // Blue Grey 200
};

// Define card details - 8 cards
// Added eventDetailFilter example for more specific time fetching if needed later
const cardData = [
    // Row 1
    { id: 'mamasMilk', title: "Mama's Milk", icon: 'food-variant', color: cardColors.mamasMilk, eventTypes: ['pump', 'feed'], eventDetailFilter: { key: 'type', value: 'breast'}, navigateTo: '/feed_log', filterParam: { filter: 'breast_pump' } }, // Represents Breast/Pump
    { id: 'feed', title: 'Feed', icon: 'baby-bottle-outline', color: cardColors.feed, eventTypes: ['feed'], eventDetailFilter: { key: 'type', value: ['bottle', 'solids']}, navigateTo: '/feed_log', filterParam: { filter: 'bottle_solids' } }, // Represents Bottle/Solids
    // Row 2
    { id: 'sleep', title: 'Sleep', icon: 'sleep', color: cardColors.sleep, eventTypes: ['sleep'], eventDetailFilter: null, navigateTo: '/sleep_log', filterParam: null },
    { id: 'diaper', title: 'Diaper', icon: 'baby-carriage', color: cardColors.diaper, eventTypes: ['diaper change'], eventDetailFilter: null, navigateTo: '/diaper_log', filterParam: null },
    // Row 3
    { id: 'giveMeds', title: 'Give Meds', icon: 'pill', color: cardColors.giveMeds, eventTypes: ['medication'], eventDetailFilter: null, navigateTo: '/meds_log', filterParam: null }, // Placeholder route
    { id: 'temp', title: 'Temp', icon: 'thermometer', color: cardColors.temp, eventTypes: ['temperature'], eventDetailFilter: null, navigateTo: '/temp_log', filterParam: null },
    // Row 4
    { id: 'development', title: 'Development', icon: 'star-box-outline', color: cardColors.development, eventTypes: ['milestone'], eventDetailFilter: null, navigateTo: '/dev_log', filterParam: null }, // Placeholder route & event
    { id: 'custom', title: 'Custom Log', icon: 'plus-box-outline', color: cardColors.custom, eventTypes: ['note'], eventDetailFilter: null, navigateTo: '/custom_log', filterParam: null }, // Placeholder route & event
];


export default function HomeScreen() {
  const { getLatestEntryTime } = useLogContext();
  const router = useRouter();
  const theme = useTheme(); // Use theme for background color

  // Styles defined inside component to access theme and fonts
  const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: theme.colors.background, // Use theme background
    },
    scrollContainer: {
      paddingHorizontal: 10, // Side padding
      paddingVertical: 20, // Vertical padding
      // alignItems: 'center', // Let cards flow naturally
    },
    cardContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      // Use space-between for more controlled spacing, adjust padding on scrollContainer if needed
      justifyContent: 'space-between',
    },
    card: {
      width: '48%', // Slightly less than half for spacing between cards
      // aspectRatio: 1, // Make cards square-ish - Let minHeight control size
      minHeight: 160, // Make cards taller
      marginBottom: 15, // Space between rows
      borderRadius: 20, // More rounded corners
      justifyContent: 'center', // Center content vertically
      alignItems: 'center', // Center content horizontally
      elevation: 4, // Add shadow (Android)
      shadowColor: "#000", // Shadow (iOS)
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
    },
    cardContent: {
      alignItems: 'center', // Center content horizontally
      padding: 10, // Add padding inside card
    },
    icon: {
      marginBottom: 10, // More space below icon
    },
    cardTitle: {
      fontFamily: FONT_BOLD, // Use loaded bold font
      color: '#FFFFFF', // White text
      textAlign: 'center', // Center title
      marginBottom: 5, // More space below title
      fontSize: 18, // Slightly larger title
    },
    cardSubText: {
      fontFamily: FONT_REGULAR, // Use loaded regular font
      fontSize: 13, // Slightly larger subtext
      color: 'rgba(255, 255, 255, 0.85)', // Slightly less transparent white
      textAlign: 'center',
      minHeight: 16, // Reserve space even if empty, adjust as needed
    },
  });

  return (
    <View style={styles.outerContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.cardContainer}>
                {cardData.map((card) => {
                    // Get latest time based on eventTypes defined in cardData
                    // TODO: Refine getLatestEntryTime logic if more specific filtering (like breast vs bottle) is needed for display
                    const lastTime = getLatestEntryTime(card.eventTypes);

                    const handlePress = () => {
                        // Define placeholder routes that aren't ready yet
                        const placeholderRoutes = ['/meds_log', '/dev_log', '/custom_log'];
                        if (placeholderRoutes.includes(card.navigateTo)) {
                            Alert.alert("Coming Soon", `${card.title} log screen is not yet implemented.`);
                        } else {
                            // Navigate with parameters if they exist
                            // Using 'as any' for pathname as a workaround for potential Expo Router type issues
                            router.push({ pathname: card.navigateTo as any, params: card.filterParam ?? undefined });
                        }
                    };

                    return (
                        // Use Pressable for better feedback control if needed, or stick with Card onPress
                        <Card key={card.id} style={[styles.card, { backgroundColor: card.color }]} onPress={handlePress}>
                            <Card.Content style={styles.cardContent}>
                                <MaterialCommunityIcons name={card.icon as any} size={60} color="#FFFFFF" style={styles.icon} />
                                <Text variant="titleLarge" style={styles.cardTitle}>{card.title}</Text>
                                {/* Only display time if it exists, remove "Last: " prefix */}
                                <Text variant="bodyMedium" style={styles.cardSubText}>
                                    {lastTime ? lastTime : ''}
                                </Text>
                            </Card.Content>
                        </Card>
                    );
                })}
            </View>
        </ScrollView>
        {/* Note: The Record button and Modal are part of CustomTabBar, not rendered here */}
    </View>
  );
}
// END OF FILE - nurturetrack_home_screen_v1
