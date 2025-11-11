/**
 * Root Navigator - Handles authentication flow
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { theme } from '../theme';
import ExpoNotificationHandler from '../../ExpoNotificationHandler';

// Auth Screens
import LoginTypeScreen from '../screens/auth/LoginTypeScreen';
import DriverLoginScreen from '../screens/auth/DriverLoginScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';

// Main Navigators
import DriverNavigator from './DriverNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, user, userType, loadStoredAuth } = useAuthStore();

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

  // Check if password change needed (ONLY for drivers with default password)
  const needsPasswordChange = isAuthenticated && userType === 'driver' && user?.is_first_login;

  return (
    <NavigationContainer>
      <ExpoNotificationHandler />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="LoginType" component={LoginTypeScreen} />
            <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
          </>
        ) : needsPasswordChange ? (
          // Force password change
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        ) : (
          // Main App Stack (based on user type)
          <>
            {userType === 'driver' ? (
              <Stack.Screen name="DriverApp" component={DriverNavigator} />
            ) : (
              <Stack.Screen name="AdminApp" component={AdminNavigator} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
