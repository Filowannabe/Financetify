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

export const ListScreen = ({ navigation }: any) => {
  const { theme } = useAppTheme();
  const { language, region } = useSettings();
  const {
    subscriptions,
    forceReloadSubscriptions,
    deleteSubscription,
  } = useSubscriptions();
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<
    SubscriptionEntity[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCurrentMonth, setFilterCurrentMonth] = useState(false);
  const [visibleSnackbar, setVisibleSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const dateFormat = region === "CO" ? "dd/MM/yyyy" : "MM/dd/yyyy";
  const parseDate = (dateString: string) =>
    startOfDay(parse(dateString, dateFormat, new Date()));
  const formatDate = (date: Date) => format(date, dateFormat);

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
    const filtered = subscriptions.filter((sub) => {
      if (
        searchQuery &&
        !sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (filterCurrentMonth) return isThisMonth(parseDate(sub.nextPayment));
      return true;
    });
    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchQuery, filterCurrentMonth]);

  // Original refresh all
  const handleRefreshSubscriptions = async () => {
    await forceReloadSubscriptions(null);
    const updated = await Promise.all(
      subscriptions.map(async (sub) => {
        const nextPaymentDate = parseDate(sub.nextPayment);
        if (!isValid(nextPaymentDate)) return sub;

        const today = startOfDay(new Date());
        if (differenceInDays(nextPaymentDate, today) < 0) {
          const newLastPayment = nextPaymentDate;
          const newNextPayment = startOfDay(addMonths(newLastPayment, 1));
          return {
            ...sub,
            lastPayment: formatDate(newLastPayment),
            nextPayment: formatDate(newNextPayment),
          };
        }
        return sub;
      })
    );
    forceReloadSubscriptions(updated);
    await AsyncStorage.setItem("subscriptions", JSON.stringify(updated));
  };

  // Original delete function
  const handleDeleteSubscription = async (index: number) => {
    await deleteSubscription(index);
    setSnackbarMessage(language === "es" ? "Eliminada" : "Deleted");
    setVisibleSnackbar(true);
    await forceReloadSubscriptions(null);
  };

  // Original modify function
  const handleModifySubscription = (index: number) => {
    navigation.navigate("Form", {
      subscription: subscriptions[index],
      index,
    });
  };

  // Original refresh single
  const handleRefreshIndividualSubscription = async (index: number) => {
    const updated = await Promise.all(
      subscriptions.map(async (sub, i) => {
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
            nextPayment: formatDate(newNextPayment),
          };
        }
        return sub;
      })
    );
    forceReloadSubscriptions(updated);
    await AsyncStorage.setItem("subscriptions", JSON.stringify(updated));
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
    return subscriptions.reduce(
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={{
          flex: 1,
          padding: 20,
          backgroundColor: theme.colors.background,
        }}
      >
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
