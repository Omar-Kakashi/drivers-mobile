/**
 * SkeletonLoader Component
 * Provides shimmer loading placeholders for better perceived performance
 * Replaces boring spinners with elegant animated placeholders
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Dimensions } from 'react-native';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Single skeleton element with shimmer animation
 */
export function Skeleton({ 
  width = '100%', 
  height = 16, 
  borderRadius = 4,
  style 
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View 
      style={[
        styles.skeleton, 
        { 
          width: width as any, 
          height, 
          borderRadius 
        },
        style
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

/**
 * Dashboard skeleton - matches DriverDashboardScreen layout
 */
export function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={120} height={24} style={{ marginLeft: 12 }} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Vehicle Card */}
      <Skeleton width={120} height={20} style={{ marginTop: 16, marginBottom: 8 }} />
      <View style={styles.cardSkeleton}>
        <Skeleton width="100%" height={180} borderRadius={0} />
        <View style={{ padding: 16 }}>
          <View style={styles.row}>
            <Skeleton width={100} height={24} />
            <Skeleton width={60} height={20} borderRadius={4} />
          </View>
          <Skeleton width={150} height={16} style={{ marginTop: 8 }} />
          <View style={[styles.row, { marginTop: 12 }]}>
            <Skeleton width={100} height={14} />
            <Skeleton width={80} height={14} />
          </View>
          <Skeleton width="100%" height={36} borderRadius={8} style={{ marginTop: 12 }} />
        </View>
      </View>

      {/* Balance Card */}
      <Skeleton width={80} height={20} style={{ marginTop: 20, marginBottom: 8 }} />
      <View style={[styles.cardSkeleton, { backgroundColor: theme.colors.primary, padding: 16 }]}>
        <View style={{ alignItems: 'center' }}>
          <Skeleton width={100} height={14} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <Skeleton width={160} height={36} style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </View>
        <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 16 }]} />
        <View style={styles.row}>
          <Skeleton width={80} height={30} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <Skeleton width={80} height={30} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </View>
      </View>

      {/* Quick Actions */}
      <Skeleton width={100} height={20} style={{ marginTop: 20, marginBottom: 8 }} />
      <View style={styles.actionsGrid}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.actionSkeleton}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <Skeleton width={60} height={12} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Balance screen skeleton
 */
export function BalanceSkeleton() {
  return (
    <View style={styles.container}>
      {/* Main Balance Card */}
      <View style={[styles.cardSkeleton, { backgroundColor: theme.colors.primary, padding: 20 }]}>
        <View style={{ alignItems: 'center' }}>
          <Skeleton width={120} height={14} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <Skeleton width={180} height={40} style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </View>
      </View>

      {/* Breakdown Cards */}
      <Skeleton width={100} height={20} style={{ marginTop: 20, marginBottom: 8 }} />
      <View style={styles.row}>
        {[1, 2].map(i => (
          <View key={i} style={[styles.cardSkeleton, { flex: 1, padding: 16, marginHorizontal: 4 }]}>
            <Skeleton width={60} height={12} />
            <Skeleton width={80} height={24} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>

      {/* Transaction List */}
      <Skeleton width={120} height={20} style={{ marginTop: 20, marginBottom: 8 }} />
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={[styles.cardSkeleton, { padding: 16, marginBottom: 8 }]}>
          <View style={styles.row}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Skeleton width={120} height={16} />
              <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
            </View>
            <Skeleton width={60} height={20} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Assignment list skeleton
 */
export function AssignmentListSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.cardSkeleton, { marginBottom: 12 }]}>
          <Skeleton width="100%" height={120} borderRadius={0} />
          <View style={{ padding: 16 }}>
            <View style={styles.row}>
              <Skeleton width={100} height={20} />
              <Skeleton width={60} height={18} borderRadius={4} />
            </View>
            <Skeleton width={150} height={14} style={{ marginTop: 8 }} />
            <View style={[styles.row, { marginTop: 12 }]}>
              <Skeleton width={80} height={12} />
              <Skeleton width={80} height={12} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Transaction list skeleton
 */
export function TransactionListSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <View key={i} style={[styles.cardSkeleton, { padding: 16, marginBottom: 8 }]}>
          <View style={styles.row}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Skeleton width={120} height={16} />
              <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
            </View>
            <Skeleton width={70} height={20} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Notification list skeleton
 */
export function NotificationListSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={[styles.cardSkeleton, { padding: 16, marginBottom: 8 }]}>
          <View style={styles.row}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Skeleton width="80%" height={16} />
              <Skeleton width="60%" height={14} style={{ marginTop: 6 }} />
              <Skeleton width={60} height={12} style={{ marginTop: 6 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  skeleton: {
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSkeleton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionSkeleton: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.small,
  },
});

export default Skeleton;
