/**
 * Network Detection for Backend API
 * Auto-detects working backend URL from multiple candidates
 * Caches result for faster subsequent calls
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Backend URL candidates (will auto-detect which works)
const POSSIBLE_DEV_URLS = [
  'http://10.0.0.74:5000',       // Work network (current)
  'http://10.0.0.27:5000',       // Work network (alternative)
  'http://192.168.0.111:5000',   // Home network
  'http://localhost:5000',       // Localhost fallback
];

const PROD_BASE_URL = 'https://ostol.stsc.ae/api';

const CACHE_KEY = '@backend_url';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let cachedUrl: string | null = null;
let lastCheckTime = 0;

/**
 * Test if a backend URL is reachable
 */
async function testUrl(url: string, timeout = 2000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(\\/health\, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Detect working backend URL from candidates
 */
export async function detectBackendUrl(): Promise<string> {
  const now = Date.now();
  
  // Return cached URL if still valid
  if (cachedUrl && (now - lastCheckTime) < CACHE_DURATION) {
    return cachedUrl;
  }

  // Try to load from AsyncStorage
  try {
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    if (stored) {
      const { url, timestamp } = JSON.parse(stored);
      if (now - timestamp < CACHE_DURATION) {
        // Test if still working
        if (await testUrl(url)) {
          cachedUrl = url;
          lastCheckTime = now;
          console.log('✅ Using cached backend URL:', url);
          return url;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load cached backend URL:', error);
  }

  // Test all candidate URLs in parallel
  console.log('🔍 Auto-detecting backend URL...');
  const testPromises = POSSIBLE_DEV_URLS.map(async (url) => {
    const works = await testUrl(url);
    return { url, works };
  });

  const results = await Promise.all(testPromises);
  const workingUrl = results.find((r) => r.works);

  if (workingUrl) {
    cachedUrl = workingUrl.url;
    lastCheckTime = now;
    
    // Cache for next time
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ url: cachedUrl, timestamp: now })
      );
    } catch (error) {
      console.warn('Failed to cache backend URL:', error);
    }
    
    console.log('✅ Detected backend URL:', cachedUrl);
    return cachedUrl;
  }

  // Fallback to production if all dev URLs fail
  console.warn('⚠️ No local backend detected, using production');
  cachedUrl = PROD_BASE_URL;
  lastCheckTime = now;
  return cachedUrl;
}

/**
 * Get backend URL (with auto-detection)
 */
export async function getBackendUrl(): Promise<string> {
  return await detectBackendUrl();
}

/**
 * Clear cached backend URL (forces re-detection)
 */
export async function clearBackendCache(): Promise<void> {
  cachedUrl = null;
  lastCheckTime = 0;
  await AsyncStorage.removeItem(CACHE_KEY);
  console.log('🔄 Backend URL cache cleared');
}
