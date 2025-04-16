import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsContextType = {
  language: string;
  region: string;
  setLanguage: (lang: string) => void;
  setRegion: (reg: string) => void;
};

const SettingsContext = createContext<SettingsContextType>({
  language: 'es',
  region: 'CO',
  setLanguage: () => {},
  setRegion: () => {},
});

export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState('es');
  const [region, setRegion] = useState('CO');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await AsyncStorage.getItem('appSettings');
        if (settings) {
          const { lang, reg } = JSON.parse(settings);
          setLanguage(lang);
          setRegion(reg);
        }
      } catch (error) {
        console.log('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const saveLanguage = async (lang: string) => {
    setLanguage(lang);
    try {
      const settings = JSON.stringify({ lang, reg: region });
      await AsyncStorage.setItem('appSettings', settings);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const saveRegion = async (reg: string) => {
    setRegion(reg);
    try {
      const settings = JSON.stringify({ lang: language, reg });
      await AsyncStorage.setItem('appSettings', settings);
    } catch (error) {
      console.log('Error saving region:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{
      language,
      region,
      setLanguage: saveLanguage,
      setRegion: saveRegion
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);