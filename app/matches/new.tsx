import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getLocalTeams,
  saveLocalTeam,
  saveLocalMatch,
  LocalTeam,
  LocalMatch,
  generateId,
} from '../../src/lib/database';

type MatchType = 'BEST_OF_3' | 'BEST_OF_5';

export default function NewMatchScreen() {
  const router = useRouter();

  // Form state
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('BEST_OF_3');
  const [notes, setNotes] = useState('');

  // Teams
  const [myTeams, setMyTeams] = useState<LocalTeam[]>([]);
  const [opponents, setOpponents] = useState<LocalTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Modals
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [showOpponentPicker, setShowOpponentPicker] = useState(false);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamAbbreviation, setNewTeamAbbreviation] = useState('');
  const [newTeamIsOpponent, setNewTeamIsOpponent] = useState(false);

  const [creating, setCreating] = useState(false);

  // Load teams
  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoadingTeams(true);
    const teams = await getLocalTeams();
    // Split into my teams and opponents based on a flag we'll add
    setMyTeams(teams.filter(t => !(t as any).isOpponent));
    setOpponents(teams.filter(t => (t as any).isOpponent));
    setLoadingTeams(false);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    const team: LocalTeam = {
      id: generateId(),
      name: newTeamName.trim(),
      abbreviation: newTeamAbbreviation.trim() || undefined,
      createdAt: new Date().toISOString(),
      isOpponent: newTeamIsOpponent,
    };

    await saveLocalTeam(team);

    if (newTeamIsOpponent) {
      setOpponents(prev => [...prev, team]);
      setSelectedOpponentId(team.id);
    } else {
      setMyTeams(prev => [...prev, team]);
      setSelectedTeamId(team.id);
    }

    setNewTeamName('');
    setNewTeamAbbreviation('');
    setShowNewTeamModal(false);
  };

  const handleCreateMatch = async () => {
    if (!selectedTeamId) {
      Alert.alert('Error', 'Please select your team');
      return;
    }
    if (!selectedOpponentId) {
      Alert.alert('Error', 'Please select an opponent');
      return;
    }

    setCreating(true);

    const homeTeam = myTeams.find(t => t.id === selectedTeamId);
    const awayTeam = opponents.find(t => t.id === selectedOpponentId);

    const match: LocalMatch = {
      id: generateId(),
      homeTeamId: selectedTeamId,
      awayTeamId: selectedOpponentId,
      homeTeamName: homeTeam?.name || 'Home',
      awayTeamName: awayTeam?.name || 'Away',
      date: date.toISOString(),
      status: 'IN_PROGRESS',
      homeSetsWon: 0,
      awaySetsWon: 0,
      sets: [{
        id: generateId(),
        matchId: '',
        setNumber: 1,
        homeScore: 0,
        awayScore: 0,
        plays: [],
      }],
      createdAt: new Date().toISOString(),
      // Extra fields
      location,
      matchType,
      notes,
    } as any;

    match.sets[0].matchId = match.id;

    await saveLocalMatch(match);
    setCreating(false);
    router.replace(`/match/${match.id}`);
  };

  const selectedTeam = myTeams.find(t => t.id === selectedTeamId);
  const selectedOpponent = opponents.find(t => t.id === selectedOpponentId);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Schedule Match',
          headerStyle: { backgroundColor: '#228BE6' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Date & Time</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#495057" />
            <Text style={styles.pickerButtonText}>
              {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
        </View>

        {/* Your Team */}
        <View style={styles.section}>
          <Text style={styles.label}>Your Team</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowTeamPicker(true)}
          >
            <Ionicons name="people-outline" size={20} color="#495057" />
            <Text style={[styles.pickerButtonText, !selectedTeam && styles.placeholder]}>
              {selectedTeam?.name || 'Select your team'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#868E96" />
          </TouchableOpacity>
        </View>

        {/* Opponent */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Opponent</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setNewTeamIsOpponent(true);
                setShowNewTeamModal(true);
              }}
            >
              <Ionicons name="add" size={20} color="#228BE6" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowOpponentPicker(true)}
          >
            <Ionicons name="shield-outline" size={20} color="#495057" />
            <Text style={[styles.pickerButtonText, !selectedOpponent && styles.placeholder]}>
              {selectedOpponent?.name || 'Select opponent'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#868E96" />
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Home Gym, Central High School"
            placeholderTextColor="#adb5bd"
          />
        </View>

        {/* Match Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Match Type</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segment, matchType === 'BEST_OF_3' && styles.segmentActive]}
              onPress={() => setMatchType('BEST_OF_3')}
            >
              <Text style={[styles.segmentText, matchType === 'BEST_OF_3' && styles.segmentTextActive]}>
                Best of 3
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, matchType === 'BEST_OF_5' && styles.segmentActive]}
              onPress={() => setMatchType('BEST_OF_5')}
            >
              <Text style={[styles.segmentText, matchType === 'BEST_OF_5' && styles.segmentTextActive]}>
                Best of 5
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes about the match"
            placeholderTextColor="#adb5bd"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, creating && styles.submitButtonDisabled]}
          onPress={handleCreateMatch}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Start Match</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Team Picker Modal */}
      <Modal
        visible={showTeamPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTeamPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTeamPicker(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Team</Text>
            <TouchableOpacity
              onPress={() => {
                setShowTeamPicker(false);
                setNewTeamIsOpponent(false);
                setShowNewTeamModal(true);
              }}
            >
              <Text style={styles.modalAdd}>Add New</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {loadingTeams ? (
              <ActivityIndicator style={{ marginTop: 40 }} />
            ) : myTeams.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No teams yet</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => {
                    setShowTeamPicker(false);
                    setNewTeamIsOpponent(false);
                    setShowNewTeamModal(true);
                  }}
                >
                  <Text style={styles.emptyButtonText}>Create Your First Team</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myTeams.map(team => (
                <TouchableOpacity
                  key={team.id}
                  style={[styles.listItem, selectedTeamId === team.id && styles.listItemSelected]}
                  onPress={() => {
                    setSelectedTeamId(team.id);
                    setShowTeamPicker(false);
                  }}
                >
                  <Text style={styles.listItemText}>{team.name}</Text>
                  {selectedTeamId === team.id && (
                    <Ionicons name="checkmark" size={24} color="#228BE6" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Opponent Picker Modal */}
      <Modal
        visible={showOpponentPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOpponentPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowOpponentPicker(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Opponent</Text>
            <TouchableOpacity
              onPress={() => {
                setShowOpponentPicker(false);
                setNewTeamIsOpponent(true);
                setShowNewTeamModal(true);
              }}
            >
              <Text style={styles.modalAdd}>Add New</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {loadingTeams ? (
              <ActivityIndicator style={{ marginTop: 40 }} />
            ) : opponents.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No opponents yet</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => {
                    setShowOpponentPicker(false);
                    setNewTeamIsOpponent(true);
                    setShowNewTeamModal(true);
                  }}
                >
                  <Text style={styles.emptyButtonText}>Add First Opponent</Text>
                </TouchableOpacity>
              </View>
            ) : (
              opponents.map(team => (
                <TouchableOpacity
                  key={team.id}
                  style={[styles.listItem, selectedOpponentId === team.id && styles.listItemSelected]}
                  onPress={() => {
                    setSelectedOpponentId(team.id);
                    setShowOpponentPicker(false);
                  }}
                >
                  <Text style={styles.listItemText}>{team.name}</Text>
                  {selectedOpponentId === team.id && (
                    <Ionicons name="checkmark" size={24} color="#228BE6" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* New Team Modal */}
      <Modal
        visible={showNewTeamModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowNewTeamModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewTeamModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {newTeamIsOpponent ? 'Add Opponent' : 'Add Team'}
            </Text>
            <TouchableOpacity onPress={handleCreateTeam}>
              <Text style={[styles.modalAdd, !newTeamName.trim() && { opacity: 0.5 }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Team Name</Text>
                <TextInput
                  style={styles.input}
                  value={newTeamName}
                  onChangeText={setNewTeamName}
                  placeholder="e.g., Central High Wildcats"
                  placeholderTextColor="#adb5bd"
                  autoFocus
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Abbreviation</Text>
                <TextInput
                  style={[styles.input, styles.abbreviationInput]}
                  value={newTeamAbbreviation}
                  onChangeText={setNewTeamAbbreviation}
                  placeholder="e.g., CHW"
                  placeholderTextColor="#adb5bd"
                  maxLength={6}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>
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
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    padding: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  placeholder: {
    color: '#adb5bd',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#868E96',
  },
  segmentTextActive: {
    color: '#228BE6',
  },
  submitButton: {
    backgroundColor: '#228BE6',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  modalAdd: {
    fontSize: 17,
    color: '#228BE6',
    fontWeight: '600',
  },
  modalList: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
  },
  formRow: {
    marginBottom: 16,
  },
  formGroup: {
    flex: 1,
  },
  abbreviationInput: {
    width: 100,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  listItemSelected: {
    backgroundColor: '#e7f5ff',
  },
  listItemText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
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
});
