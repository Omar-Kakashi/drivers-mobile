/**
 * OptimizedImage Component
 * Uses expo-image for automatic caching, progressive loading, and blur placeholder
 * Much more efficient than standard React Native Image
 */

import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View, ViewStyle, ImageStyle } from 'react-native';
import { theme } from '../theme';

interface OptimizedImageProps {
  source: string | { uri: string } | number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: string | number;
  placeholderContentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  transition?: number;
  onLoad?: () => void;
  onError?: () => void;
}

// Blurhash placeholder for a neutral gray (fast to render)
const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

/**
 * OptimizedImage - Uses expo-image for superior caching and performance
 * 
 * Benefits:
 * - Automatic disk + memory caching
 * - Progressive loading with blur effect
 * - Native performance
 * - Reduced network usage
 */
export function OptimizedImage({
  source,
  style,
  containerStyle,
  contentFit = 'cover',
  placeholder,
  placeholderContentFit = 'cover',
  transition = 300,
  onLoad,
  onError,
}: OptimizedImageProps) {
  // Normalize source to URI string
  const imageSource = typeof source === 'string' 
    ? source 
    : typeof source === 'object' && 'uri' in source 
      ? source.uri 
      : source;

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={imageSource}
        style={[styles.image, style]}
        contentFit={contentFit}
        placeholder={placeholder || DEFAULT_BLURHASH}
        placeholderContentFit={placeholderContentFit}
        transition={transition}
        onLoad={onLoad}
        onError={onError}
        cachePolicy="memory-disk"
      />
    </View>
  );
}

/**
 * Preset configurations for common use cases
 */
export const ImagePresets = {
  /** Vehicle card image */
  vehicleCard: {
    contentFit: 'cover' as const,
    transition: 200,
  },
  
  /** Profile avatar */
  avatar: (size: number) => ({
    style: { width: size, height: size, borderRadius: size / 2 } as ImageStyle,
    contentFit: 'cover' as const,
  }),
  
  /** Full width banner */
  banner: {
    style: { width: '100%', height: 180 } as ImageStyle,
    contentFit: 'cover' as const,
  },
  
  /** Document thumbnail */
  thumbnail: {
    style: { width: 80, height: 80, borderRadius: 8 } as ImageStyle,
    contentFit: 'cover' as const,
  },
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default OptimizedImage;
