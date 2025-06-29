import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { Button, TextInput, Card, Snackbar, Text } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  format,
  parse,
  differenceInDays,
  isThisMonth,
  addMonths,
  isValid,
  startOfDay,
} from "date-fns";
import { SubscriptionEntity } from "../../types/SubscriptionTypes";
import { useAppTheme } from "../../themes";
import { useSettings } from "../../settings";
import { useSubscriptions } from "./SubscriptionContext";

export const ListScreen = ({ navigation, route }: any) => {
  const { theme } = useAppTheme();
  const { language, region } = useSettings();
  const {
    /* Local & Firebase */
    subscriptions,
    firebaseSubscriptions,
    isFirebaseLoaded,
    /* CRUD */
    deleteSubscription,
    deleteSubscriptionFirebase,
    /* Refresh */
    refreshAllSubscriptions,
    refreshAllFirebaseSubscriptions,
    refreshSingleSubscription,
    refreshSingleFirebaseSubscription,
    /* Util */
    forceReloadSubscriptions,
    loadSubscriptionsFromFirebase,
    saveSubscriptionsToFirebase,
  } = useSubscriptions();
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<
    SubscriptionEntity[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCurrentMonth, setFilterCurrentMonth] = useState(false);
  const [visibleSnackbar, setVisibleSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  // Nuevo estado para controlar qué datos mostrar
  const [showFirebaseData, setShowFirebaseData] = useState<boolean>(
    route.params?.defaultToFirebase ?? false
  );

  const dateFormat = region === "CO" ? "dd/MM/yyyy" : "MM/dd/yyyy";
  const parseDate = (dateString: string) =>
    startOfDay(parse(dateString, dateFormat, new Date()));
  useEffect(() => {
    if (route.params?.defaultToFirebase !== undefined) {
      setShowFirebaseData(route.params.defaultToFirebase);
    }
  }, [route.params?.defaultToFirebase]);

  /* ────────────────────────────────────────────────
     NUEVA función: copiar a Firebase
  ──────────────────────────────────────────────── */
  const handleCopyToFirebase = async () => {
    // Evitar copiar si aún no se han cargado datos de Firebase
    if (!isFirebaseLoaded) {
      setSnackbarMessage(
        language === "es"
          ? "Firestore aún no está listo"
          : "Firebase not ready yet"
      );
      setVisibleSnackbar(true);
      return;
    }

    // Nombres que ya existen en Firebase (case‑insensitive)
    const existing = new Set(
      firebaseSubscriptions.map((s) => s.name.toLowerCase())
    );

    // Sólo las locales que NO existen
    const toAdd = subscriptions.filter(
      (s) => !existing.has(s.name.toLowerCase())
    );

    if (toAdd.length === 0) {
      setSnackbarMessage(
        language === "es"
          ? "No hay suscripciones nuevas para copiar"
          : "No new subscriptions to copy"
      );
      setVisibleSnackbar(true);
      return;
    }

    // Guardar la lista combinada en Firestore
    await saveSubscriptionsToFirebase([...firebaseSubscriptions, ...toAdd]);
    await loadSubscriptionsFromFirebase(); // refresca estado

    setSnackbarMessage(
      language === "es"
        ? `Copiadas ${toAdd.length} suscripciones a Firebase`
        : `Copied ${toAdd.length} subscriptions to Firebase`
    );
    setVisibleSnackbar(true);
  };

  // ────────────────────────────────────────────────
  // NUEVA función: copiar desde Firebase a Local
  // ────────────────────────────────────────────────
  const handleCopyToLocal = async () => {
    const existing = new Set(subscriptions.map((s) => s.name.toLowerCase()));

    const toAdd = firebaseSubscriptions.filter(
      (s) => !existing.has(s.name.toLowerCase())
    );

    if (toAdd.length === 0) {
      setSnackbarMessage(
        language === "es"
          ? "No hay suscripciones nuevas para copiar"
          : "No new subscriptions to copy"
      );
      setVisibleSnackbar(true);
      return;
    }

    const updated = [...subscriptions, ...toAdd];
    await AsyncStorage.setItem("subscriptions", JSON.stringify(updated));
    await forceReloadSubscriptions(null);

    setSnackbarMessage(
      language === "es"
        ? `Copiadas ${toAdd.length} suscripciones a Local`
        : `Copied ${toAdd.length} subscriptions to Local`
    );
    setVisibleSnackbar(true);
  };

  // -------------------------
  // Funciones locales originales (SIN CAMBIOS)
  // -------------------------

  // Original load function
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        const storedSubscriptions = await AsyncStorage.getItem("subscriptions");
        if (storedSubscriptions) {
          const subscriptionsData = JSON.parse(storedSubscriptions);
          setFilteredSubscriptions(subscriptionsData);
        }
      } catch (error) {
        console.log("Error loading subscriptions:", error);
      }
    };
    loadSubscriptions();
  }, []);

  // Original filter effect
  useEffect(() => {
    const dataSource = showFirebaseData ? firebaseSubscriptions : subscriptions;

    const filtered = dataSource.filter((sub) => {
      if (
        searchQuery &&
        !sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (filterCurrentMonth) return isThisMonth(parseDate(sub.nextPayment));
      return true;
    });

    setFilteredSubscriptions(filtered);
  }, [
    subscriptions,
    firebaseSubscriptions,
    showFirebaseData,
    searchQuery,
    filterCurrentMonth,
  ]);

  // Original refresh all
  const handleRefreshSubscriptions = async () => {
    if (showFirebaseData) {
      await refreshAllFirebaseSubscriptions(); // actualiza en Firestore
      await loadSubscriptionsFromFirebase(); // vuelve a traer datos
    } else {
      await refreshAllSubscriptions(); // lógica original local
      await forceReloadSubscriptions(null); // recarga desde storage
    }

    setSnackbarMessage(
      language === "es"
        ? "Suscripciones actualizadas"
        : "Subscriptions refreshed"
    );
    setVisibleSnackbar(true);
  };

  // Original delete function
  const handleDeleteSubscription = async (index: number) => {
    if (showFirebaseData) {
      await deleteSubscriptionFirebase(index);
      await loadSubscriptionsFromFirebase(); // Refresca local
    } else {
      await deleteSubscription(index);
      await forceReloadSubscriptions(null);
    }

    setSnackbarMessage(language === "es" ? "Eliminada" : "Deleted");
    setVisibleSnackbar(true);
  };

  // Original modify function
  const handleModifySubscription = (index: number) => {
    navigation.navigate("Subscriptions2", {
      screen: "Form",
      params: {
        subscription: showFirebaseData
          ? firebaseSubscriptions[index]
          : subscriptions[index],
        index,
        fromFirebase: showFirebaseData,
      },
    });
  };

  // Original refresh single
  const handleRefreshIndividualSubscription = async (index: number) => {
    if (showFirebaseData) {
      // ➤ Sólo Firestore
      await refreshSingleFirebaseSubscription(index); // actualiza en la nube
      await loadSubscriptionsFromFirebase(); // refresca estado local
    } else {
      // ➤ Sólo AsyncStorage
      await refreshSingleSubscription(index); // usa la lógica original
      await forceReloadSubscriptions(null); // recarga desde storage
    }
  };

  // Original amount formatting
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(region === "CO" ? "es-CO" : "en-US", {
      style: "currency",
      currency: "COP",
    })
      .format(amount)
      .replace("COP", "")
      .trim();
  };

  // Original days remaining calculation
  const calculateDaysRemaining = (nextPayment: string) => {
    const parsedDate = parseDate(nextPayment);
    const today = startOfDay(new Date());
    return isValid(parsedDate) ? differenceInDays(parsedDate, today) : 0;
  };

  // Original render item
  const renderSubscriptionItem = ({
    item,
    index,
  }: {
    item: SubscriptionEntity;
    index: number;
  }) => {
    const nextPaymentDate = parseDate(item.nextPayment);
    const isCurrent = isValid(nextPaymentDate) && isThisMonth(nextPaymentDate);
    const daysRemaining = calculateDaysRemaining(item.nextPayment);

    let bgColor = theme.colors.primary;
    if (isCurrent) {
      bgColor =
        daysRemaining > 20
          ? "#4CAF50"
          : daysRemaining > 5
          ? "#FF9800"
          : "#F44336";
    }

    return (
      <Card
        style={{
          marginBottom: 15,
          backgroundColor: theme.colors.cardBackground,
        }}
      >
        <Card.Content>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: theme.colors.text,
            }}
          >
            {item.name}
          </Text>
          <Text style={{ color: theme.colors.subtitle }}>{`${
            language === "es" ? "Último pago:" : "Last Payment:"
          } ${item.lastPayment}`}</Text>
          <Text style={{ color: theme.colors.subtitle }}>{`${
            language === "es" ? "Próximo pago:" : "Next Payment:"
          } ${item.nextPayment}`}</Text>
          <Text style={{ color: theme.colors.subtitle }}>{`${
            language === "es" ? "Monto:" : "Amount:"
          } ${formatAmount(item.amount)}`}</Text>
        </Card.Content>
        <Card.Actions>
          <Button icon="delete" onPress={() => handleDeleteSubscription(index)}>
            {language === "es" ? "Eliminar" : "Delete"}
          </Button>
          <Button icon="pencil" onPress={() => handleModifySubscription(index)}>
            {language === "es" ? "Editar" : "Edit"}
          </Button>
          <Button
            icon="refresh"
            onPress={() => handleRefreshIndividualSubscription(index)}
          >
            {language === "es" ? "Actualizar" : "Refresh"}
          </Button>
        </Card.Actions>
        <View style={{ alignItems: "center", padding: 10 }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 50,
              backgroundColor: bgColor,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: isCurrent ? 0 : 2,
              borderColor: theme.colors.border,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 20 }}>
              {Math.abs(daysRemaining)}
            </Text>
            <Text style={{ color: "white", textAlign: "center" }}>
              {daysRemaining >= 0
                ? language === "es"
                  ? "Días restantes"
                  : "Days left"
                : language === "es"
                ? "Días vencidos"
                : "Days overdue"}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  // Original totals calculation
  const calculateTotals = () => {
    const dataSource = showFirebaseData ? firebaseSubscriptions : subscriptions;

    return dataSource.reduce(
      (acc, sub) => {
        const isCurrent = isThisMonth(parseDate(sub.nextPayment));
        if (isCurrent) acc.currentMonthTotal += sub.amount;
        acc.total += sub.amount;
        return acc;
      },
      { currentMonthTotal: 0, total: 0 }
    );
  };

  const { currentMonthTotal, total } = calculateTotals();

  // -------------------------
  // Nuevas funciones para Firebase (NO MODIFICAN LAS ORIGINALES)
  // -------------------------

  const handleLoadFromFirebase = async () => {
    await loadSubscriptionsFromFirebase();
    setShowFirebaseData(true);
    setSnackbarMessage(
      language === "es"
        ? "Datos cargados desde Firebase"
        : "Data loaded from Firebase"
    );
    setVisibleSnackbar(true);
  };

  const handleToggleDataSource = () => {
    setShowFirebaseData(!showFirebaseData);
    setSnackbarMessage(
      showFirebaseData
        ? language === "es"
          ? "Mostrando datos locales"
          : "Showing local data"
        : language === "es"
        ? "Mostrando datos de Firebase"
        : "Showing Firebase data"
    );
    setVisibleSnackbar(true);
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
        {/* ─────── Fila de botones superior ─────── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          {/* SOLO cuando se ven datos locales: Copiar a Firebase */}
          {!showFirebaseData && (
            <Button
              mode="outlined"
              onPress={handleCopyToFirebase}
              style={{ flex: 1, marginRight: 5 }}
              disabled={!isFirebaseLoaded}
              labelStyle={{ color: theme.colors.text }}
            >
              {language === "es" ? "Copiar a Firebase" : "Copy to Firebase"}
            </Button>
          )}

          {/* SOLO cuando se ven datos de Firebase: Copiar a Local */}
          {showFirebaseData && (
            <Button
              mode="outlined"
              onPress={handleCopyToLocal}
              style={{ flex: 1, marginRight: 5 }}
              labelStyle={{ color: theme.colors.text }}
            >
              {language === "es" ? "Copiar a Local" : "Copy to Local"}
            </Button>
          )}

          <Button
            mode="outlined"
            onPress={handleToggleDataSource}
            style={{ flex: 1, marginLeft: 5 }}
            labelStyle={{ color: theme.colors.text }}
          >
            {showFirebaseData
              ? language === "es"
                ? "Ver Locales"
                : "View Local"
              : language === "es"
              ? "Ver Firebase"
              : "View Firebase"}
          </Button>
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
          label={
            language === "es" ? "Buscar suscripciones" : "Search subscriptions"
          }
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
            ? language === "es"
              ? "Mostrar todas"
              : "Show all"
            : language === "es"
            ? "Filtrar mes actual"
            : "Filter current month"}
        </Button>

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              color: theme.colors.text,
            }}
          >
            {language === "es" ? "Origen:" : "Source:"}{" "}
            {showFirebaseData
              ? language === "es"
                ? "Firebase"
                : "Firebase"
              : language === "es"
              ? "Local"
              : "Local"}
          </Text>

          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              color: theme.colors.text,
            }}
          >
            {language === "es" ? "Total este mes:" : "Current month:"}{" "}
            {formatAmount(currentMonthTotal)}
          </Text>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              color: theme.colors.text,
            }}
          >
            {language === "es" ? "Total general:" : "Total amount:"}{" "}
            {formatAmount(total)}
          </Text>
        </View>

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
