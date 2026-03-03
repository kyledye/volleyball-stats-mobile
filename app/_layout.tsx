import { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { OfflineProvider } from '../src/contexts/OfflineContext';
import { createAsyncStoragePersister } from '../src/lib/queryPersister';
import { getDatabase, migrateFromAsyncStorage } from '../src/lib/database';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep cached data longer for offline
    },
  },
});

// Create persister
const persister = createAsyncStoragePersister();

// Route handler - no auth required for basic usage
function RootLayoutNav() {
  const { isLoading } = useAuth();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function initDatabase() {
      try {
        // Initialize database (creates tables if needed)
        await getDatabase();
        // Migrate any existing data from AsyncStorage
        const migrated = await migrateFromAsyncStorage();
        if (migrated.teams > 0 || migrated.players > 0 || migrated.matches > 0) {
          console.log(`Migrated from AsyncStorage: ${migrated.teams} teams, ${migrated.players} players, ${migrated.matches} matches`);
        }
      } catch (error) {
        console.error('Database initialization error:', error);
      } finally {
        setDbReady(true);
      }
    }
    initDatabase();
  }, []);

  if (isLoading || !dbReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#228BE6" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#228BE6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="teams/new" options={{ title: 'Create Team' }} />
      <Stack.Screen name="teams/[id]" options={{ title: 'Team' }} />
      <Stack.Screen name="matches/new" options={{ title: 'Schedule Match' }} />
      <Stack.Screen name="match/[id]" options={{ title: 'Match' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <OfflineProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </OfflineProvider>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
