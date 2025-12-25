import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_COLORS } from '../utils/colors';

interface ExpenseCardProps {
  category: string;
  amount: number;
  percentage: number;
  onPress?: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  food: 'fast-food',
  travel: 'car',
  groceries: 'cart',
  shopping: 'bag-handle',
  entertainment: 'game-controller',
  stationary: 'pencil',
  others: 'ellipsis-horizontal',
};

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  category,
  amount,
  percentage,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: CATEGORY_COLORS[category] + '20' }]}>
        <Ionicons 
          name={CATEGORY_ICONS[category] || 'ellipsis-horizontal'} 
          size={24} 
          color={CATEGORY_COLORS[category]} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.category}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
        <Text style={styles.percentage}>{percentage.toFixed(1)}% of total</Text>
      </View>
      <Text style={styles.amount}>₹{amount.toFixed(0)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  percentage: {
    fontSize: 13,
    color: '#6B7280',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
});
