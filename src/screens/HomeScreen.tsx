import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext'; // Ensure this path is correct

const CATEGORIES = [
  { id: 'food', name: 'Food', icon: 'fast-food', color: '#FF6B6B' },
  { id: 'travel', name: 'Travel', icon: 'car', color: '#4ECDC4' },
  { id: 'groceries', name: 'Groceries', icon: 'cart', color: '#45B7D1' },
  { id: 'shopping', name: 'Shopping', icon: 'bag-handle', color: '#F7B731' },
  { id: 'entertainment', name: 'Fun', icon: 'game-controller', color: '#A55EEA' },
  { id: 'others', name: 'Others', icon: 'ellipsis-horizontal', color: '#95A5A6' },
];

const TIME_FILTERS = [
  { label: 'Today', value: '1' },
  { label: 'Last 7 Days', value: '7' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'All Time', value: 'all' },
];

export default function HomeScreen() {
  const { colors, isDark } = useTheme(); // Theme Hook
  
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [note, setNote] = useState('');
  
  const [allExpenses, setAllExpenses] = useState<any[]>([]); 
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]); 
  const [totalSpending, setTotalSpending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedFilter, setSelectedFilter] = useState('30'); 
  const [showFilterModal, setShowFilterModal] = useState(false);

  // --- FETCH DATA ---
  const fetchExpenses = async () => {
    const user = auth.currentUser;
    if (!user) {
        setLoading(false);
        return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setAllExpenses(data);
        applyFilter(data, selectedFilter); 
      }
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- FILTER LOGIC ---
  const applyFilter = (data: any[], filterValue: string) => {
    const now = new Date();
    let filtered = data;

    if (filterValue !== 'all') {
      const days = parseInt(filterValue);
      const cutoffDate = new Date();
      cutoffDate.setDate(now.getDate() - days);
      cutoffDate.setHours(0,0,0,0);

      filtered = data.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= cutoffDate;
      });
    }

    setFilteredExpenses(filtered);
    const total = filtered.reduce((sum, item) => sum + Number(item.amount), 0);
    setTotalSpending(total);
    setSelectedFilter(filterValue);
    setShowFilterModal(false);
  };

  useFocusEffect(useCallback(() => { fetchExpenses(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  // --- SAVE EXPENSE ---
  const handleSave = async () => {
    if (!amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    try {
      const newExpense = {
        amount: parseFloat(amount),
        category: selectedCategory,
        note: note.trim(),
        user_id: user.uid,
      };

      const { error } = await supabase.from('expenses').insert([newExpense]);
      if (error) throw error;

      Alert.alert('Success', 'Expense saved!');
      setAmount('');
      setNote('');
      setModalVisible(false);
      fetchExpenses(); 

    } catch (error: any) {
      Alert.alert('Error Saving', error.message);
    }
  };

  // --- DELETE EXPENSE ---
  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (!error) fetchExpenses();
          }
        }
      ]
    );
  };

  const getCategoryDetails = (catId: string) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[5];
  const getFilterLabel = () => TIME_FILTERS.find(f => f.value === selectedFilter)?.label || 'All Time';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>SETA</Text>
        <TouchableOpacity onPress={fetchExpenses}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* TOTAL CARD */}
        <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
          <View style={styles.totalHeaderRow}>
            <Text style={styles.totalLabel}>Total Spending</Text>
            <TouchableOpacity 
              style={styles.filterButton} 
              onPress={() => setShowFilterModal(true)}
            >
              <Text style={styles.filterButtonText}>{getFilterLabel()}</Text>
              <Ionicons name="chevron-down" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.totalAmount}>₹{totalSpending.toFixed(2)}</Text>
        </View>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 20}} />
        ) : filteredExpenses.length > 0 ? (
          <View style={styles.listContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Expenses</Text>
            {filteredExpenses.map((item) => {
              const cat = getCategoryDetails(item.category);
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.expenseItem, { backgroundColor: colors.card }]}
                  onLongPress={() => handleDelete(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: cat.color + '20' }]}>
                    <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={[styles.expenseCat, { color: colors.text }]}>{cat.name}</Text>
                    {item.note ? <Text style={[styles.expenseNote, { color: colors.subText }]}>{item.note}</Text> : null}
                    <Text style={[styles.dateText, { color: colors.subText }]}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.expenseAmount, { color: colors.danger }]}>-₹{item.amount}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color={colors.subText} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No expenses found</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* FILTER MODAL */}
      <Modal animationType="fade" transparent={true} visible={showFilterModal} onRequestClose={() => setShowFilterModal(false)}>
        <TouchableOpacity style={styles.filterOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <View style={[styles.filterMenu, { backgroundColor: colors.card }]}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>Select Time Period</Text>
            {TIME_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filterOption, { borderBottomColor: colors.border }, selectedFilter === filter.value && { backgroundColor: colors.tint }]}
                onPress={() => applyFilter(allExpenses, filter.value)}
              >
                <Text style={[styles.filterOptionText, { color: colors.text }, selectedFilter === filter.value && { color: colors.primary, fontWeight: 'bold' }]}>
                  {filter.label}
                </Text>
                {selectedFilter === filter.value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ADD MODAL */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.subText }]}>Amount (₹)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]} 
              placeholder="0" placeholderTextColor={colors.subText} 
              keyboardType="numeric" value={amount} onChangeText={setAmount} 
            />

            <Text style={[styles.label, { color: colors.subText }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryItem, selectedCategory === cat.id && { backgroundColor: colors.tint }, { borderColor: selectedCategory === cat.id ? cat.color : 'transparent' }]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: cat.color + '20' }]}>
                    <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                  </View>
                  <Text style={[styles.categoryText, { color: colors.subText }, selectedCategory === cat.id && { color: cat.color, fontWeight: 'bold' }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.subText }]}>Note</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]} 
              placeholder="Note" placeholderTextColor={colors.subText} 
              value={note} onChangeText={setNote} 
            />

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Expense</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  scrollContent: { paddingBottom: 100 },
  
  totalCard: { marginHorizontal: 16, marginTop: 16, padding: 20, borderRadius: 16, elevation: 4 },
  totalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: '#E0E7FF', fontWeight: '500' },
  totalAmount: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' },

  filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  filterButtonText: { color: 'white', marginRight: 4, fontWeight: '600', fontSize: 12 },
  filterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  filterMenu: { width: '80%', borderRadius: 16, padding: 16, elevation: 5 },
  filterTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  filterOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  filterOptionText: { fontSize: 16 },

  listContainer: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  expenseItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, elevation: 1 },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseCat: { fontSize: 16, fontWeight: '600' },
  expenseNote: { fontSize: 12 },
  dateText: { fontSize: 10, marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: 'bold' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderRadius: 12, padding: 16, fontSize: 18 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryItem: { width: '30%', alignItems: 'center', padding: 8, borderRadius: 12, borderWidth: 2, marginBottom: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  categoryText: { fontSize: 12 },
  saveButton: { borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
