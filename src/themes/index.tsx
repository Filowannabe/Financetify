import {
  StyleSheet,
} from "react-native";
import {createContext, useContext, useEffect,useState,  useCallback} from "react";
import { Theme, ThemeContextType } from "../types/themeType";

import AsyncStorage from "@react-native-async-storage/async-storage";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 20,
    fontSize: 16,
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  themeCard: {
    marginBottom: 15,
    width: '100%',
    borderWidth: 1,
  },
  themeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});


export const defaultThemes = {
  light: {
    name: 'light',
    dark: false,
    colors: {
      primary: '#6200ee',
      background: '#f5f5f5',
      surface: '#ffffff',
      accent: '#03dac4',
      text: '#000000',
      subtitle: '#666666',
      cardBackground: '#ffffff',
      border: '#e0e0e0',
    },
  },
  dark: {
    name: 'dark',
    dark: true,
    colors: {
      primary: '#88FF00FF',
      background: '#000000FF',
      surface: '#000000FF',
      accent: '#03dac4',
      text: '#ffffff',
      subtitle: '#a0a0a0',
      cardBackground: '#2c2c2c',
      border: '#404040',
    },
  },
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultThemes.light,
  themes: defaultThemes,
  setTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [themeName, setThemeName] = useState<string>('light');
  const [themes, setThemes] = useState<Record<string, Theme>>(defaultThemes);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('selectedTheme');
        if (savedTheme && themes[savedTheme]) {
          setThemeName(savedTheme);
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  const setTheme = useCallback(async (name: string) => {
    if (themes[name]) {
      setThemeName(name);
      try {
        await AsyncStorage.setItem('selectedTheme', name);
      } catch (error) {
        console.log('Error saving theme:', error);
      }
    }
  }, [themes]);

  return (
    <ThemeContext.Provider value={{ theme: themes[themeName], themes, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const stylesApp = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 20,
    fontSize: 16,
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  themeCard: {
    marginBottom: 15,
    width: '100%',
    borderWidth: 1,
  },
  themeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});