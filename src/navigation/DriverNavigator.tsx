/**
 * Driver Navigator - Bottom tabs for driver features
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { useUnreadNotificationCount } from '../hooks/useUnreadNotificationCount';

// Driver Screens
import DriverDashboardScreen from '../screens/driver/DriverDashboardScreen';
import MyAssignmentsScreen from '../screens/driver/MyAssignmentsScreen';
import MyBalanceScreen from '../screens/driver/MyBalanceScreen';
import DriverTransactionHistoryScreen from '../screens/driver/DriverTransactionHistoryScreen';
import DriverHRScreen from '../screens/driver/DriverHRScreen';
import DriverHRHubScreen from '../screens/driver/DriverHRHubScreen';
import DocumentsScreen from '../screens/driver/DocumentsScreen';
import VehicleDocumentsScreen from '../screens/driver/VehicleDocumentsScreen';
import NotificationsScreen from '../screens/driver/NotificationsScreen';
import ProfileScreen from '../screens/driver/ProfileScreen';
import LeaveReturnScreen from '../screens/driver/LeaveReturnScreen';
import PassportHandoverScreen from '../screens/driver/PassportHandoverScreen';
import MyRequestsScreen from '../screens/driver/MyRequestsScreen';

const Tab = createBottomTabNavigator();

export default function DriverNavigator() {
  const { unreadCount } = useUnreadNotificationCount();
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      screenOptions={({ navigation }) => ({
        tabBarActiveTintColor: theme.colors.driver.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 8,
          paddingTop: 8,
          height: (Platform.OS === 'android' ? 60 : 50) + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          paddingBottom: Platform.OS === 'android' ? 4 : 0,
        },
        tabBarItemStyle: {
          flex: 1,
        },
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.driver.primary },
        headerTintColor: theme.colors.text.white,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={{ marginRight: 16, position: 'relative' }}
            >
              <Ionicons name="notifications-outline" size={26} color={theme.colors.text.white} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-circle-outline" size={28} color={theme.colors.text.white} />
            </TouchableOpacity>
          </View>
        ),
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DriverDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Assignments"
        component={MyAssignmentsScreen}
        options={{
          tabBarLabel: 'Assign',
          tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Balance"
        component={MyBalanceScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          tabBarLabel: 'Docs',
          tabBarIcon: ({ color, size }) => <Ionicons name="folder" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="HR"
        component={DriverHRHubScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} />,
          tabBarLabel: 'HR',
          title: 'HR Services',
        }}
      />
      
      {/* Hidden Screens - Accessible via navigation but not in bottom tabs */}
      <Tab.Screen
        name="Leave Request"
        component={DriverHRScreen}
        options={{
          tabBarButton: () => null,
          title: 'Request Leave',
        }}
      />
      <Tab.Screen
        name="LeaveReturn"
        component={LeaveReturnScreen}
        options={{
          tabBarButton: () => null,
          title: 'Announce Return from Leave',
        }}
      />
      <Tab.Screen
        name="My Requests"
        component={MyRequestsScreen}
        options={{
          tabBarButton: () => null,
          title: 'My Requests',
        }}
      />
      <Tab.Screen
        name="PassportHandover"
        component={PassportHandoverScreen}
        options={{
          tabBarButton: () => null,
          title: 'Passport Handover',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarButton: () => null,
          title: 'Profile',
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarButton: () => null,
          title: 'Notifications',
        }}
      />
      <Tab.Screen
        name="VehicleDocuments"
        component={VehicleDocumentsScreen}
        options={{
          tabBarButton: () => null,
          title: 'Vehicle Documents',
        }}
      />
      <Tab.Screen
        name="Settlements"
        component={DriverTransactionHistoryScreen}
        options={{
          tabBarButton: () => null,
          title: 'Transaction History',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.text.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
