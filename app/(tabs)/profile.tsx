import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { FONT_REGULAR, FONT_BOLD } from '../_layout'; // Import font constant

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Profile Screen</Text>
      <Text style={styles.text}>Settings Will Go Here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontFamily: FONT_BOLD,
    marginBottom: 10,
  },
  text: {
    fontFamily: FONT_REGULAR, // Apply font
    textAlign: 'center',
    margin: 5,
  }
});