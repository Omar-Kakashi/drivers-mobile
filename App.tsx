/**
 * Ostol Mobile - Main App Entry Point
 * Fleet Management System for Drivers and Admins
 */

// NOTE: Polyfills are now in index.ts (runs before this file)

// Auto-logger for debugging - GitHub Copilot can read these logs
import './auto-logger';

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootNavigator from './src/navigation/RootNavigator';
import { SplashScreen } from './src/components/SplashScreen';
import { initNetworkMonitoring } from './src/utils/networkUtils';
import Toast from 'react-native-toast-message';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Show splash screen for minimum 2 seconds
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Initialize network monitoring with backend auto-detection
    console.log('🚀 Starting network monitoring...');
    const unsubscribe = initNetworkMonitoring();
    
    return () => {
      console.log('🛑 Stopping network monitoring...');
      unsubscribe();
    };
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <>
      <RootNavigator />
      <StatusBar style="light" />
      <Toast />
    </>
  );
}
