import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // Import Theme Hook
import { useFilter } from '../context/FilterContext'; // Import Filter Context
import { getGeminiInsight } from '../lib/gemini'; // Import AI


const TIME_FILTERS = [
  { label: 'Today', value: '1' },
  { label: 'Last 7 Days', value: '7' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'All Time', value: 'all' },
];

const screenWidth = Dimensions.get('window').width;

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF6B6B',
  travel: '#4ECDC4',
  groceries: '#45B7D1',
  shopping: '#F7B731',
  entertainment: '#A55EEA',
  others: '#95A5A6',
};

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme(); // Theme Hook
  const { selectedFilter, setSelectedFilter } = useFilter(); // Filter Hook
  
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) {
        setLoading(false);
        return;
    }

    try {
      // 1. Fetch Data with date filtering
      let query = supabase
        .from('expenses')
        .select('category, amount, created_at')
        .eq('user_id', user.uid);

      // Apply date filter
      // Apply date filter
if (selectedFilter !== 'all') {
    const cutoffDate = new Date();
    // FIX: Match the logic from Home Screen so 'Today' shows only today's data
    if (selectedFilter === '1') {
        cutoffDate.setHours(0, 0, 0, 0);
    } else {
        const days = parseInt(selectedFilter);
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);
    }
    query = query.gte('created_at', cutoffDate.toISOString());
}

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        // 2. Process for Chart
        const categoryTotals: Record<string, number> = {};
        let totalSpent = 0;

        data.forEach((item) => {
          const amount = Number(item.amount);
          categoryTotals[item.category] = (categoryTotals[item.category] || 0) + amount;
          totalSpent += amount;
        });

        setTotal(totalSpent);

        const formattedData = Object.keys(categoryTotals).map((key) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          population: categoryTotals[key],
          color: CATEGORY_COLORS[key] || '#95A5A6',
          legendFontColor: isDark ? '#D1D5DB' : '#7F7F7F', // Adapt legend color
          legendFontSize: 12,
        }));

        formattedData.sort((a, b) => b.population - a.population);
        setChartData(formattedData);

        // 3. Get AI Insight (Only if data exists)
        if (data.length > 0) {
            setAiLoading(true);
            getGeminiInsight(data)
                .then(insight => setAiInsight(insight))
                .finally(() => setAiLoading(false));
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [selectedFilter, isDark]) // Re-run if filter or theme changes
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Analytics</Text>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>
            {TIME_FILTERS.find(f => f.value === selectedFilter)?.label || 'All Time'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : chartData.length > 0 ? (
          <>
            {/* AI INSIGHT CARD */}
            <View style={[styles.aiCard, { backgroundColor: isDark ? '#312E81' : '#EEF2FF', borderColor: colors.primary }]}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:8}}>
                    <Ionicons name="sparkles" size={20} color={colors.primary} />
                    <Text style={[styles.aiTitle, { color: colors.primary }]}>AI Insight</Text>
                </View>
                {aiLoading ? (
                    <Text style={[styles.aiText, { color: colors.text, fontStyle:'italic' }]}>Analyzing your spending habits...</Text>
                ) : (
                    <Text style={[styles.aiText, { color: colors.text }]}>{aiInsight || "Keep tracking to get better insights!"}</Text>
                )}
            </View>

            {/* CHART CARD */}
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Spending Breakdown</Text>
              <PieChart
                data={chartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor={'population'}
                backgroundColor={'transparent'}
                paddingLeft={'15'}
                absolute
              />
            </View>

            {/* DETAILS LIST */}
            <View style={styles.listContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
              {chartData.map((item, index) => (
                <View key={index} style={[styles.categoryRow, { backgroundColor: colors.card }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.categoryAmount, { color: colors.text }]}>₹{item.population.toFixed(0)}</Text>
                    <Text style={[styles.categoryPercent, { color: colors.subText }]}>
                      {((item.population / total) * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="stats-chart-outline" size={64} color={colors.subText} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No data to analyze</Text>
            <Text style={[styles.emptySubtext, { color: colors.subText }]}>Add expenses to see charts</Text>
          </View>
        )}
      </ScrollView>

      {/* FILTER MODAL */}
      <Modal animationType="fade" transparent={true} visible={showFilterModal} onRequestClose={() => setShowFilterModal(false)}>
        <TouchableOpacity style={styles.filterOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <View style={[styles.filterMenu, { backgroundColor: colors.card }]}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>Select Time Period</Text>
            {TIME_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filterOption, { borderBottomColor: colors.border }, selectedFilter === filter.value && { backgroundColor: colors.tint }]}
                onPress={() => {
                  setSelectedFilter(filter.value);
                  setShowFilterModal(false);
                }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  scrollContent: { paddingBottom: 40 },
  
  filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  filterButtonText: { color: '#6366F1', marginRight: 4, fontWeight: '600', fontSize: 12 },
  
  filterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  filterMenu: { width: '80%', borderRadius: 16, padding: 16, elevation: 5 },
  filterTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  filterOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  filterOptionText: { fontSize: 16 },
  
  aiCard: { margin: 16, marginBottom: 0, padding: 16, borderRadius: 16, borderWidth: 1 },
  aiTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  aiText: { fontSize: 14, lineHeight: 20 },

  chartCard: { margin: 16, padding: 16, borderRadius: 16, alignItems: 'center', elevation: 2 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, alignSelf: 'flex-start' },
  
  listContainer: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  categoryName: { fontSize: 16, fontWeight: '600' },
  categoryAmount: { fontSize: 16, fontWeight: 'bold' },
  categoryPercent: { fontSize: 12 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 8 },
});
