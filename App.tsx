import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  StyleSheet,
} from "react-native";
import { Button, TextInput, Card, Snackbar, Icon, Provider as PaperProvider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { format, parse, differenceInDays, isThisMonth, addMonths, isValid, startOfDay } from 'date-fns';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

type SubscriptionEntity = {
  name: string;
  lastPayment: string;
  nextPayment: string;
  amount: number;
};

type Theme = {
  name: string;
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    surface: string;
    accent: string;
    text: string;
    subtitle: string;
    cardBackground: string;
    border: string;
  };
};

type ThemeContextType = {
  theme: Theme;
  themes: Record<string, Theme>;
  setTheme: (themeName: string) => void;
};

const Tab = createBottomTabNavigator();

const defaultThemes = {
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
      primary: '#bb86fc',
      background: '#121212',
      surface: '#1e1e1e',
      accent: '#03dac4',
      text: '#ffffff',
      subtitle: '#a0a0a0',
      cardBackground: '#2c2c2c',
      border: '#404040',
    },
  },
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultThemes.light,
  themes: defaultThemes,
  setTheme: () => {},
});

const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
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

const useTheme = () => useContext(ThemeContext);

const HomeScreen = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>📱 Subscription Manager</Text>
      <Icon source="rocket" size={40} color={theme.colors.primary} />
      <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
        Manage all your subscriptions in one place!
      </Text>
    </View>
  );
};

const SettingsScreen = () => {
  const { theme, themes, setTheme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>
        Select Theme
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
              {theme.name === t.name ? 'Selected' : 'Select'}
            </Button>
          </Card.Actions>
        </Card>
      ))}
    </View>
  );
};

const SubscriptionsScreen = () => {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [lastPayment, setLastPayment] = useState(new Date());
  const [amount, setAmount] = useState(0);
  const [subscriptions, setSubscriptions] = useState<SubscriptionEntity[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionEntity[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [visibleSnackbar, setVisibleSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [region, setRegion] = useState("CO");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [language, setLanguage] = useState("es");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [filterCurrentMonth, setFilterCurrentMonth] = useState(false);

  const dateFormat = region === "CO" ? "dd/MM/yyyy" : "MM/dd/yyyy";
  
  const parseDate = (dateString: string) => startOfDay(parse(dateString, dateFormat, new Date()));
  const formatDate = (date: Date) => format(date, dateFormat);

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        const storedSubscriptions = await AsyncStorage.getItem("subscriptions");
        if (storedSubscriptions) {
          const subscriptionsData = JSON.parse(storedSubscriptions);
          setSubscriptions(subscriptionsData);
          setFilteredSubscriptions(subscriptionsData);
        }
      } catch (error) {
        console.log("Error loading subscriptions:", error);
      }
    };
    loadSubscriptions();
  }, []);

  useEffect(() => {
    const filtered = subscriptions.filter(sub => {
      if (searchQuery && !sub.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterCurrentMonth) return isThisMonth(parseDate(sub.nextPayment));
      return true;
    });
    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchQuery, filterCurrentMonth]);

  // Global refresh function
  const handleRefreshSubscriptions = async () => {
    const updated = await Promise.all(subscriptions.map(async (sub) => {
      const nextPaymentDate = parseDate(sub.nextPayment);
      if (!isValid(nextPaymentDate)) return sub;
      
      const today = startOfDay(new Date());
      if (differenceInDays(nextPaymentDate, today) < 0) {
        const newLastPayment = nextPaymentDate;
        const newNextPayment = startOfDay(addMonths(newLastPayment, 1));
        return {
          ...sub,
          lastPayment: formatDate(newLastPayment),
          nextPayment: formatDate(newNextPayment)
        };
      }
      return sub;
    }));
    
    setSubscriptions(updated);
    await AsyncStorage.setItem("subscriptions", JSON.stringify(updated));
  };

  // Individual refresh function
  const handleRefreshIndividualSubscription = async (index: number) => {
    const updated = await Promise.all(subscriptions.map(async (sub, i) => {
      if (i !== index) return sub;
      
      const nextPaymentDate = parseDate(sub.nextPayment);
      if (!isValid(nextPaymentDate)) return sub;
      
      const today = startOfDay(new Date());
      if (differenceInDays(nextPaymentDate, today) < 0) {
        const newLastPayment = nextPaymentDate;
        const newNextPayment = startOfDay(addMonths(newLastPayment, 1));
        return {
          ...sub,
          lastPayment: formatDate(newLastPayment),
          nextPayment: formatDate(newNextPayment)
        };
      }
      return sub;
    }));
    
    setSubscriptions(updated);
    await AsyncStorage.setItem("subscriptions", JSON.stringify(updated));
  };

  const handleAddOrUpdateSubscription = async () => {
    if (!name || amount <= 0) {
      setSnackbarMessage(language === "es" ? "Complete todos los campos" : "Fill all fields");
      setVisibleSnackbar(true);
      return;
    }

    const newSubscription = {
      name,
      lastPayment: formatDate(lastPayment),
      nextPayment: formatDate(addMonths(lastPayment, 1)),
      amount,
    };

    const updatedSubscriptions = isUpdating && editingIndex !== null
      ? subscriptions.map((sub, index) => index === editingIndex ? newSubscription : sub)
      : [...subscriptions, newSubscription];

    setSubscriptions(updatedSubscriptions);
    await AsyncStorage.setItem("subscriptions", JSON.stringify(updatedSubscriptions));
    
    setName("");
    setLastPayment(new Date());
    setAmount(0);
    setIsUpdating(false);
    setEditingIndex(null);
    setSnackbarMessage(language === "es" ? (isUpdating ? "Actualizada" : "Agregada") : (isUpdating ? "Updated" : "Added"));
    setVisibleSnackbar(true);
  };

  const handleDeleteSubscription = async (index: number) => {
    const updatedSubscriptions = subscriptions.filter((_, i) => i !== index);
    setSubscriptions(updatedSubscriptions);
    await AsyncStorage.setItem("subscriptions", JSON.stringify(updatedSubscriptions));
    setSnackbarMessage(language === "es" ? "Eliminada" : "Deleted");
    setVisibleSnackbar(true);
  };

  const handleModifySubscription = (index: number) => {
    const subscription = subscriptions[index];
    setName(subscription.name);
    setLastPayment(parseDate(subscription.lastPayment));
    setAmount(subscription.amount);
    setEditingIndex(index);
    setIsUpdating(true);
  };

  const calculateDaysRemaining = (nextPayment: string) => {
    const parsedDate = parseDate(nextPayment);
    const today = startOfDay(new Date());
    return isValid(parsedDate) ? differenceInDays(parsedDate, today) : 0;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(region === "CO" ? "es-CO" : "en-US", {
      style: "currency",
      currency: "COP"
    }).format(amount).replace("COP", "").trim();
  };

  const exportToCSV = async () => {
    try {
      const csvContent = [
        '"Nombre","Último Pago","Próximo Pago","Monto"',
        ...subscriptions.map(sub => 
          `"${sub.name}","${sub.lastPayment}","${sub.nextPayment}",${sub.amount}`
        )
      ].join("\n");

      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const uri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          `Subscriptions_${format(new Date(), 'yyyyMMdd_HHmmss')}`,
          "text/csv"
        );
        await FileSystem.writeAsStringAsync(uri, csvContent);
        Alert.alert("Éxito", language === "es" ? "Exportado correctamente" : "Export successful");
      }
    } catch (error) {
      Alert.alert("Error", language === "es" ? "Error al exportar" : "Export failed");
    }
  };

  const importFromCSV = async () => {
    try {
      const result:any = await DocumentPicker.getDocumentAsync({
        type: ["text/csv"],
        copyToCacheDirectory: true
      });

      if (result.type === "success") {
        const csv = await FileSystem.readAsStringAsync(result.uri);
        const importedSubscriptions = csv.split("\n").reduce((acc, line) => {
          const cleaned = line.replace(/"/g, '').trim();
          if (cleaned) {
            const [name, lastPayment, nextPayment, amount] = cleaned.split(',');
            if (name && lastPayment && nextPayment && amount) {
              acc.push({
                name: name.trim(),
                lastPayment: lastPayment.trim(),
                nextPayment: nextPayment.trim(),
                amount: parseFloat(amount.trim())
              });
            }
          }
          return acc;
        }, [] as SubscriptionEntity[]);

        setSubscriptions(importedSubscriptions);
        await AsyncStorage.setItem("subscriptions", JSON.stringify(importedSubscriptions));
        Alert.alert("Éxito", language === "es" ? "Importación exitosa" : "Import successful");
      }
    } catch (error) {
      Alert.alert("Error", language === "es" ? "Error al importar archivo CSV" : "Failed to import CSV file");
    }
  };

  const calculateTotals = () => {
    return subscriptions.reduce((acc, sub) => {
      const isCurrent = isThisMonth(parseDate(sub.nextPayment));
      if (isCurrent) acc.currentMonthTotal += sub.amount;
      acc.total += sub.amount;
      return acc;
    }, { currentMonthTotal: 0, total: 0 });
  };

  const { currentMonthTotal, total } = calculateTotals();

  const renderSubscriptionItem = ({ item, index }: { item: SubscriptionEntity; index: number }) => {
    const nextPaymentDate = parseDate(item.nextPayment);
    const isCurrent = isValid(nextPaymentDate) && isThisMonth(nextPaymentDate);
    const daysRemaining = calculateDaysRemaining(item.nextPayment);
    
    let bgColor = theme.colors.primary;
    if (isCurrent) {
      bgColor = daysRemaining > 20 ? "#4CAF50" :
                daysRemaining > 5 ? "#FF9800" : 
                "#F44336";
    }

    return (
      <Card style={{ marginBottom: 15, backgroundColor: theme.colors.cardBackground }}>
        <Card.Content>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.colors.text }}>{item.name}</Text>
          <Text style={{ color: theme.colors.subtitle }}>{`${language === "es" ? "Último pago:" : "Last Payment:"} ${item.lastPayment}`}</Text>
          <Text style={{ color: theme.colors.subtitle }}>{`${language === "es" ? "Próximo pago:" : "Next Payment:"} ${item.nextPayment}`}</Text>
          <Text style={{ color: theme.colors.subtitle }}>{`${language === "es" ? "Monto:" : "Amount:"} ${formatAmount(item.amount)}`}</Text>
        </Card.Content>
        <Card.Actions>
          <Button icon="delete" onPress={() => handleDeleteSubscription(index)}>
            {language === "es" ? "Eliminar" : "Delete"}
          </Button>
          <Button icon="pencil" onPress={() => handleModifySubscription(index)}>
            {language === "es" ? "Editar" : "Edit"}
          </Button>
          <Button icon="refresh" onPress={() => handleRefreshIndividualSubscription(index)}>
            {language === "es" ? "Actualizar" : "Refresh"}
          </Button>
        </Card.Actions>
        <View style={{ alignItems: "center", padding: 10 }}>
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 50,
            backgroundColor: bgColor,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: isCurrent ? 0 : 2,
            borderColor: theme.colors.border
          }}>
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 20 }}>
              {Math.abs(daysRemaining)}
            </Text>
            <Text style={{ color: "white", textAlign: "center" }}>
              {daysRemaining >= 0 
                ? (language === "es" ? "Días restantes" : "Days left")
                : (language === "es" ? "Días vencidos" : "Days overdue")}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, padding: 20, backgroundColor: theme.colors.background }}>
        {!isMinimized && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <Picker
                selectedValue={language}
                onValueChange={setLanguage}
                style={{ flex: 1, marginRight: 10, backgroundColor: theme.colors.surface }}
                dropdownIconColor={theme.colors.text}
              >
                <Picker.Item label="Español" value="es" color={theme.colors.text} />
                <Picker.Item label="English" value="en" color={theme.colors.text} />
              </Picker>

              <Picker
                selectedValue={region}
                onValueChange={setRegion}
                style={{ flex: 1, backgroundColor: theme.colors.surface }}
                dropdownIconColor={theme.colors.text}
              >
                <Picker.Item label="Colombia" value="CO" color={theme.colors.text} />
              </Picker>
            </View>

            <Button
              mode="contained"
              onPress={handleRefreshSubscriptions}
              style={{ marginBottom: 10 }}
              labelStyle={{ color: theme.colors.text }}
            >
              {language === "es" ? "Actualizar Todas" : "Refresh All"}
            </Button>

            <TextInput
              label={language === "es" ? "Buscar suscripciones" : "Search subscriptions"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ marginBottom: 10 }}
              theme={{ colors: { text: theme.colors.text } }}
            />

            <Button
              mode="outlined"
              onPress={() => setFilterCurrentMonth(!filterCurrentMonth)}
              style={{ marginBottom: 10 }}
              labelStyle={{ color: theme.colors.text }}
            >
              {filterCurrentMonth 
                ? (language === "es" ? "Mostrar todas" : "Show all") 
                : (language === "es" ? "Filtrar mes actual" : "Filter current month")}
            </Button>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontWeight: "bold", fontSize: 18, color: theme.colors.text }}>
                {language === "es" ? "Total este mes:" : "Current month:"} {formatAmount(currentMonthTotal)}
              </Text>
              <Text style={{ fontWeight: "bold", fontSize: 18, color: theme.colors.text }}>
                {language === "es" ? "Total general:" : "Total amount:"} {formatAmount(total)}
              </Text>
            </View>

            <TextInput
              label={language === "es" ? "Nombre de suscripción" : "Subscription name"}
              value={name}
              onChangeText={setName}
              style={{ marginBottom: 10 }}
              theme={{ colors: { text: theme.colors.text } }}
            />

            <TextInput
              label={language === "es" ? "Monto mensual" : "Monthly amount"}
              value={amount.toString()}
              keyboardType="numeric"
              onChangeText={(text) => setAmount(Number(text) || 0)}
              style={{ marginBottom: 10 }}
              theme={{ colors: { text: theme.colors.text } }}
            />

            <Button
              mode="contained"
              onPress={() => setShowDatePicker(true)}
              style={{ marginBottom: 10 }}
              labelStyle={{ color: theme.colors.text }}
            >
              {language === "es" ? "Seleccionar fecha" : "Select date"}
            </Button>

            <Text style={{ marginBottom: 10, color: theme.colors.text }}>
              {language === "es" ? "Fecha seleccionada:" : "Selected date:"} {formatDate(lastPayment)}
            </Text>

            {showDatePicker && (
              <DateTimePicker
                value={lastPayment}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  date && setLastPayment(date);
                }}
              />
            )}

            <Button
              mode="contained"
              onPress={handleAddOrUpdateSubscription}
              style={{ marginVertical: 10 }}
              labelStyle={{ color: theme.colors.text }}
            >
              {isUpdating 
                ? (language === "es" ? "Actualizar" : "Update") 
                : (language === "es" ? "Agregar" : "Add")}
            </Button>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Button mode="contained" onPress={exportToCSV} labelStyle={{ color: theme.colors.text }}>
                {language === "es" ? "Exportar CSV" : "Export CSV"}
              </Button>
              <Button mode="contained" onPress={importFromCSV} labelStyle={{ color: theme.colors.text }}>
                {language === "es" ? "Importar CSV" : "Import CSV"}
              </Button>
            </View>
          </>
        )}

        <Button
          mode="text"
          onPress={() => setIsMinimized(!isMinimized)}
          style={{ marginVertical: 10 }}
          labelStyle={{ color: theme.colors.text }}
        >
          {isMinimized 
            ? (language === "es" ? "▲ Mostrar formulario" : "▲ Show form") 
            : (language === "es" ? "▼ Ocultar formulario" : "▼ Hide form")}
        </Button>

        <FlatList
          data={filteredSubscriptions}
          renderItem={renderSubscriptionItem}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        <Snackbar
          visible={visibleSnackbar}
          onDismiss={() => setVisibleSnackbar(false)}
          duration={3000}
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Text style={{ color: theme.colors.text }}>{snackbarMessage}</Text>
        </Snackbar>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PaperProvider>
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: string;
                  switch (route.name) {
                    case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
                    case 'Subscriptions': iconName = focused ? 'format-list-bulleted' : 'format-list-bulleted'; break;
                    case 'Settings': iconName = focused ? 'cog' : 'cog-outline'; break;
                    default: iconName = 'alert';
                  }
                  return <Icon source={iconName} color={color} size={size} />;
                },
                tabBarActiveTintColor: '#6200ee',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: { paddingBottom: 5, height: 60 },
              })}
            >
              <Tab.Screen name="Home" component={HomeScreen} />
              <Tab.Screen name="Subscriptions" component={SubscriptionsScreen} />
              <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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