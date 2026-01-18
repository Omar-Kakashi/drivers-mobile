/**
 * Root Navigator - Driver Mobile App
 * Driver-only authentication flow
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { theme } from '../theme';
import ExpoNotificationHandler from '../../ExpoNotificationHandler';

// Auth Screens (Driver only)
import DriverLoginScreen from '../screens/auth/DriverLoginScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';

// Main Navigator
import DriverNavigator from './DriverNavigator';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, user, loadStoredAuth } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Show loading while checking stored auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Check if password change needed (first login with default password)
  const needsPasswordChange = isAuthenticated && user?.is_first_login;

  return (
    <NavigationContainer>
      <ExpoNotificationHandler />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack (Driver login only)
          <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
        ) : needsPasswordChange ? (
          // Force password change on first login
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        ) : (
          // Main Driver App
          <Stack.Screen name="DriverApp" component={DriverNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
