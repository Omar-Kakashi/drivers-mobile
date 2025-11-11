/**
 * API Client with Network Detection
 * Automatically detects and uses working backend URL
 */

import axios, { AxiosInstance } from 'axios';
import { getBackendUrl } from '../utils/networkDetection';

let apiClient: AxiosInstance | null = null;

/**
 * Get or create API client with auto-detected backend URL
 */
export async function getApiClient(): Promise<AxiosInstance> {
  if (!apiClient) {
    const baseURL = await getBackendUrl();
    
    apiClient = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log requests in development
    if (__DEV__) {
      apiClient.interceptors.request.use((config) => {
        console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
        return config;
      });

      apiClient.interceptors.response.use(
        (response) => {
          console.log('✅ API Response:', response.config.url, response.status);
          return response;
        },
        (error) => {
          console.error('❌ API Error:', error.config?.url, error.message);
          return Promise.reject(error);
        }
      );
    }
  }

  return apiClient;
}

/**
 * Reset API client (forces backend URL re-detection)
 */
export function resetApiClient(): void {
  apiClient = null;
}
