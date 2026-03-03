/**
 * App configuration
 * Handles environment-specific settings
 */

import Constants from 'expo-constants';

// Environment types
type Environment = 'development' | 'staging' | 'production';

// Get current environment from Expo config
const getEnvironment = (): Environment => {
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;

  if (releaseChannel === 'production') return 'production';
  if (releaseChannel === 'staging') return 'staging';

  // Default to development (includes __DEV__ mode)
  return 'development';
};

// Environment-specific configurations
const configs = {
  development: {
    // For iOS simulator, use localhost
    // For Android emulator, use 10.0.2.2 (Android's localhost alias)
    // For physical device, use your computer's local IP
    apiUrl: 'http://localhost:3000/api',
    // Uncomment and update for physical device testing:
    // apiUrl: 'http://192.168.1.XXX:3000/api',
  },
  staging: {
    apiUrl: 'https://staging.volleyballstats.app/api',
  },
  production: {
    apiUrl: 'https://volleyballstats.app/api',
  },
};

// Current environment
export const ENV = getEnvironment();

// Export config for current environment
export const config = configs[ENV];

// Helper to check if we're in dev mode
export const isDev = ENV === 'development';
export const isProd = ENV === 'production';
