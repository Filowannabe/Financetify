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
import { AppStackNavigation } from "../../types/navigation";

interface RouteParams {
  index?: number;
  subscription?: SubscriptionEntity;
}

interface FormScreenProps {
  route: {
    params?: RouteParams;
  };
}

export const FormScreen = ({ route }: FormScreenProps) => {
  const { theme } = useAppTheme();
  const { language, region } = useSettings();
  const navigation = useNavigation<AppStackNavigation<"Form">["navigation"]>();
  const {
    subscriptions,
    addSubscription,
    updateSubscription,
    forceReloadSubscriptions,
  } = useSubscriptions();

  // Date format moved before initial state declarations
  const dateFormat = region === "CO" ? "dd/MM/yyyy" : "MM/dd/yyyy";
  const formatDate = (date: Date) => format(startOfDay(date), dateFormat);

  // Fixed state initialization with startOfDay
  const [lastPayment, setLastPayment] = useState(
    route.params?.subscription
      ? startOfDay(
          parse(route.params.subscription.lastPayment, dateFormat, new Date())
        )
      : startOfDay(new Date())
  );

  const [name, setName] = useState(route.params?.subscription?.name || "");
  const [amount, setAmount] = useState(
    route.params?.subscription?.amount.toString() || ""
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [visibleSnackbar, setVisibleSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleSubmit = async () => {
    if (!name || !amount || parseFloat(amount) <= 0) {
      setSnackbarMessage(
        language === "es" ? "Complete todos los campos" : "Fill all fields"
      );
      setVisibleSnackbar(true);
      return;
    }

    try {
      const subscription = {
        name,
        lastPayment: formatDate(lastPayment),
        nextPayment: formatDate(addMonths(lastPayment, 1)),
        amount: parseFloat(amount),
      };

      if (route.params?.index !== undefined) {
        await updateSubscription(route.params.index, subscription);
        await forceReloadSubscriptions(null);
        navigation.navigate("List");
      } else {
        await addSubscription(subscription);
        await forceReloadSubscriptions(null);
        navigation.navigate("Subscriptions2");
      }
    } catch (error) {
      setSnackbarMessage(language === "es" ? "Error al guardar" : "Save error");
      setVisibleSnackbar(true);
    }
  };

  const exportToCSV = async () => {
    try {
      const csvContent = [
        '"Name","Last Payment","Next Payment","Amount"',
        ...subscriptions.map(
          (sub: SubscriptionEntity) =>
            `"${sub.name}","${sub.lastPayment}","${sub.nextPayment}",${sub.amount}`
        ),
      ].join("\n");

      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const uri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          `Subscriptions_${format(new Date(), "yyyyMMdd_HHmmss")}`,
          "text/csv"
        );
        await FileSystem.writeAsStringAsync(uri, csvContent);
        Alert.alert(
          "Success",
          language === "es" ? "Exportado correctamente" : "Export successful"
        );
      }
    } catch (error) {
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
        const newSubscriptions = csv
          .split("\n")
          .slice(1)
          .reduce((acc: SubscriptionEntity[], line) => {
            const [name, lastPayment, nextPayment, amount] = line
              .replace(/"/g, "")
              .split(",");
            if (name && lastPayment && nextPayment && amount) {
              acc.push({
                name: name.trim(),
                lastPayment: lastPayment.trim(),
                nextPayment: nextPayment.trim(),
                amount: parseFloat(amount.trim()),
              });
            }
            return acc;
          }, []);

        for (const sub of newSubscriptions) {
          await addSubscription(sub);
        }

        Alert.alert(
          "Success",
          language === "es"
            ? `Importadas ${newSubscriptions.length} suscripciones`
            : `Imported ${newSubscriptions.length} subscriptions`
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        language === "es" ? "Error al importar" : "Import failed"
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={{
          flex: 1,
          padding: 20,
          backgroundColor: theme.colors.background,
        }}
      >
        <TextInput
          label={
            language === "es" ? "Nombre de suscripción" : "Subscription name"
          }
          value={name}
          onChangeText={setName}
          style={{ marginBottom: 10 }}
          theme={{ colors: { text: theme.colors.text } }}
        />

        <TextInput
          label={language === "es" ? "Monto mensual" : "Monthly amount"}
          value={amount}
          keyboardType="numeric"
          onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ""))}
          style={{ marginBottom: 10 }}
          theme={{ colors: { text: theme.colors.text } }}
        />

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
              date && setLastPayment(startOfDay(date));
            }}
          />
        )}

        <Button
          mode="contained"
          onPress={() => {
            handleSubmit();
          }}
          style={{ marginVertical: 10 }}
          labelStyle={{ color: theme.colors.text }}
        >
          {route.params?.index !== undefined
            ? language === "es"
              ? "Actualizar"
              : "Update"
            : language === "es"
            ? "Agregar"
            : "Add"}
        </Button>

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
