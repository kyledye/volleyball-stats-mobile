import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  LayoutRectangle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LocalPlayer } from '../lib/database';

interface LineupSetupProps {
  players: LocalPlayer[];
  teamName: string;
  onStartMatch: (positions: Record<number, string>, liberoId: string | null) => void;
  onAddPlayer: (player: Omit<LocalPlayer, 'id'>) => Promise<LocalPlayer>;
  loading?: boolean;
}

interface PositionLayout {
  position: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Draggable player card component
function DraggablePlayer({
  player,
  isAssigned,
  isLibero,
  onDragEnd,
  onLongPress,
  onTap,
}: {
  player: LocalPlayer;
  isAssigned: boolean;
  isLibero: boolean;
  onDragEnd: (playerId: string, x: number, y: number) => void;
  onLongPress: () => void;
  onTap: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const scale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      scale.value = withSpring(1.1);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      isDragging.value = false;
      scale.value = withSpring(1);
      runOnJS(onDragEnd)(player.id, event.absoluteX, event.absoluteY);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onEnd(() => {
      runOnJS(onLongPress)();
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onTap)();
    });

  const composedGesture = Gesture.Race(
    panGesture,
    Gesture.Simultaneous(longPressGesture, tapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: isDragging.value ? 100 : 1,
    opacity: isDragging.value ? 0.9 : 1,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.rosterPlayer,
          isAssigned && styles.rosterPlayerAssigned,
          isLibero && styles.rosterPlayerLibero,
          animatedStyle,
        ]}
      >
        <Text style={[styles.rosterNumber, isAssigned && styles.rosterTextAssigned]}>
          #{player.number}
        </Text>
        <Text
          style={[styles.rosterName, isAssigned && styles.rosterTextAssigned]}
          numberOfLines={1}
        >
          {player.firstName}
        </Text>
        {isLibero && (
          <View style={styles.liberoBadge}>
            <Text style={styles.liberoBadgeText}>L</Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

export default function LineupSetup({
  players,
  teamName,
  onStartMatch,
  onAddPlayer,
  loading,
}: LineupSetupProps) {
  const [positions, setPositions] = useState<Record<number, string>>({});
  const [liberoId, setLiberoId] = useState<string | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerFirstName, setNewPlayerFirstName] = useState('');
  const [newPlayerLastName, setNewPlayerLastName] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [positionLayouts, setPositionLayouts] = useState<PositionLayout[]>([]);
  const containerRef = useRef<View>(null);

  const assignedPlayerIds = Object.values(positions);

  const handleAssignPosition = (position: number, playerId: string) => {
    // If player is already in another position, remove them first
    const existingPos = Object.entries(positions).find(([_, id]) => id === playerId);
    if (existingPos) {
      setPositions(prev => {
        const newPositions = { ...prev };
        delete newPositions[parseInt(existingPos[0])];
        return { ...newPositions, [position]: playerId };
      });
    } else {
      setPositions(prev => ({ ...prev, [position]: playerId }));
    }
  };

  const handleRemovePosition = (position: number) => {
    setPositions(prev => {
      const newPositions = { ...prev };
      delete newPositions[position];
      return newPositions;
    });
  };

  const handleSetLibero = (playerId: string) => {
    // Remove from court positions if assigned
    const positionEntry = Object.entries(positions).find(([_, id]) => id === playerId);
    if (positionEntry) {
      handleRemovePosition(parseInt(positionEntry[0]));
    }
    setLiberoId(playerId);
  };

  const handleClearLibero = () => {
    setLiberoId(null);
  };

  const handleAddPlayer = async () => {
    if (!newPlayerNumber || !newPlayerFirstName) {
      Alert.alert('Error', 'Please enter player number and first name');
      return;
    }

    setAddingPlayer(true);
    try {
      await onAddPlayer({
        teamId: '',
        number: parseInt(newPlayerNumber),
        firstName: newPlayerFirstName,
        lastName: newPlayerLastName,
      });
      setNewPlayerNumber('');
      setNewPlayerFirstName('');
      setNewPlayerLastName('');
      setShowAddPlayer(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to add player');
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleStartMatch = () => {
    const filledPositions = Object.keys(positions).length;
    if (filledPositions < 6) {
      Alert.alert('Incomplete Lineup', `Please assign all 6 positions (${filledPositions}/6 filled)`);
      return;
    }
    onStartMatch(positions, liberoId);
  };

  const handleDragEnd = (playerId: string, absoluteX: number, absoluteY: number) => {
    // Find which position the player was dropped on
    for (const layout of positionLayouts) {
      if (
        absoluteX >= layout.x &&
        absoluteX <= layout.x + layout.width &&
        absoluteY >= layout.y &&
        absoluteY <= layout.y + layout.height
      ) {
        // Check if position is already filled
        const currentPlayerId = positions[layout.position];
        if (currentPlayerId && currentPlayerId !== playerId) {
          // Swap players
          const draggedPlayerPos = Object.entries(positions).find(([_, id]) => id === playerId);
          if (draggedPlayerPos) {
            setPositions(prev => ({
              ...prev,
              [layout.position]: playerId,
              [parseInt(draggedPlayerPos[0])]: currentPlayerId,
            }));
          } else {
            // Dragged from bench, just replace
            handleAssignPosition(layout.position, playerId);
          }
        } else {
          handleAssignPosition(layout.position, playerId);
        }
        return;
      }
    }
  };

  const measurePosition = (position: number, event: { nativeEvent: { layout: LayoutRectangle } }) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    // We need absolute coordinates, so measure relative to screen
    containerRef.current?.measureInWindow((containerX, containerY) => {
      setPositionLayouts(prev => {
        const filtered = prev.filter(p => p.position !== position);
        return [...filtered, { position, x: containerX + x, y: containerY + y, width, height }];
      });
    });
  };

  const getPlayerById = (id: string) => players.find(p => p.id === id);

  const renderPositionSlot = (pos: number, label: string) => {
    const player = positions[pos] ? getPlayerById(positions[pos]) : null;
    return (
      <TouchableOpacity
        key={pos}
        style={[styles.positionSlot, player && styles.positionFilled]}
        onLayout={(e) => measurePosition(pos, e)}
        onPress={() => {
          if (player) {
            handleRemovePosition(pos);
          }
        }}
      >
        {player ? (
          <>
            <Text style={styles.playerNumber}>#{player.number}</Text>
            <Text style={styles.playerName} numberOfLines={1}>
              {player.firstName}
            </Text>
            <Ionicons name="close-circle" size={14} color="#fa5252" style={styles.removeIcon} />
          </>
        ) : (
          <>
            <Text style={styles.positionNumber}>{pos}</Text>
            <Text style={styles.positionLabel}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} ref={containerRef}>
      <Text style={styles.title}>Set Up Lineup</Text>
      <Text style={styles.subtitle}>{teamName}</Text>

      {/* Court Positions */}
      <View style={styles.courtContainer}>
        <Text style={styles.sectionTitle}>Starting 6 (drag players here)</Text>
        <View style={styles.courtGrid}>
          {/* Front Row */}
          <View style={styles.courtRow}>
            {renderPositionSlot(4, 'OH')}
            {renderPositionSlot(3, 'MH')}
            {renderPositionSlot(2, 'RS')}
          </View>
          {/* Back Row */}
          <View style={styles.courtRow}>
            {renderPositionSlot(5, 'OH')}
            {renderPositionSlot(6, 'MH')}
            {renderPositionSlot(1, 'SRV')}
          </View>
        </View>
      </View>

      {/* Libero */}
      <View style={styles.liberoContainer}>
        <Text style={styles.liberoLabel}>Libero:</Text>
        {liberoId ? (
          <TouchableOpacity style={styles.liberoSlot} onPress={handleClearLibero}>
            <Text style={styles.liberoPlayerNumber}>#{getPlayerById(liberoId)?.number}</Text>
            <Text style={styles.liberoPlayerName}>{getPlayerById(liberoId)?.firstName}</Text>
            <Ionicons name="close-circle" size={16} color="#fa5252" />
          </TouchableOpacity>
        ) : (
          <Text style={styles.liberoHint}>Long-press player to set</Text>
        )}
      </View>

      {/* Available Players */}
      <View style={styles.rosterContainer}>
        <View style={styles.rosterHeader}>
          <Text style={styles.sectionTitle}>Roster</Text>
          <TouchableOpacity
            style={styles.addPlayerButton}
            onPress={() => setShowAddPlayer(true)}
          >
            <Ionicons name="add" size={20} color="#228BE6" />
            <Text style={styles.addPlayerText}>Add Player</Text>
          </TouchableOpacity>
        </View>

        {players.length === 0 ? (
          <View style={styles.emptyRoster}>
            <Text style={styles.emptyText}>No players yet</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => setShowAddPlayer(true)}
            >
              <Text style={styles.addFirstText}>Add Your First Player</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rosterScroll}
            contentContainerStyle={styles.rosterContent}
          >
            {players.map(player => {
              const isAssigned = assignedPlayerIds.includes(player.id);
              const isLibero = player.id === liberoId;

              return (
                <DraggablePlayer
                  key={player.id}
                  player={player}
                  isAssigned={isAssigned}
                  isLibero={isLibero}
                  onDragEnd={handleDragEnd}
                  onLongPress={() => {
                    if (!isAssigned && !isLibero) {
                      handleSetLibero(player.id);
                    }
                  }}
                  onTap={() => {
                    if (isLibero) {
                      handleClearLibero();
                    } else if (isAssigned) {
                      const pos = Object.entries(positions).find(([_, id]) => id === player.id);
                      if (pos) handleRemovePosition(parseInt(pos[0]));
                    }
                  }}
                />
              );
            })}
          </ScrollView>
        )}
        <Text style={styles.rosterHint}>Drag to court • Long press for libero • Tap to remove</Text>
      </View>

      {/* Add Player Form */}
      {showAddPlayer && (
        <View style={styles.addPlayerForm}>
          <View style={styles.addPlayerHeader}>
            <Text style={styles.addPlayerTitle}>Add Player</Text>
            <TouchableOpacity onPress={() => setShowAddPlayer(false)}>
              <Ionicons name="close" size={24} color="#495057" />
            </TouchableOpacity>
          </View>
          <View style={styles.addPlayerRow}>
            <TextInput
              style={[styles.addPlayerInput, styles.numberInput]}
              placeholder="#"
              placeholderTextColor="#adb5bd"
              keyboardType="number-pad"
              value={newPlayerNumber}
              onChangeText={setNewPlayerNumber}
            />
            <TextInput
              style={[styles.addPlayerInput, styles.nameInput]}
              placeholder="First Name"
              placeholderTextColor="#adb5bd"
              value={newPlayerFirstName}
              onChangeText={setNewPlayerFirstName}
            />
            <TextInput
              style={[styles.addPlayerInput, styles.nameInput]}
              placeholder="Last Name"
              placeholderTextColor="#adb5bd"
              value={newPlayerLastName}
              onChangeText={setNewPlayerLastName}
            />
          </View>
          <TouchableOpacity
            style={[styles.addPlayerSubmit, addingPlayer && styles.addPlayerSubmitDisabled]}
            onPress={handleAddPlayer}
            disabled={addingPlayer}
          >
            <Text style={styles.addPlayerSubmitText}>
              {addingPlayer ? 'Adding...' : 'Add Player'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Start Match Button */}
      <TouchableOpacity
        style={[styles.startButton, loading && styles.startButtonDisabled]}
        onPress={handleStartMatch}
        disabled={loading}
      >
        <Text style={styles.startButtonText}>
          {loading ? 'Starting...' : 'Start Match'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#868E96',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  courtContainer: {
    marginBottom: 8,
  },
  courtGrid: {
    backgroundColor: '#e8f4ea',
    borderRadius: 6,
    padding: 8,
    borderWidth: 2,
    borderColor: '#40c057',
  },
  courtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  positionSlot: {
    width: '31%',
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  positionFilled: {
    borderColor: '#228BE6',
    borderStyle: 'solid',
    backgroundColor: '#e7f5ff',
  },
  positionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dee2e6',
  },
  positionLabel: {
    fontSize: 9,
    color: '#adb5bd',
  },
  playerNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#228BE6',
  },
  playerName: {
    fontSize: 10,
    color: '#495057',
  },
  removeIcon: {
    position: 'absolute',
    top: 1,
    right: 1,
  },
  liberoContainer: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff9db',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fab005',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liberoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  liberoSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liberoPlayerNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fab005',
  },
  liberoPlayerName: {
    fontSize: 12,
    color: '#495057',
  },
  liberoHint: {
    color: '#868E96',
    fontStyle: 'italic',
    fontSize: 11,
  },
  rosterContainer: {
    marginBottom: 8,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addPlayerText: {
    color: '#228BE6',
    fontWeight: '500',
    fontSize: 12,
  },
  rosterScroll: {
    marginBottom: 2,
  },
  rosterContent: {
    paddingVertical: 4,
  },
  rosterPlayer: {
    width: 56,
    padding: 6,
    marginRight: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  rosterPlayerAssigned: {
    backgroundColor: '#e7f5ff',
    borderColor: '#228BE6',
  },
  rosterPlayerLibero: {
    backgroundColor: '#fff9db',
    borderColor: '#fab005',
  },
  rosterNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
  },
  rosterName: {
    fontSize: 9,
    color: '#868E96',
  },
  rosterTextAssigned: {
    color: '#228BE6',
  },
  liberoBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    backgroundColor: '#fab005',
    borderRadius: 6,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liberoBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  rosterHint: {
    fontSize: 10,
    color: '#adb5bd',
    textAlign: 'center',
  },
  emptyRoster: {
    padding: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#868E96',
    marginBottom: 8,
    fontSize: 12,
  },
  addFirstButton: {
    backgroundColor: '#228BE6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addFirstText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  addPlayerForm: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  addPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addPlayerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  addPlayerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  addPlayerInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 4,
    padding: 8,
    fontSize: 13,
  },
  numberInput: {
    width: 44,
    textAlign: 'center',
  },
  nameInput: {
    flex: 1,
  },
  addPlayerSubmit: {
    backgroundColor: '#228BE6',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  addPlayerSubmitDisabled: {
    opacity: 0.7,
  },
  addPlayerSubmitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  startButton: {
    backgroundColor: '#40c057',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
