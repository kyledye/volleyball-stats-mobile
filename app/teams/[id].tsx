import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getLocalTeams,
  getLocalPlayers,
  saveLocalPlayer,
  deleteLocalPlayer,
  deleteLocalTeam,
  LocalTeam,
  LocalPlayer,
  generateId,
} from '../../src/lib/database';

const POSITION_OPTIONS = [
  { value: 'SETTER', label: 'Setter' },
  { value: 'OUTSIDE_HITTER', label: 'Outside Hitter' },
  { value: 'MIDDLE_BLOCKER', label: 'Middle Blocker' },
  { value: 'OPPOSITE', label: 'Opposite' },
  { value: 'LIBERO', label: 'Libero' },
  { value: 'DEFENSIVE_SPECIALIST', label: 'DS' },
];

const positionLabels: Record<string, string> = {
  SETTER: 'Setter',
  OUTSIDE_HITTER: 'OH',
  MIDDLE_BLOCKER: 'MB',
  OPPOSITE: 'OPP',
  LIBERO: 'Libero',
  DEFENSIVE_SPECIALIST: 'DS',
};

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [team, setTeam] = useState<LocalTeam | null>(null);
  const [players, setPlayers] = useState<LocalPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add player modal
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [playerNumber, setPlayerNumber] = useState('');
  const [playerFirstName, setPlayerFirstName] = useState('');
  const [playerLastName, setPlayerLastName] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);

  // Edit player modal
  const [editingPlayer, setEditingPlayer] = useState<LocalPlayer | null>(null);

  const loadTeam = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const teams = await getLocalTeams();
      const foundTeam = teams.find(t => t.id === id);
      setTeam(foundTeam || null);

      if (foundTeam) {
        const teamPlayers = await getLocalPlayers(foundTeam.id);
        // Sort by number
        teamPlayers.sort((a, b) => a.number - b.number);
        setPlayers(teamPlayers);
      }
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadTeam();
    }, [loadTeam])
  );

  const handleAddPlayer = async () => {
    if (!team) return;

    if (!playerNumber || !playerFirstName.trim()) {
      Alert.alert('Error', 'Player number and first name are required');
      return;
    }

    const num = parseInt(playerNumber);
    if (isNaN(num) || num < 0 || num > 99) {
      Alert.alert('Error', 'Player number must be between 0 and 99');
      return;
    }

    // Check for duplicate number
    if (players.some(p => p.number === num)) {
      Alert.alert('Error', `Player #${num} already exists on this team`);
      return;
    }

    setAddingPlayer(true);
    try {
      const player: LocalPlayer = {
        id: generateId(),
        teamId: team.id,
        number: num,
        firstName: playerFirstName.trim(),
        lastName: playerLastName.trim(),
        position: playerPosition || undefined,
      };

      await saveLocalPlayer(player);
      setPlayers(prev => [...prev, player].sort((a, b) => a.number - b.number));

      // Reset form
      setPlayerNumber('');
      setPlayerFirstName('');
      setPlayerLastName('');
      setPlayerPosition('');
      setShowAddPlayer(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to add player');
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;

    const num = parseInt(playerNumber);
    if (isNaN(num) || num < 0 || num > 99) {
      Alert.alert('Error', 'Player number must be between 0 and 99');
      return;
    }

    // Check for duplicate number (excluding current player)
    if (players.some(p => p.number === num && p.id !== editingPlayer.id)) {
      Alert.alert('Error', `Player #${num} already exists on this team`);
      return;
    }

    try {
      const updated: LocalPlayer = {
        ...editingPlayer,
        number: num,
        firstName: playerFirstName.trim(),
        lastName: playerLastName.trim(),
        position: playerPosition || undefined,
      };

      await saveLocalPlayer(updated);
      setPlayers(prev =>
        prev.map(p => (p.id === updated.id ? updated : p)).sort((a, b) => a.number - b.number)
      );
      setEditingPlayer(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to update player');
    }
  };

  const handleDeletePlayer = (player: LocalPlayer) => {
    Alert.alert(
      'Delete Player',
      `Are you sure you want to remove ${player.firstName} ${player.lastName} from the roster?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteLocalPlayer(player.id);
            setPlayers(prev => prev.filter(p => p.id !== player.id));
          },
        },
      ]
    );
  };

  const handleDeleteTeam = () => {
    if (!team) return;

    Alert.alert(
      'Delete Team',
      `Are you sure you want to delete ${team.name}? This will also remove all players.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Delete all players first
            for (const player of players) {
              await deleteLocalPlayer(player.id);
            }
            await deleteLocalTeam(team.id);
            router.back();
          },
        },
      ]
    );
  };

  const openEditPlayer = (player: LocalPlayer) => {
    setPlayerNumber(player.number.toString());
    setPlayerFirstName(player.firstName);
    setPlayerLastName(player.lastName);
    setPlayerPosition(player.position || '');
    setEditingPlayer(player);
  };

  const closeEditPlayer = () => {
    setEditingPlayer(null);
    setPlayerNumber('');
    setPlayerFirstName('');
    setPlayerLastName('');
    setPlayerPosition('');
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#228BE6" />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Team not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: team.name,
          headerStyle: { backgroundColor: '#228BE6' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleDeleteTeam} style={{ marginRight: 8 }}>
              <Ionicons name="trash-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {/* Team Info */}
        <View style={styles.infoCard}>
          {team.school && (
            <Text style={styles.schoolText}>{team.school}</Text>
          )}
          {team.season && (
            <View style={styles.seasonBadge}>
              <Text style={styles.seasonText}>{team.season}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{players.length}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
        </View>

        {/* Roster */}
        <View style={styles.rosterSection}>
          <View style={styles.rosterHeader}>
            <Text style={styles.sectionTitle}>Roster</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddPlayer(true)}
            >
              <Ionicons name="add" size={20} color="#228BE6" />
              <Text style={styles.addButtonText}>Add Player</Text>
            </TouchableOpacity>
          </View>

          {players.length === 0 ? (
            <View style={styles.emptyRoster}>
              <Text style={styles.emptyText}>No players on roster yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddPlayer(true)}
              >
                <Text style={styles.emptyButtonText}>Add First Player</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.playerList}>
              {players.map(player => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.playerRow}
                  onPress={() => openEditPlayer(player)}
                >
                  <View style={styles.playerNumber}>
                    <Text style={styles.playerNumberText}>{player.number}</Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                      {player.firstName} {player.lastName}
                    </Text>
                    {player.position && (
                      <Text style={styles.playerPosition}>
                        {positionLabels[player.position] || player.position}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#adb5bd" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Player Modal */}
      <Modal
        visible={showAddPlayer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddPlayer(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddPlayer(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Player</Text>
            <TouchableOpacity onPress={handleAddPlayer} disabled={addingPlayer}>
              <Text style={[styles.modalSave, addingPlayer && { opacity: 0.5 }]}>
                {addingPlayer ? 'Adding...' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Jersey Number *</Text>
              <TextInput
                style={[styles.input, styles.numberInput]}
                value={playerNumber}
                onChangeText={setPlayerNumber}
                placeholder="0-99"
                placeholderTextColor="#adb5bd"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={playerFirstName}
                onChangeText={setPlayerFirstName}
                placeholder="e.g., Sarah"
                placeholderTextColor="#adb5bd"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={playerLastName}
                onChangeText={setPlayerLastName}
                placeholder="e.g., Johnson"
                placeholderTextColor="#adb5bd"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Position</Text>
              <View style={styles.positionGrid}>
                {POSITION_OPTIONS.map(pos => (
                  <TouchableOpacity
                    key={pos.value}
                    style={[
                      styles.positionButton,
                      playerPosition === pos.value && styles.positionButtonSelected,
                    ]}
                    onPress={() => setPlayerPosition(
                      playerPosition === pos.value ? '' : pos.value
                    )}
                  >
                    <Text style={[
                      styles.positionButtonText,
                      playerPosition === pos.value && styles.positionButtonTextSelected,
                    ]}>
                      {pos.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Player Modal */}
      <Modal
        visible={!!editingPlayer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEditPlayer}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeEditPlayer}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Player</Text>
            <TouchableOpacity onPress={handleUpdatePlayer}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Jersey Number *</Text>
              <TextInput
                style={[styles.input, styles.numberInput]}
                value={playerNumber}
                onChangeText={setPlayerNumber}
                placeholder="0-99"
                placeholderTextColor="#adb5bd"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={playerFirstName}
                onChangeText={setPlayerFirstName}
                placeholder="e.g., Sarah"
                placeholderTextColor="#adb5bd"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={playerLastName}
                onChangeText={setPlayerLastName}
                placeholder="e.g., Johnson"
                placeholderTextColor="#adb5bd"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Position</Text>
              <View style={styles.positionGrid}>
                {POSITION_OPTIONS.map(pos => (
                  <TouchableOpacity
                    key={pos.value}
                    style={[
                      styles.positionButton,
                      playerPosition === pos.value && styles.positionButtonSelected,
                    ]}
                    onPress={() => setPlayerPosition(
                      playerPosition === pos.value ? '' : pos.value
                    )}
                  >
                    <Text style={[
                      styles.positionButtonText,
                      playerPosition === pos.value && styles.positionButtonTextSelected,
                    ]}>
                      {pos.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                if (editingPlayer) {
                  closeEditPlayer();
                  handleDeletePlayer(editingPlayer);
                }
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#fa5252" />
              <Text style={styles.deleteButtonText}>Remove from Roster</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
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
  },
  errorText: {
    color: '#fa5252',
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 12,
    backgroundColor: '#228BE6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  schoolText: {
    fontSize: 16,
    color: '#495057',
  },
  seasonBadge: {
    backgroundColor: '#e7f5ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seasonText: {
    fontSize: 14,
    color: '#228BE6',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#228BE6',
  },
  statLabel: {
    fontSize: 14,
    color: '#868E96',
    marginTop: 4,
  },
  rosterSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingBottom: 24,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#228BE6',
    fontWeight: '600',
  },
  emptyRoster: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#868E96',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#228BE6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  playerList: {
    paddingHorizontal: 16,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  playerNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#228BE6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  playerPosition: {
    fontSize: 13,
    color: '#868E96',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalCancel: {
    fontSize: 17,
    color: '#228BE6',
  },
  modalSave: {
    fontSize: 17,
    color: '#228BE6',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  numberInput: {
    width: 80,
    textAlign: 'center',
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f3f5',
  },
  positionButtonSelected: {
    backgroundColor: '#228BE6',
  },
  positionButtonText: {
    fontSize: 14,
    color: '#495057',
  },
  positionButtonTextSelected: {
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#fa5252',
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fa5252',
    fontWeight: '600',
  },
});
