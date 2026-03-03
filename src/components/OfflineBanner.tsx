import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { useOffline } from '../contexts/OfflineContext';

export default function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: !isOnline || pendingCount > 0 ? 0 : -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, pendingCount, slideAnim]);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        !isOnline ? styles.offline : styles.syncing,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={!isOnline ? 'cloud-offline' : 'cloud-upload'}
          size={18}
          color="#fff"
        />
        <Text style={styles.text}>
          {!isOnline
            ? 'You are offline. Changes will sync when connected.'
            : isSyncing
            ? `Syncing ${pendingCount} pending changes...`
            : `${pendingCount} changes pending`}
        </Text>
      </View>
      {isOnline && pendingCount > 0 && !isSyncing && (
        <TouchableOpacity style={styles.syncButton} onPress={syncNow}>
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 1000,
  },
  offline: {
    backgroundColor: '#fa5252',
  },
  syncing: {
    backgroundColor: '#fd7e14',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  syncButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
