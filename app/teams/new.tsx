import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveLocalTeam, generateId } from '../../src/lib/database';

export default function NewTeamScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [school, setSchool] = useState('');
  const [season, setSeason] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Team name is required');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert('Error', 'Team name must be at least 2 characters');
      return;
    }

    setCreating(true);
    try {
      const team = {
        id: generateId(),
        name: name.trim(),
        abbreviation: abbreviation.trim() || undefined,
        school: school.trim() || undefined,
        season: season.trim() || undefined,
        isOpponent: false,
        createdAt: new Date().toISOString(),
      };

      await saveLocalTeam(team);
      router.replace(`/teams/${team.id}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Team',
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
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Team Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Varsity Girls"
              placeholderTextColor="#adb5bd"
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Abbreviation</Text>
            <TextInput
              style={[styles.input, styles.abbreviationInput]}
              value={abbreviation}
              onChangeText={setAbbreviation}
              placeholder="e.g., VG"
              placeholderTextColor="#adb5bd"
              maxLength={6}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>School</Text>
            <TextInput
              style={styles.input}
              value={school}
              onChangeText={setSchool}
              placeholder="e.g., Lincoln High School"
              placeholderTextColor="#adb5bd"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Season</Text>
            <TextInput
              style={styles.input}
              value={season}
              onChangeText={setSeason}
              placeholder="e.g., 2024-25"
              placeholderTextColor="#adb5bd"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, creating && styles.submitButtonDisabled]}
            onPress={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Team</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
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
  abbreviationInput: {
    width: 100,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#228BE6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
