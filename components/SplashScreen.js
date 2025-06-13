import { COLORS } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>FixFusion</Text>
      <Text style={styles.text}>Let's get fix it</Text>      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  text:{
    fontSize: 25,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  }
});
