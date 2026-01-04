/**
 * Admin Navigator - Bottom tabs for admin features
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import NotificationsScreen from '../screens/admin/NotificationsScreen';
import RequestsScreen from '../screens/admin/RequestsScreen';
import AdminHRScreen from '../screens/admin/AdminHRScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.secondary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.secondary },
        headerTintColor: theme.colors.text.white,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
          title: 'Requests',
        }}
      />
      <Tab.Screen
        name="My Requests"
        component={AdminHRScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AdminProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
