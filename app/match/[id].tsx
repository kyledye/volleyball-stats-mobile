import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getLocalMatch,
  saveLocalMatch,
  getLocalPlayers,
  saveLocalPlayer,
  LocalMatch,
  LocalPlayer,
  LocalPlay,
  CourtPosition,
  generateId,
} from '../../src/lib/database';
import LineupSetup from '../../src/components/LineupSetup';
import CourtView from '../../src/components/CourtView';
import RecentPlays from '../../src/components/RecentPlays';

// Play types matching web app
const PLAY_TYPES = [
  { value: 'SERVE', label: 'Serve' },
  { value: 'ATTACK', label: 'Attack' },
  { value: 'BLOCK', label: 'Block' },
  { value: 'SERVE_RECEIVE', label: 'Receive' },
  { value: 'SECOND_TOUCH', label: '2nd Touch' },
  { value: 'OPP_ERROR', label: 'Opp Error' },
];

// Results for each play type
const getResultsForPlayType = (playType: string) => {
  switch (playType) {
    case 'SERVE':
      return [
        { value: 'ACE', label: 'Ace', color: '#40c057' },
        { value: 'IN_PLAY', label: 'In Play', color: '#868E96' },
        { value: 'ERROR', label: 'Error', color: '#fa5252' },
      ];
    case 'ATTACK':
      return [
        { value: 'KILL', label: 'Kill', color: '#40c057' },
        { value: 'IN_PLAY', label: 'In Play', color: '#868E96' },
        { value: 'ERROR', label: 'Error', color: '#fa5252' },
      ];
    case 'BLOCK':
      return [
        { value: 'KILL', label: 'Stuff', color: '#40c057' },
        { value: 'IN_PLAY', label: 'Touch', color: '#868E96' },
        { value: 'ERROR', label: 'Error', color: '#fa5252' },
      ];
    case 'SERVE_RECEIVE':
      return [
        { value: 'PASS_4', label: '4★', color: '#40c057' },
        { value: 'PASS_3', label: '3★', color: '#82c91e' },
        { value: 'PASS_2', label: '2★', color: '#fab005' },
        { value: 'PASS_1', label: '1★', color: '#fd7e14' },
        { value: 'ERROR', label: '0', color: '#fa5252' },
      ];
    case 'SECOND_TOUCH':
      return [
        { value: 'ASSIST', label: 'Assist', color: '#40c057' },
        { value: 'PLAYABLE_SET', label: 'Set', color: '#82c91e' },
        { value: 'PLAYABLE_BUMP', label: 'Bump', color: '#fab005' },
        { value: 'POOR', label: 'Poor', color: '#fd7e14' },
        { value: 'ERROR', label: 'Error', color: '#fa5252' },
      ];
    case 'OPP_ERROR':
      return [{ value: 'OPP_ERROR', label: 'Point', color: '#7950f2' }];
    default:
      return [];
  }
};

interface CourtPlayer {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
  position: number;
  isLibero: boolean;
}

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [match, setMatch] = useState<LocalMatch | null>(null);
  const [players, setPlayers] = useState<LocalPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [isServing, setIsServing] = useState<boolean | null>(null);
  const [selectedPlayType, setSelectedPlayType] = useState<string>('SERVE');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  // Kill attribution modal
  const [showKillModal, setShowKillModal] = useState(false);
  const [pendingAssistPlayerId, setPendingAssistPlayerId] = useState<string | null>(null);

  // Load match data
  const loadMatch = useCallback(async () => {
    if (!id) return;
    try {
      const matchData = await getLocalMatch(id);
      if (matchData) {
        setMatch(matchData);
        // Load players for this team
        const teamPlayers = await getLocalPlayers(matchData.homeTeamId);
        setPlayers(teamPlayers);
      } else {
        setError('Match not found');
      }
    } catch (err) {
      setError('Failed to load match');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMatch();
  }, [loadMatch]);

  // Current set
  const currentSet = match?.sets?.[match.sets.length - 1];

  // Check if lineup is set
  const hasLineup = currentSet?.courtPositions && currentSet.courtPositions.length === 6;

  // Get court players from positions
  const courtPlayers: CourtPlayer[] = hasLineup
    ? (currentSet?.courtPositions || []).map(cp => {
        const player = players.find(p => p.id === cp.playerId);
        return {
          id: cp.playerId,
          number: player?.number || 0,
          firstName: player?.firstName || '',
          lastName: player?.lastName || '',
          position: cp.position,
          isLibero: !!(cp.playerId === currentSet?.liberoId && currentSet?.liberoIsOnCourt),
        };
      })
    : [];

  // Get recent plays
  const recentPlays = (currentSet?.plays || []).slice(-5).reverse().map(p => {
    const player = players.find(pl => pl.id === p.playerId);
    return {
      id: p.id,
      type: p.type,
      result: p.result,
      player: player ? { number: player.number, firstName: player.firstName, lastName: player.lastName } : null,
      timestamp: p.timestamp,
    };
  });

  // Save match helper
  const updateMatch = async (updates: Partial<LocalMatch>) => {
    if (!match) return;
    const updated = { ...match, ...updates };
    await saveLocalMatch(updated);
    setMatch(updated);
  };

  // Handle lineup setup
  const handleStartMatch = async (positions: Record<number, string>, liberoId: string | null) => {
    if (!match || !currentSet) return;

    const courtPositions: CourtPosition[] = Object.entries(positions).map(([pos, playerId]) => ({
      position: parseInt(pos),
      playerId,
    }));

    const updatedSets = match.sets.map(s => {
      if (s.id === currentSet.id) {
        return {
          ...s,
          courtPositions,
          liberoId: liberoId || undefined,
          liberoIsOnCourt: false,
          rotationCount: 0,
          subCount: 0,
        };
      }
      return s;
    });

    await updateMatch({ sets: updatedSets });
  };

  // Add player
  const handleAddPlayer = async (playerData: Omit<LocalPlayer, 'id'>): Promise<LocalPlayer> => {
    const player: LocalPlayer = {
      ...playerData,
      id: generateId(),
      teamId: match?.homeTeamId || '',
    };
    await saveLocalPlayer(player);
    setPlayers(prev => [...prev, player]);
    return player;
  };

  // Set serving state
  const handleSetServing = (serving: boolean) => {
    setIsServing(serving);
    setSelectedPlayType(serving ? 'SERVE' : 'SERVE_RECEIVE');
  };

  // Handle rotation
  const handleRotate = async () => {
    if (!match || !currentSet?.courtPositions) return;

    // Rotate positions: 1->2, 2->3, 3->4, 4->5, 5->6, 6->1
    const newPositions = currentSet.courtPositions.map(cp => ({
      ...cp,
      position: cp.position === 1 ? 6 : cp.position - 1,
    }));

    // Check if libero needs to swap (can't be in front row: 2, 3, 4)
    let liberoIsOnCourt = currentSet.liberoIsOnCourt;
    let liberoReplacingId = currentSet.liberoReplacingId;

    if (currentSet.liberoId && liberoIsOnCourt) {
      const liberoPosition = newPositions.find(p => p.playerId === currentSet.liberoId)?.position;
      if (liberoPosition && [2, 3, 4].includes(liberoPosition)) {
        // Auto swap libero out
        if (liberoReplacingId) {
          // Swap back
          const liberoPos = newPositions.find(p => p.playerId === currentSet.liberoId);
          if (liberoPos) {
            liberoPos.playerId = liberoReplacingId;
          }
          liberoIsOnCourt = false;
          liberoReplacingId = undefined;
        }
      }
    }

    const updatedSets = match.sets.map(s => {
      if (s.id === currentSet.id) {
        return {
          ...s,
          courtPositions: newPositions,
          rotationCount: (s.rotationCount || 0) + 1,
          liberoIsOnCourt,
          liberoReplacingId,
        };
      }
      return s;
    });

    await updateMatch({ sets: updatedSets });
  };

  // Record a play
  const handleRecordPlay = async (result: string) => {
    if (!match || !currentSet || recording) return;

    // OPP_ERROR doesn't need a player
    const isOppError = selectedPlayType === 'OPP_ERROR' || result === 'OPP_ERROR';

    // Other plays need a player selected (except OPP_ERROR)
    if (!selectedPlayer && !isOppError) {
      Alert.alert('Select Player', 'Please select a player on the court first');
      return;
    }

    // Check serving state
    if (isServing === null) {
      Alert.alert('Set Serving', 'Please indicate who is serving first');
      return;
    }

    // If assist, show kill attribution modal
    if (result === 'ASSIST' && selectedPlayType === 'SECOND_TOUCH' && selectedPlayer) {
      setPendingAssistPlayerId(selectedPlayer);
      setShowKillModal(true);
      return;
    }

    await recordPlay(selectedPlayType, result, selectedPlayer);
  };

  // Actually record the play
  const recordPlay = async (type: string, result: string, playerId: string | null) => {
    if (!match || !currentSet) return;

    setRecording(true);

    const play: LocalPlay = {
      id: generateId(),
      matchId: match.id,
      setId: currentSet.id,
      playerId: playerId || '',
      type,
      result,
      timestamp: new Date().toISOString(),
    };

    // Calculate score changes
    const weScored = ['ACE', 'KILL', 'OPP_ERROR'].includes(result);
    const theyScored = result === 'ERROR';

    let homeScoreChange = weScored ? 1 : 0;
    let awayScoreChange = theyScored ? 1 : 0;

    // Handle rotation on sideout
    let newIsServing = isServing;
    if (weScored && !isServing) {
      // Sideout - we won point while receiving
      await handleRotate();
      newIsServing = true;
    } else if (theyScored && isServing) {
      // We lost serve
      newIsServing = false;
    }

    // Calculate new scores
    const newHomeScore = currentSet.homeScore + homeScoreChange;
    const newAwayScore = currentSet.awayScore + awayScoreChange;

    // Check for set win
    let homeSetsWon = match.homeSetsWon;
    let awaySetsWon = match.awaySetsWon;
    let matchStatus = match.status;
    const setsToWin = match.matchType === 'BEST_OF_5' ? 3 : 2;

    const updatedSets = [...match.sets];
    const currentSetIndex = updatedSets.findIndex(s => s.id === currentSet.id);

    // Check for set win (25 points, win by 2, or 15 in 5th set)
    const isDecidingSet = currentSet.setNumber === (match.matchType === 'BEST_OF_5' ? 5 : 3);
    const pointsToWin = isDecidingSet ? 15 : 25;

    if (newHomeScore >= pointsToWin && newHomeScore - newAwayScore >= 2) {
      homeSetsWon++;
      updatedSets[currentSetIndex] = {
        ...updatedSets[currentSetIndex],
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        winnerId: match.homeTeamId,
        plays: [...updatedSets[currentSetIndex].plays, play],
        homeIsServing: newIsServing ?? undefined,
      };

      if (homeSetsWon >= setsToWin) {
        matchStatus = 'COMPLETED';
        Alert.alert('Match Complete!', `${match.homeTeamName} wins!`);
      } else {
        // Start new set
        updatedSets.push({
          id: generateId(),
          matchId: match.id,
          setNumber: currentSet.setNumber + 1,
          homeScore: 0,
          awayScore: 0,
          plays: [],
        });
        newIsServing = null;
        Alert.alert('Set Complete!', `${match.homeTeamName} wins the set!`);
      }
    } else if (newAwayScore >= pointsToWin && newAwayScore - newHomeScore >= 2) {
      awaySetsWon++;
      updatedSets[currentSetIndex] = {
        ...updatedSets[currentSetIndex],
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        winnerId: match.awayTeamId,
        plays: [...updatedSets[currentSetIndex].plays, play],
        homeIsServing: newIsServing ?? undefined,
      };

      if (awaySetsWon >= setsToWin) {
        matchStatus = 'COMPLETED';
        Alert.alert('Match Complete!', `${match.awayTeamName} wins!`);
      } else {
        updatedSets.push({
          id: generateId(),
          matchId: match.id,
          setNumber: currentSet.setNumber + 1,
          homeScore: 0,
          awayScore: 0,
          plays: [],
        });
        newIsServing = null;
        Alert.alert('Set Complete!', `${match.awayTeamName} wins the set!`);
      }
    } else {
      // Normal play
      updatedSets[currentSetIndex] = {
        ...updatedSets[currentSetIndex],
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        plays: [...updatedSets[currentSetIndex].plays, play],
        homeIsServing: newIsServing ?? undefined,
      };
    }

    await updateMatch({
      sets: updatedSets,
      homeSetsWon,
      awaySetsWon,
      status: matchStatus,
    });

    setIsServing(newIsServing);
    setSelectedPlayer(null);
    setSelectedPlayType(newIsServing === true ? 'SERVE' : newIsServing === false ? 'SERVE_RECEIVE' : selectedPlayType);
    setRecording(false);
  };

  // Handle kill attribution
  const handleKillAttribution = async (hitterId: string) => {
    if (!pendingAssistPlayerId) return;

    setShowKillModal(false);

    // Record assist first
    await recordPlay('SECOND_TOUCH', 'ASSIST', pendingAssistPlayerId);

    // Then record the kill
    await recordPlay('ATTACK', 'KILL', hitterId);

    setPendingAssistPlayerId(null);
  };

  // Undo last play
  const handleUndo = async () => {
    if (!match || !currentSet || currentSet.plays.length === 0) return;

    const lastPlay = currentSet.plays[currentSet.plays.length - 1];
    let homeScoreChange = 0;
    let awayScoreChange = 0;

    if (['ACE', 'KILL', 'OPP_ERROR'].includes(lastPlay.result)) {
      homeScoreChange = -1;
    } else if (lastPlay.result === 'ERROR') {
      awayScoreChange = -1;
    }

    const updatedSets = match.sets.map(s => {
      if (s.id === currentSet.id) {
        return {
          ...s,
          homeScore: Math.max(0, s.homeScore + homeScoreChange),
          awayScore: Math.max(0, s.awayScore + awayScoreChange),
          plays: s.plays.slice(0, -1),
        };
      }
      return s;
    });

    await updateMatch({ sets: updatedSets });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#228BE6" />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Match not found'}</Text>
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
          title: `${match.homeTeamName} vs ${match.awayTeamName}`,
          headerStyle: { backgroundColor: '#228BE6' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {/* Score Display */}
        <View style={styles.scoreContainer}>
          <View style={styles.teamScore}>
            <Text style={styles.teamName}>{match.homeTeamName}</Text>
            <Text style={styles.score}>{currentSet?.homeScore ?? 0}</Text>
          </View>
          <View style={styles.setScore}>
            <Text style={styles.setScoreText}>
              {match.homeSetsWon} - {match.awaySetsWon}
            </Text>
            <Text style={styles.setLabel}>Set {currentSet?.setNumber || 1}</Text>
          </View>
          <View style={styles.teamScore}>
            <Text style={styles.teamName}>{match.awayTeamName}</Text>
            <Text style={styles.score}>{currentSet?.awayScore ?? 0}</Text>
          </View>
        </View>

        {/* Lineup Setup or Game Controls */}
        {!hasLineup ? (
          <LineupSetup
            players={players}
            teamName={match.homeTeamName}
            onStartMatch={handleStartMatch}
            onAddPlayer={handleAddPlayer}
          />
        ) : (
          <>
            {/* Serving Indicator */}
            <View style={styles.servingContainer}>
              <TouchableOpacity
                style={[styles.servingButton, isServing === true && styles.servingActive]}
                onPress={() => handleSetServing(true)}
              >
                <Text style={[styles.servingText, isServing === true && styles.servingTextActive]}>
                  Us Serving
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.servingButton, isServing === false && styles.servingActive]}
                onPress={() => handleSetServing(false)}
              >
                <Text style={[styles.servingText, isServing === false && styles.servingTextActive]}>
                  Them Serving
                </Text>
              </TouchableOpacity>
            </View>

            {/* Court View */}
            <CourtView
              players={courtPlayers}
              selectedPlayer={selectedPlayer}
              onSelectPlayer={setSelectedPlayer}
              isServing={isServing}
            />

            {/* Play Type Selector */}
            <View style={styles.playTypeContainer}>
              <Text style={styles.sectionLabel}>Play Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.playTypeRow}>
                  {PLAY_TYPES.map(pt => {
                    const isSelected = selectedPlayType === pt.value;
                    const isOppError = pt.value === 'OPP_ERROR';
                    return (
                      <TouchableOpacity
                        key={pt.value}
                        style={[
                          styles.playTypeButton,
                          isSelected && styles.playTypeSelected,
                          isOppError && styles.playTypeOppError,
                        ]}
                        onPress={() => {
                          if (isOppError) {
                            handleRecordPlay('OPP_ERROR');
                          } else {
                            setSelectedPlayType(pt.value);
                          }
                        }}
                      >
                        <Text style={[
                          styles.playTypeText,
                          isSelected && styles.playTypeTextSelected,
                          isOppError && styles.playTypeTextOppError,
                        ]}>
                          {pt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Result Buttons */}
            {isServing !== null && (
              <View style={styles.resultContainer}>
                <Text style={styles.sectionLabel}>
                  Result {selectedPlayer ? '' : '(select player)'}
                </Text>
                <View style={styles.resultRow}>
                  {getResultsForPlayType(selectedPlayType).map(result => (
                    <TouchableOpacity
                      key={result.value}
                      style={[styles.resultButton, { backgroundColor: result.color }]}
                      onPress={() => handleRecordPlay(result.value)}
                      disabled={recording}
                    >
                      <Text style={styles.resultButtonText}>{result.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Undo Button */}
            <TouchableOpacity
              style={styles.undoButton}
              onPress={handleUndo}
              disabled={!currentSet?.plays?.length}
            >
              <Ionicons name="arrow-undo" size={20} color="#868E96" />
              <Text style={styles.undoText}>Undo Last Play</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Recent Plays */}
        <RecentPlays plays={recentPlays} />
      </ScrollView>

      {/* Kill Attribution Modal */}
      <Modal
        visible={showKillModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowKillModal(false);
          setPendingAssistPlayerId(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowKillModal(false);
              setPendingAssistPlayerId(null);
            }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Who got the kill?</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {courtPlayers
              .filter(p => p.id !== pendingAssistPlayerId)
              .map(player => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.killPlayerButton}
                  onPress={() => handleKillAttribution(player.id)}
                >
                  <Text style={styles.killPlayerNumber}>#{player.number}</Text>
                  <Text style={styles.killPlayerName}>
                    {player.firstName} {player.lastName}
                  </Text>
                </TouchableOpacity>
              ))}
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
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  teamScore: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#228BE6',
  },
  setScore: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  setScoreText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
  },
  setLabel: {
    fontSize: 12,
    color: '#868E96',
  },
  servingContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  servingButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f1f3f5',
  },
  servingActive: {
    backgroundColor: '#228BE6',
  },
  servingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  servingTextActive: {
    color: '#fff',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  playTypeContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  playTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  playTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f3f5',
  },
  playTypeSelected: {
    backgroundColor: '#228BE6',
  },
  playTypeOppError: {
    backgroundColor: '#7950f2',
  },
  playTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  playTypeTextSelected: {
    color: '#fff',
  },
  playTypeTextOppError: {
    color: '#fff',
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultButton: {
    flex: 1,
    minWidth: 60,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
  },
  undoText: {
    marginLeft: 8,
    color: '#868E96',
    fontSize: 14,
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
  modalContent: {
    flex: 1,
    padding: 16,
  },
  killPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  killPlayerNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#228BE6',
    marginRight: 12,
  },
  killPlayerName: {
    fontSize: 16,
    color: '#212529',
  },
});
