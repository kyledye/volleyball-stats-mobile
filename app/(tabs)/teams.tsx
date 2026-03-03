import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getLocalTeams, getLocalPlayers, LocalTeam } from '../../src/lib/database';

interface TeamWithCount extends LocalTeam {
  playerCount: number;
}

export default function TeamsScreen() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const allTeams = await getLocalTeams();
      // Filter to only show our teams (not opponents)
      const myTeams = allTeams.filter(t => !t.isOpponent);

      // Get player counts
      const teamsWithCounts = await Promise.all(
        myTeams.map(async team => {
          const players = await getLocalPlayers(team.id);
          return { ...team, playerCount: players.length };
        })
      );

      setTeams(teamsWithCounts);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTeams();
    }, [loadTeams])
  );

  const renderTeam = ({ item }: { item: TeamWithCount }) => {
    return (
      <TouchableOpacity
        style={styles.teamCard}
        onPress={() => router.push(`/teams/${item.id}`)}
      >
        <View style={styles.teamIcon}>
          <Ionicons name="people" size={28} color="#228BE6" />
        </View>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{item.name}</Text>
          {item.school && (
            <Text style={styles.schoolText}>{item.school}</Text>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.playerCount}>
              {item.playerCount} {item.playerCount === 1 ? 'player' : 'players'}
            </Text>
            {item.season && (
              <View style={styles.seasonBadge}>
                <Text style={styles.seasonText}>{item.season}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#868E96" />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#228BE6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#dee2e6" />
            <Text style={styles.emptyText}>No teams yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first team</Text>
          </View>
        }
      />

      {/* Add Team FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/teams/new')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e7f5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  schoolText: {
    fontSize: 14,
    color: '#495057',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  playerCount: {
    fontSize: 12,
    color: '#868E96',
  },
  seasonBadge: {
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  seasonText: {
    fontSize: 11,
    color: '#495057',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#868E96',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#adb5bd',
    fontSize: 14,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#228BE6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
