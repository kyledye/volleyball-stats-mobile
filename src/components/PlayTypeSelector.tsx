import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

type PlayType = 'SERVE' | 'ATTACK' | 'BLOCK' | 'SERVE_RECEIVE' | 'PASS' | 'SECOND_TOUCH';

interface PlayTypeSelectorProps {
  selectedType: PlayType;
  onSelectType: (type: PlayType) => void;
  isServing: boolean | null;
}

interface PlayTypeOption {
  type: PlayType;
  label: string;
  shortLabel: string;
  color: string;
  showWhenServing?: boolean;
  showWhenReceiving?: boolean;
}

const playTypes: PlayTypeOption[] = [
  {
    type: 'SERVE',
    label: 'Serve',
    shortLabel: 'SRV',
    color: '#228BE6',
    showWhenServing: true,
    showWhenReceiving: false,
  },
  {
    type: 'SERVE_RECEIVE',
    label: 'Serve Receive',
    shortLabel: 'RCV',
    color: '#40c057',
    showWhenServing: false,
    showWhenReceiving: true,
  },
  {
    type: 'SECOND_TOUCH',
    label: 'Second Touch',
    shortLabel: '2T',
    color: '#7950f2',
    showWhenServing: true,
    showWhenReceiving: true,
  },
  {
    type: 'ATTACK',
    label: 'Attack',
    shortLabel: 'ATK',
    color: '#fa5252',
    showWhenServing: true,
    showWhenReceiving: true,
  },
  {
    type: 'BLOCK',
    label: 'Block',
    shortLabel: 'BLK',
    color: '#fd7e14',
    showWhenServing: false,
    showWhenReceiving: true,
  },
];

export default function PlayTypeSelector({
  selectedType,
  onSelectType,
  isServing,
}: PlayTypeSelectorProps) {
  // Filter play types based on serving state
  const visibleTypes = playTypes.filter(pt => {
    if (isServing === null) return true; // Show all if serving not set
    if (isServing) return pt.showWhenServing;
    return pt.showWhenReceiving;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Play Type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleTypes.map(pt => {
          const isSelected = selectedType === pt.type;
          return (
            <TouchableOpacity
              key={pt.type}
              style={[
                styles.typeButton,
                isSelected && { backgroundColor: pt.color },
                !isSelected && { borderColor: pt.color },
              ]}
              onPress={() => onSelectType(pt.type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  isSelected && styles.typeButtonTextSelected,
                  !isSelected && { color: pt.color },
                ]}
              >
                {pt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  scrollContent: {
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
});
