import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1F2937',
  subText: '#6B7280',
  primary: '#6366F1',
  tint: '#F3F4F6',
  border: '#E5E7EB',
  input: '#F3F4F6',
  danger: '#EF4444',
  success: '#10B981',
};

export const darkColors = {
  background: '#111827',
  card: '#1F2937',
  text: '#F9FAFB',
  subText: '#9CA3AF',
  primary: '#818CF8',
  tint: '#374151',
  border: '#374151',
  input: '#374151',
  danger: '#F87171',
  success: '#34D399',
};

type ThemeContextType = {
  isDark: boolean;
  colors: typeof lightColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const savedTheme = await AsyncStorage.getItem('app_theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    } else {
      setIsDark(systemScheme === 'dark');
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    await AsyncStorage.setItem('app_theme', newMode ? 'dark' : 'light');
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
