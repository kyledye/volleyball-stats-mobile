import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Play {
  id: string;
  type: string;
  result: string;
  player: { number: number; firstName: string; lastName: string } | null;
  timestamp: string;
}

interface RecentPlaysProps {
  plays: Play[];
}

// Map play types to display names
const playTypeLabels: Record<string, string> = {
  SERVE: 'Serve',
  ATTACK: 'Attack',
  BLOCK: 'Block',
  SERVE_RECEIVE: 'Receive',
  PASS: 'Pass',
  SECOND_TOUCH: '2nd Touch',
};

// Map results to colors and icons
const resultConfig: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  ACE: { color: '#40c057', icon: 'flash', label: 'Ace' },
  KILL: { color: '#40c057', icon: 'flame', label: 'Kill' },
  ASSIST: { color: '#40c057', icon: 'hand-left', label: 'Assist' },
  ERROR: { color: '#fa5252', icon: 'close-circle', label: 'Error' },
  IN_PLAY: { color: '#868E96', icon: 'arrow-forward', label: 'In Play' },
  PASS_4: { color: '#40c057', icon: 'checkmark-circle', label: '4' },
  PASS_3: { color: '#82c91e', icon: 'checkmark', label: '3' },
  PASS_2: { color: '#fab005', icon: 'remove', label: '2' },
  PASS_1: { color: '#fd7e14', icon: 'alert', label: '1' },
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function RecentPlays({ plays }: RecentPlaysProps) {
  if (plays.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recent Plays</Text>
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={32} color="#dee2e6" />
          <Text style={styles.emptyText}>No plays recorded yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Plays</Text>
      {plays.map((play, index) => {
        const config = resultConfig[play.result] || {
          color: '#868E96',
          icon: 'help-circle' as keyof typeof Ionicons.glyphMap,
          label: play.result,
        };

        return (
          <View
            key={play.id}
            style={[styles.playItem, index === 0 && styles.playItemFirst]}
          >
            <View style={[styles.resultBadge, { backgroundColor: config.color }]}>
              <Ionicons name={config.icon} size={16} color="#fff" />
            </View>
            <View style={styles.playInfo}>
              <Text style={styles.playType}>
                {playTypeLabels[play.type] || play.type}
                {' - '}
                <Text style={[styles.playResult, { color: config.color }]}>
                  {config.label}
                </Text>
              </Text>
              {play.player && (
                <Text style={styles.playerName}>
                  #{play.player.number} {play.player.firstName} {play.player.lastName}
                </Text>
              )}
            </View>
            <Text style={styles.timestamp}>{formatTime(play.timestamp)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 8,
    color: '#868E96',
    fontSize: 14,
  },
  playItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
  playItemFirst: {
    borderTopWidth: 0,
  },
  resultBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playInfo: {
    flex: 1,
  },
  playType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  playResult: {
    fontWeight: '600',
  },
  playerName: {
    fontSize: 12,
    color: '#868E96',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#adb5bd',
  },
});
