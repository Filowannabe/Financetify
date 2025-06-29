// src/screens/subscriptions/FormScreen.tsx
import React, { useState } from "react";
import { View, TouchableWithoutFeedback, Keyboard, Alert } from "react-native";
import { Button, TextInput, Snackbar, Text } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { format, parse, startOfDay, addMonths } from "date-fns";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { useAppTheme } from "../../themes";
import { useSettings } from "../../settings";
import { useSubscriptions } from "./SubscriptionContext";
import { SubscriptionEntity } from "../../types/SubscriptionTypes";
import { RootNavigation } from "../../types/navigation";

/* ────────────────────────────────────────────────
   Tipos de navegación
───────────────────────────────────────────────── */
interface RouteParams {
  index?: number;
  subscription?: SubscriptionEntity;
  fromFirebase?: boolean; // ← indica si proviene de Firestore
}

interface FormScreenProps {
  route: { params?: RouteParams };
}

/* ────────────────────────────────────────────────
   Componente
───────────────────────────────────────────────── */
export const FormScreen = ({ route }: FormScreenProps) => {
  /* ==== Hooks & contexto ================================================= */

  const { theme } = useAppTheme();
  const { language, region } = useSettings();

  const navigation = useNavigation<RootNavigation>();
  const resetForm = () => {
    setName("");
    setAmount("");
    setLastPayment(startOfDay(new Date()));
    setSaveToFirebase(false); // vuelve al valor por defecto
  };

  const {
    /* Local */
    subscriptions,
    addSubscription,
    updateSubscription,

    /* Firebase */
    firebaseSubscriptions,
    updateSubscriptionFirebase,
    saveSubscriptionsToFirebase,
    loadSubscriptionsFromFirebase,

    /* Util */
    forceReloadSubscriptions,
  } = useSubscriptions();

  /* ==== Variables de modo =============================================== */

  const isEdit = route.params?.index !== undefined;
  const isFromFirebase = route.params?.fromFirebase === true;

  /* ==== Formato de fecha ================================================= */

  const dateFormat = region === "CO" ? "dd/MM/yyyy" : "MM/dd/yyyy";
  const formatDate = (d: Date) => format(startOfDay(d), dateFormat);

  /* ==== Estado del formulario =========================================== */

  const [lastPayment, setLastPayment] = useState(
    route.params?.subscription
      ? startOfDay(
          parse(route.params.subscription.lastPayment, dateFormat, new Date())
        )
      : startOfDay(new Date())
  );

  const [name, setName] = useState(route.params?.subscription?.name || "");
  const [amount, setAmount] = useState(
    route.params?.subscription?.amount?.toString() || ""
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [visibleSnackbar, setVisibleSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  /* Selector para nuevas suscripciones (por defecto respeta origen) */
  const [saveToFirebase, setSaveToFirebase] = useState(isFromFirebase);

  /* ────────────────────────────────────────────────────────────────────────
     Submit
  ──────────────────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!name || !amount || parseFloat(amount) <= 0) {
      setSnackbarMessage(
        language === "es" ? "Complete todos los campos" : "Fill all fields"
      );
      setVisibleSnackbar(true);
      return;
    }

    const subscription: SubscriptionEntity = {
      name,
      lastPayment: formatDate(lastPayment),
      nextPayment: formatDate(addMonths(lastPayment, 1)),
      amount: parseFloat(amount),
    };

    try {
      /* ===== EDICIÓN ===== */
      if (isEdit && route.params?.index !== undefined) {
        if (isFromFirebase) {
          await updateSubscriptionFirebase(route.params.index, subscription);
          await loadSubscriptionsFromFirebase();
        } else {
          await updateSubscription(route.params.index, subscription);
          await forceReloadSubscriptions(null);
        }

        resetForm(); // 👈 limpia
        navigation.navigate("Subscriptions2", {
          screen: "List",
          params: { defaultToFirebase: saveToFirebase },
        });

        return;
      }

      /* ===== NUEVA ===== */
      if (saveToFirebase) {
        const updated = [...firebaseSubscriptions, subscription];
        await saveSubscriptionsToFirebase(updated);
      } else {
        await addSubscription(subscription);
      }

      resetForm(); // 👈 limpia

      navigation.navigate("Subscriptions2", {
        screen: "List",
        params: { defaultToFirebase: saveToFirebase },
      });
    } catch (err) {
      setSnackbarMessage(language === "es" ? "Error al guardar" : "Save error");
      setVisibleSnackbar(true);
    }
  };

  /* ────────────────────────────────────────────────────────────────────────
     Exportar / Importar CSV (sin cambios)
  ──────────────────────────────────────────────────────────────────────── */
  const exportToCSV = async () => {
    try {
      const csvContent = [
        '"Name","Last Payment","Next Payment","Amount"',
        ...subscriptions.map(
          (sub) =>
            `"${sub.name}","${sub.lastPayment}","${sub.nextPayment}",${sub.amount}`
        ),
      ].join("\n");

      const perms =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (perms.granted) {
        const uri = await FileSystem.StorageAccessFramework.createFileAsync(
          perms.directoryUri,
          `Subscriptions_${format(new Date(), "yyyyMMdd_HHmmss")}`,
          "text/csv"
        );
        await FileSystem.writeAsStringAsync(uri, csvContent);
        Alert.alert(
          "Success",
          language === "es" ? "Exportado correctamente" : "Export successful"
        );
      }
    } catch {
      Alert.alert(
        "Error",
        language === "es" ? "Error al exportar" : "Export failed"
      );
    }
  };

  const importFromCSV = async () => {
    try {
      const result: any = await DocumentPicker.getDocumentAsync({
        type: ["text/csv"],
        copyToCacheDirectory: true,
      });
      if (result.type === "success") {
        const csv = await FileSystem.readAsStringAsync(result.uri);
        const newSubs = csv
          .split("\n")
          .slice(1)
          .reduce<SubscriptionEntity[]>((acc, line) => {
            const [n, lp, np, amt] = line.replace(/"/g, "").split(",");
            if (n && lp && np && amt)
              acc.push({
                name: n.trim(),
                lastPayment: lp.trim(),
                nextPayment: np.trim(),
                amount: parseFloat(amt.trim()),
              });
            return acc;
          }, []);
        for (const s of newSubs) await addSubscription(s);
        Alert.alert(
          "Success",
          language === "es"
            ? `Importadas ${newSubs.length} suscripciones`
            : `Imported ${newSubs.length} subscriptions`
        );
      }
    } catch {
      Alert.alert(
        "Error",
        language === "es" ? "Error al importar" : "Import failed"
      );
    }
  };

  /* ────────────────────────────────────────────────────────────────────────
     UI
  ──────────────────────────────────────────────────────────────────────── */
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={{
          flex: 1,
          padding: 20,
          backgroundColor: theme.colors.background,
        }}
      >
        {/* Nombre */}
        <TextInput
          label={
            language === "es" ? "Nombre de suscripción" : "Subscription name"
          }
          value={name}
          onChangeText={setName}
          style={{ marginBottom: 10 }}
          theme={{ colors: { text: theme.colors.text } }}
        />

        {/* Monto */}
        <TextInput
          label={language === "es" ? "Monto mensual" : "Monthly amount"}
          value={amount}
          keyboardType="numeric"
          onChangeText={(txt) => setAmount(txt.replace(/[^0-9.]/g, ""))}
          style={{ marginBottom: 10 }}
          theme={{ colors: { text: theme.colors.text } }}
        />

        {/* Fecha */}
        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          style={{ marginBottom: 10 }}
          labelStyle={{ color: theme.colors.text }}
        >
          {language === "es" ? "Seleccionar fecha" : "Select date"}
        </Button>

        <Text
          style={{
            marginBottom: 20,
            color: theme.colors.text,
            fontSize: 16,
          }}
        >
          {language === "es" ? "Fecha seleccionada:" : "Selected date:"}{" "}
          {formatDate(lastPayment)}
        </Text>

        {showDatePicker && (
          <DateTimePicker
            value={lastPayment}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) setLastPayment(startOfDay(date));
            }}
          />
        )}

        {/* Selector de destino (solo visible en creación) */}
        {!isEdit && (
          <>
            <Button
              mode="outlined"
              onPress={() => setSaveToFirebase(!saveToFirebase)}
              style={{ marginBottom: 10 }}
              labelStyle={{ color: theme.colors.text }}
              icon={saveToFirebase ? "cloud" : "content-save"}
            >
              {saveToFirebase
                ? language === "es"
                  ? "Guardar en Firebase"
                  : "Save to Firebase"
                : language === "es"
                ? "Guardar localmente"
                : "Save locally"}
            </Button>

            <Text
              style={{
                marginBottom: 20,
                color: saveToFirebase
                  ? theme.colors.primary
                  : theme.colors.text,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              {saveToFirebase
                ? language === "es"
                  ? "Guardando en Firebase ☁️"
                  : "Saving to Firebase ☁️"
                : language === "es"
                ? "Guardando localmente 📱"
                : "Saving locally 📱"}
            </Text>
          </>
        )}

        {/* Botón guardar / actualizar */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={{ marginVertical: 10 }}
          labelStyle={{ color: theme.colors.text }}
        >
          {isEdit
            ? language === "es"
              ? "Actualizar"
              : "Update"
            : language === "es"
            ? "Agregar"
            : "Add"}
        </Button>

        {/* Export / Import */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
          <Button
            mode="contained"
            onPress={exportToCSV}
            style={{ flex: 1, marginRight: 10 }}
            labelStyle={{ color: theme.colors.text }}
          >
            {language === "es" ? "Exportar CSV" : "Export CSV"}
          </Button>

          <Button
            mode="contained"
            onPress={importFromCSV}
            style={{ flex: 1, marginLeft: 10 }}
            labelStyle={{ color: theme.colors.text }}
          >
            {language === "es" ? "Importar CSV" : "Import CSV"}
          </Button>
        </View>

        {/* Snackbar */}
        <Snackbar
          visible={visibleSnackbar}
          onDismiss={() => setVisibleSnackbar(false)}
          duration={3000}
          style={{ backgroundColor: theme.colors.subtitle }}
        >
          <Text style={{ color: theme.colors.text }}>{snackbarMessage}</Text>
        </Snackbar>
      </View>
    </TouchableWithoutFeedback>
  );
};
