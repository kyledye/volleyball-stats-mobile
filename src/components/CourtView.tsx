import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CourtPlayer {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
  position: number;
  isLibero: boolean;
}

interface CourtViewProps {
  players: CourtPlayer[];
  selectedPlayer: string | null;
  onSelectPlayer: (playerId: string) => void;
  isServing: boolean | null;
}

// Court positions in volleyball (1-6), mapped to visual grid positions
// Position 1 = back right (server), Position 4 = front left
const positionLayout = [
  { position: 4, row: 0, col: 0 }, // Front left
  { position: 3, row: 0, col: 1 }, // Front center
  { position: 2, row: 0, col: 2 }, // Front right
  { position: 5, row: 1, col: 0 }, // Back left
  { position: 6, row: 1, col: 1 }, // Back center
  { position: 1, row: 1, col: 2 }, // Back right (server)
];

export default function CourtView({
  players,
  selectedPlayer,
  onSelectPlayer,
  isServing,
}: CourtViewProps) {
  const getPlayerAtPosition = (position: number) => {
    return players.find(p => p.position === position);
  };

  return (
    <View style={styles.container}>
      <View style={styles.court}>
        {/* Net indicator */}
        <View style={styles.netContainer}>
          <View style={styles.net} />
          <Text style={styles.netLabel}>NET</Text>
        </View>

        {/* Court grid */}
        <View style={styles.courtGrid}>
          {[0, 1].map(row => (
            <View key={row} style={styles.courtRow}>
              {positionLayout
                .filter(p => p.row === row)
                .sort((a, b) => a.col - b.col)
                .map(({ position }) => {
                  const player = getPlayerAtPosition(position);
                  const isSelected = player?.id === selectedPlayer;
                  const isServer = position === 1 && isServing === true;

                  return (
                    <TouchableOpacity
                      key={position}
                      style={[
                        styles.playerSlot,
                        isSelected && styles.playerSelected,
                        player?.isLibero && styles.playerLibero,
                      ]}
                      onPress={() => player && onSelectPlayer(player.id)}
                      disabled={!player}
                    >
                      {player ? (
                        <>
                          <Text
                            style={[
                              styles.playerNumber,
                              isSelected && styles.playerNumberSelected,
                            ]}
                          >
                            {player.number}
                          </Text>
                          <Text
                            style={[
                              styles.playerName,
                              isSelected && styles.playerNameSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {player.firstName.charAt(0)}. {player.lastName}
                          </Text>
                          {isServer && (
                            <View style={styles.serverBadge}>
                              <Text style={styles.serverBadgeText}>S</Text>
                            </View>
                          )}
                        </>
                      ) : (
                        <Text style={styles.emptySlot}>-</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </View>
          ))}
        </View>

        {/* Position labels */}
        <View style={styles.positionLabels}>
          <Text style={styles.positionLabel}>Front Row</Text>
          <Text style={styles.positionLabel}>Back Row</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  court: {
    backgroundColor: '#e8f4ea',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#40c057',
  },
  netContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  net: {
    width: '100%',
    height: 3,
    backgroundColor: '#495057',
  },
  netLabel: {
    fontSize: 10,
    color: '#868E96',
    marginTop: 2,
  },
  courtGrid: {
    gap: 8,
  },
  courtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  playerSlot: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderWidth: 2,
    borderColor: '#dee2e6',
    position: 'relative',
  },
  playerSelected: {
    borderColor: '#228BE6',
    backgroundColor: '#e7f5ff',
  },
  playerLibero: {
    backgroundColor: '#fff9db',
    borderColor: '#fab005',
  },
  playerNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495057',
  },
  playerNumberSelected: {
    color: '#228BE6',
  },
  playerName: {
    fontSize: 10,
    color: '#868E96',
    textAlign: 'center',
  },
  playerNameSelected: {
    color: '#228BE6',
  },
  emptySlot: {
    fontSize: 24,
    color: '#dee2e6',
  },
  serverBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#228BE6',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  positionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  positionLabel: {
    fontSize: 10,
    color: '#868E96',
  },
});
