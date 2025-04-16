import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button, Card } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { useAppTheme } from "../../themes";
import { useSettings } from "../../settings";

export const SettingsScreen = () => {
  const { theme, themes, setTheme } = useAppTheme();
  const { language, region, setLanguage, setRegion } = useSettings();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Theme Selection */}
      <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>
        {language === "es" ? "Seleccionar Tema" : "Select Theme"}
      </Text>
      {Object.values(themes).map((t) => (
        <Card
          key={t.name}
          style={[
            styles.themeCard,
            { 
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.border 
            }
          ]}
        >
          <Card.Content>
            <View style={styles.themeContent}>
              <View style={[styles.colorPreview, { backgroundColor: t.colors.primary }]} />
              <Text style={{ color: theme.colors.text }}>{t.name}</Text>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button
              mode={theme.name === t.name ? 'contained' : 'outlined'}
              onPress={() => setTheme(t.name)}
            >
              {theme.name === t.name ? 
                (language === "es" ? "Seleccionado" : "Selected") : 
                (language === "es" ? "Seleccionar" : "Select")}
            </Button>
          </Card.Actions>
        </Card>
      ))}

      {/* Language Selection */}
      <Text style={[styles.settingsTitle, { color: theme.colors.text, marginTop: 20 }]}>
        {language === "es" ? "Idioma" : "Language"}
      </Text>
      <Card style={[styles.themeCard, { backgroundColor: theme.colors.cardBackground }]}>
        <Picker
          selectedValue={language}
          onValueChange={setLanguage}
          style={{ backgroundColor: theme.colors.surface }}
          dropdownIconColor={theme.colors.text}
        >
          <Picker.Item label="Español" value="es" color={theme.colors.text} />
          <Picker.Item label="English" value="en" color={theme.colors.text} />
        </Picker>
      </Card>

      {/* Region Selection */}
      <Text style={[styles.settingsTitle, { color: theme.colors.text, marginTop: 20 }]}>
        {language === "es" ? "Región" : "Region"}
      </Text>
      <Card style={[styles.themeCard, { backgroundColor: theme.colors.cardBackground }]}>
        <Picker
          selectedValue={region}
          onValueChange={setRegion}
          style={{ backgroundColor: theme.colors.surface }}
          dropdownIconColor={theme.colors.text}
        >
          <Picker.Item label="Colombia" value="CO" color={theme.colors.text} />
          <Picker.Item label="United States" value="US" color={theme.colors.text} />
        </Picker>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
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
    padding: 10,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});