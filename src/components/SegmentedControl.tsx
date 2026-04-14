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
    backgroundColor: COLORS.glassBackgroundLv2,
    borderRadius: RADIUS.xl,
    padding: 5,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  option: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  selectedOption: {
    backgroundColor: COLORS.accent,
    elevation: 4,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  text: {
    color: COLORS.muted,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  selectedText: {
    color: COLORS.black,
    fontWeight: '800',
  },
});
