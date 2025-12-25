import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  ScrollView, 
  Image, 
  Switch 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext'; // Import Theme Hook

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme(); // Use Theme
  
  const [name, setName] = useState('Student');
  const [isEditing, setIsEditing] = useState(false);
  const [daysActive, setDaysActive] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // --- LOAD DATA ---
  const loadProfile = async () => {
    try {
      // Load Name
      const savedName = await AsyncStorage.getItem('user_name');
      if (savedName) setName(savedName);

      // Load Profile Pic
      const savedImage = await AsyncStorage.getItem('user_profile_pic');
      if (savedImage) setProfileImage(savedImage);

      // Load Stats from Supabase
      const user = auth.currentUser;
      if (user) {
        const { data } = await supabase
            .from('expenses')
            .select('created_at')
            .eq('user_id', user.uid)
            .order('created_at', { ascending: true });

        if (data && data.length > 0) {
            setExpenseCount(data.length);
            const firstDate = new Date(data[0].created_at);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - firstDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            setDaysActive(diffDays);
        } else {
            setDaysActive(0);
            setExpenseCount(0);
        }
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  // --- SAVE NAME ---
  const saveName = async () => {
    await AsyncStorage.setItem('user_name', name);
    setIsEditing(false);
  };

  // --- LOGOUT ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
    }
  };

  // --- IMAGE PICKER ---
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await AsyncStorage.setItem('user_profile_pic', uri);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color="white" />
            )}
            <View style={[styles.cameraIcon, { borderColor: colors.card }]}>
                <Ionicons name="camera" size={12} color="white" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.infoContainer}>
            <Text style={[styles.label, { color: colors.subText }]}>Hello,</Text>
            {isEditing ? (
              <View style={styles.editRow}>
                <TextInput 
                  style={[styles.nameInput, { color: colors.text, borderColor: colors.primary }]} 
                  value={name} 
                  onChangeText={setName}
                  autoFocus
                />
                <TouchableOpacity onPress={saveName}>
                  <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.editRow}>
                <Text style={[styles.nameText, { color: colors.text }]}>{name}</Text>
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Ionicons name="pencil" size={18} color={colors.subText} style={{marginLeft: 8}} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* STATS GRID */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Ionicons name="flame" size={28} color="#F59E0B" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{daysActive}</Text>
            <Text style={[styles.statLabel, { color: colors.subText }]}>Day Streak</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Ionicons name="receipt" size={28} color="#10B981" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{expenseCount}</Text>
            <Text style={[styles.statLabel, { color: colors.subText }]}>Total Entries</Text>
          </View>
        </View>

        {/* SETTINGS MENU */}
        <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
          
          {/* DARK MODE */}
          <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="moon" size={24} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>Dark Mode</Text>
            <Switch 
              value={isDark} 
              onValueChange={toggleTheme} 
              trackColor={{false: '#767577', true: colors.primary}}
              thumbColor={'white'}
            />
          </View>

          {/* PLACEHOLDER FOR CSV (Disabled to prevent errors) */}
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => Alert.alert("Coming Soon", "CSV Export will be available in the next update!")}
          >
            <Ionicons name="document-text-outline" size={24} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>Export Data (CSV)</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: 'transparent' }]}>
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          </TouchableOpacity>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <Text style={[styles.versionText, { color: colors.subText }]}>SETA v1.0.0</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  content: { padding: 20 },
  
  profileCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#C7D2FE', justifyContent: 'center', alignItems: 'center', marginRight: 16, position: 'relative' },
  avatarImage: { width: 70, height: 70, borderRadius: 35 },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6366F1', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  
  infoContainer: { flex: 1 },
  label: { fontSize: 14 },
  nameText: { fontSize: 24, fontWeight: 'bold' },
  nameInput: { fontSize: 24, fontWeight: 'bold', borderBottomWidth: 1, flex: 1, marginRight: 8 },
  editRow: { flexDirection: 'row', alignItems: 'center' },

  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { width: '48%', padding: 20, borderRadius: 16, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 14 },

  menuContainer: { borderRadius: 16, padding: 8, elevation: 2, marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  menuText: { flex: 1, fontSize: 16, marginLeft: 16 },

  logoutButton: { backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  
  versionText: { textAlign: 'center', marginTop: 20, fontSize: 12 },
});
