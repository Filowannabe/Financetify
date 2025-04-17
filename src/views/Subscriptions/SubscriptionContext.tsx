import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parse,
  startOfDay,
  addMonths,
  differenceInDays,
  isThisMonth,
  format,
} from "date-fns";
import { SubscriptionEntity } from "../../types/SubscriptionTypes";

// -------------------------
// Type Definitions
// -------------------------
type SubscriptionContextType = {
  subscriptions: SubscriptionEntity[];
  addSubscription: (sub: SubscriptionEntity) => Promise<void>;
  updateSubscription: (index: number, sub: SubscriptionEntity) => Promise<void>;
  deleteSubscription: (index: number) => Promise<void>;
  refreshAllSubscriptions: () => Promise<void>;
  refreshSingleSubscription: (index: number) => Promise<void>;
  forceReloadSubscriptions: () => Promise<void>; // <-- Add this line
};

// -------------------------
// Context Setup
// -------------------------
const SubscriptionContext = createContext<SubscriptionContextType>(
  {} as SubscriptionContextType
);

// -------------------------
// Provider Component
// -------------------------
export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [needsRefresh, setNeedsRefresh] = useState(false); // Add refresh trigger
  const [subscriptions, setSubscriptions] = useState<SubscriptionEntity[]>([]);
  const [region, setRegion] = useState("CO"); // Default region

  // Load initial subscriptions & region
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedSubs, storedRegion] = await Promise.all([
          AsyncStorage.getItem("subscriptions"),
          AsyncStorage.getItem("region"),
        ]);

        if (storedSubs) setSubscriptions(JSON.parse(storedSubs));
        if (storedRegion) setRegion(storedRegion);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  // Save to AsyncStorage and update state
  const saveSubscriptions = async (subs: SubscriptionEntity[]) => {
    await AsyncStorage.setItem("subscriptions", JSON.stringify(subs));
    setSubscriptions(subs);
    setNeedsRefresh(!needsRefresh); // Toggle to trigger updates
  };

  const forceReloadSubscriptions = async () => {
    try {
      const storedSubs = await AsyncStorage.getItem("subscriptions");
      if (storedSubs) setSubscriptions(JSON.parse(storedSubs));
    } catch (error) {
      console.error("Force reload failed:", error);
    }
  };

  // Date format depending on region
  const getDateFormat = () => (region === "CO" ? "dd/MM/yyyy" : "MM/dd/yyyy");

  // Refresh a single subscription's dates (if outdated)
  const refreshSubscription = async (
    sub: SubscriptionEntity
  ): Promise<SubscriptionEntity> => {
    const dateFormat = getDateFormat();
    const nextPaymentDate = startOfDay(
      parse(sub.nextPayment, dateFormat, new Date())
    );
    const today = startOfDay(new Date());

    if (!isThisMonth(nextPaymentDate)) return sub;

    if (differenceInDays(nextPaymentDate, today) < 0) {
      const newLastPayment = nextPaymentDate;
      const newNextPayment = startOfDay(addMonths(newLastPayment, 1));

      return {
        ...sub,
        lastPayment: format(newLastPayment, dateFormat),
        nextPayment: format(newNextPayment, dateFormat),
      };
    }

    return sub;
  };

  // Context Values
  const contextValue: SubscriptionContextType = {
    subscriptions,
    forceReloadSubscriptions,
    addSubscription: async (sub) => {
      const updated = [...subscriptions, sub];
      await saveSubscriptions(updated);
    },

    updateSubscription: async (index, sub) => {
      if (index < 0 || index >= subscriptions.length) return;

      const updated = subscriptions.map((s, i) => (i === index ? sub : s));
      await saveSubscriptions(updated);
    },

    deleteSubscription: async (index) => {
      const updated = subscriptions.filter((_, i) => i !== index);
      await saveSubscriptions(updated);
    },

    refreshAllSubscriptions: async () => {
      const updated = await Promise.all(subscriptions.map(refreshSubscription));
      await saveSubscriptions(updated);
    },

    refreshSingleSubscription: async (index) => {
      if (index < 0 || index >= subscriptions.length) return;

      const updated = [...subscriptions];
      updated[index] = await refreshSubscription(updated[index]);
      await saveSubscriptions(updated);
    },
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// -------------------------
// Hook to Consume Context
// -------------------------
export const useSubscriptions = () => useContext(SubscriptionContext);
