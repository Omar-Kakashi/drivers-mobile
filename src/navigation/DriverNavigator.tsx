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
import { useExpiringDocumentCount } from '../hooks/useExpiringDocumentCount';

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
import ShareAdjustmentRequestScreen from '../screens/driver/ShareAdjustmentRequestScreen';
import NOCRequestScreen from '../screens/driver/NOCRequestScreen';
import SalaryCertificateScreen from '../screens/driver/SalaryCertificateScreen';
import LoanCertificateScreen from '../screens/driver/LoanCertificateScreen';
import ExitPermitScreen from '../screens/driver/ExitPermitScreen';
import AccidentReportScreen from '../screens/driver/AccidentReportScreen';
import AccidentReportHistoryScreen from '../screens/driver/AccidentReportHistoryScreen';
import TrafficFinesScreen from '../screens/driver/TrafficFinesScreen';

import { createStackNavigator } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function DriverTabs() {
  const { unreadCount } = useUnreadNotificationCount();
  const { expiringCount } = useExpiringDocumentCount();
  const insets = useSafeAreaInsets();

  return (
    // @ts-ignore
    <Tab.Navigator
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
          tabBarBadge: expiringCount > 0 ? expiringCount : undefined,
          tabBarBadgeStyle: expiringCount > 0 ? {
            backgroundColor: '#F59E0B',
            fontSize: 10,
            minWidth: 18,
            height: 18,
          } : undefined,
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
    </Tab.Navigator>
  );
}

export default function DriverNavigator() {
  return (
    // @ts-ignore
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.driver.primary },
        headerTintColor: theme.colors.text.white,
      }}
    >
      <Stack.Screen
        name="DriverTabs"
        component={DriverTabs}
        options={{ headerShown: false }}
      />

      {/* Detail Screens */}
      <Stack.Screen
        name="Leave Request"
        component={DriverHRScreen}
        options={{ title: 'Request Leave' }}
      />
      <Stack.Screen
        name="LeaveReturn"
        component={LeaveReturnScreen}
        options={{ title: 'Return from Leave' }}
      />
      <Stack.Screen
        name="My Requests"
        component={MyRequestsScreen}
        options={{ title: 'My Requests' }}
      />
      <Stack.Screen
        name="PassportHandover"
        component={PassportHandoverScreen}
        options={{ title: 'Passport Handover' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="VehicleDocuments"
        component={VehicleDocumentsScreen}
        options={{ title: 'Vehicle Documents' }}
      />
      <Stack.Screen
        name="Settlements"
        component={DriverTransactionHistoryScreen}
        options={{ title: 'Transaction History' }}
      />
      <Stack.Screen
        name="ShareAdjustmentRequest"
        component={ShareAdjustmentRequestScreen}
        options={{ title: 'Request Adjustment' }}
      />
      <Stack.Screen
        name="NOCRequest"
        component={NOCRequestScreen}
        options={{ title: 'NOC Request' }}
      />
      <Stack.Screen
        name="SalaryCertificate"
        component={SalaryCertificateScreen}
        options={{ title: 'Salary Certificate' }}
      />
      <Stack.Screen
        name="LoanCertificate"
        component={LoanCertificateScreen}
        options={{ title: 'Salary Advance' }}
      />
      <Stack.Screen
        name="ExitPermit"
        component={ExitPermitScreen}
        options={{ title: 'Exit Permit' }}
      />
      <Stack.Screen
        name="AccidentReport"
        component={AccidentReportScreen}
        options={{ title: 'Accident Report' }}
      />
      <Stack.Screen
        name="AccidentReportHistory"
        component={AccidentReportHistoryScreen}
        options={{ title: 'Accident Report History' }}
      />
      <Stack.Screen
        name="TrafficFines"
        component={TrafficFinesScreen}
        options={{ title: 'Traffic Fines' }}
      />
    </Stack.Navigator>
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
