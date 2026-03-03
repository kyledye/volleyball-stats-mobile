import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocalMatches } from '../../src/hooks/useLocalMatches';
import { LocalMatch } from '../../src/lib/database';

export default function MatchesScreen() {
  const router = useRouter();
  const { matches, isLoading } = useLocalMatches();

  const renderMatch = ({ item }: { item: LocalMatch }) => {
    const dateStr = new Date(item.date).toLocaleDateString();
    const isCompleted = item.status === 'COMPLETED';
    const isInProgress = item.status === 'IN_PROGRESS';

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => router.push(`/match/${item.id}`)}
      >
        <View style={styles.matchHeader}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <View style={[
            styles.statusBadge,
            isCompleted && styles.statusCompleted,
            isInProgress && styles.statusInProgress,
          ]}>
            <Text style={styles.statusText}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        <View style={styles.teamsContainer}>
          <Text style={styles.teamName}>{item.homeTeamName}</Text>
          <Text style={styles.score}>
            {item.homeSetsWon} - {item.awaySetsWon}
          </Text>
          <Text style={[styles.teamName, styles.teamNameRight]}>{item.awayTeamName}</Text>
        </View>
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
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color="#dee2e6" />
            <Text style={styles.emptyText}>No matches yet</Text>
            <Text style={styles.emptySubtext}>Tap + to start a new match</Text>
          </View>
        }
      />

      {/* New Match FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/matches/new')}
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
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#e9ecef',
  },
  statusCompleted: {
    backgroundColor: '#d3f9d8',
  },
  statusInProgress: {
    backgroundColor: '#fff3bf',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  teamNameRight: {
    textAlign: 'right',
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#228BE6',
    paddingHorizontal: 16,
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
