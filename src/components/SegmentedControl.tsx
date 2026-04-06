import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export default function SegmentedControl({ options, selectedIndex, onChange }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = index === selectedIndex;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.option, isSelected && styles.selectedOption]}
            onPress={() => onChange(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.text, isSelected && styles.selectedText]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg,
    padding: 6,
    marginBottom: SPACING.lg,
  },
  option: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  selectedOption: {
    backgroundColor: COLORS.accent,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  text: {
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  selectedText: {
    color: COLORS.black,
    fontWeight: '800',
  },
});
