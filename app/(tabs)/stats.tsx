import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSeasonStats } from '../../src/hooks/useStats';

export default function StatsScreen() {
  const { data: stats, isLoading, error } = useSeasonStats();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#228BE6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading stats</Text>
      </View>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No stats available yet</Text>
        <Text style={styles.subText}>Play some matches to see statistics</Text>
      </View>
    );
  }

  // Get top performers
  const topKills = [...stats].sort((a, b) => b.kills - a.kills).slice(0, 5);
  const topAces = [...stats].sort((a, b) => b.aces - a.aces).slice(0, 5);
  const topAssists = [...stats].sort((a, b) => b.assists - a.assists).slice(0, 5);

  const renderLeaderboard = (
    title: string,
    data: typeof stats,
    statKey: 'kills' | 'aces' | 'assists'
  ) => (
    <View style={styles.leaderboard}>
      <Text style={styles.leaderboardTitle}>{title}</Text>
      {data.map((player, index) => (
        <View key={player.playerId} style={styles.leaderRow}>
          <Text style={styles.rank}>#{index + 1}</Text>
          <Text style={styles.playerName}>
            {player.firstName} {player.lastName}
          </Text>
          <Text style={styles.statValue}>{player[statKey]}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {renderLeaderboard('Top Kills', topKills, 'kills')}
        {renderLeaderboard('Top Aces', topAces, 'aces')}
        {renderLeaderboard('Top Assists', topAssists, 'assists')}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  leaderboard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#228BE6',
    marginBottom: 12,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  rank: {
    width: 32,
    fontSize: 14,
    fontWeight: '600',
    color: '#868E96',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#228BE6',
  },
  errorText: {
    color: '#fa5252',
    fontSize: 16,
  },
  emptyText: {
    color: '#868E96',
    fontSize: 16,
  },
  subText: {
    color: '#adb5bd',
    fontSize: 14,
    marginTop: 8,
  },
});
