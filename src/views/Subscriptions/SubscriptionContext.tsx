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
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

/* ──────────────────────────────────────────────────────────
   Constantes
─────────────────────────────────────────────────────────── */
const FIREBASE_COLLECTION = "subscriptions";
const FIREBASE_DOCUMENT_ID = "user_subscriptions_data";

/* ──────────────────────────────────────────────────────────
   Tipado del contexto
─────────────────────────────────────────────────────────── */
export interface SubscriptionContextType {
  /* Local (AsyncStorage) */
  subscriptions: SubscriptionEntity[];
  addSubscription(sub: SubscriptionEntity): Promise<void>;
  updateSubscription(index: number, sub: SubscriptionEntity): Promise<void>;
  deleteSubscription(index: number): Promise<void>;
  refreshAllSubscriptions(): Promise<void>;
  refreshSingleSubscription(index: number): Promise<void>;

  /* Utilidades */
  forceReloadSubscriptions(subs: SubscriptionEntity[] | null): Promise<void>;

  /* Firebase */
  firebaseSubscriptions: SubscriptionEntity[];
  isFirebaseLoaded: boolean;
  loadSubscriptionsFromFirebase(): Promise<SubscriptionEntity[]>;
  saveSubscriptionsToFirebase(subs: SubscriptionEntity[]): Promise<void>;
  deleteSubscriptionFirebase(index: number): Promise<void>;
  updateSubscriptionFirebase(
    index: number,
    sub: SubscriptionEntity
  ): Promise<void>;
  refreshSingleFirebaseSubscription(index: number): Promise<void>;
  refreshAllFirebaseSubscriptions(): Promise<void>;
}

/* ──────────────────────────────────────────────────────────
   Creación del contexto
─────────────────────────────────────────────────────────── */
const SubscriptionContext = createContext<SubscriptionContextType>(
  {} as SubscriptionContextType
);

/* ──────────────────────────────────────────────────────────
   Provider
─────────────────────────────────────────────────────────── */
export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  /* ---------- estado local ---------- */
  const [subscriptions, setSubscriptions] = useState<SubscriptionEntity[]>([]);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [region, setRegion] = useState("CO");

  /* ---------- estado Firebase ---------- */
  const [firebaseSubscriptions, setFirebaseSubscriptions] = useState<
    SubscriptionEntity[]
  >([]);
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);

  /* ── 1. Cargar datos locales al montar ── */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedSubs, storedRegion] = await Promise.all([
          AsyncStorage.getItem("subscriptions"),
          AsyncStorage.getItem("region"),
        ]);
        if (storedSubs) setSubscriptions(JSON.parse(storedSubs));
        if (storedRegion) setRegion(storedRegion);
      } catch (err) {
        console.error("Error loading local data:", err);
      }
    };
    loadData();
  }, []);

  /* ── 2. Helper para guardar en AsyncStorage ── */
  const saveSubscriptions = async (subs: SubscriptionEntity[]) => {
    await AsyncStorage.setItem("subscriptions", JSON.stringify(subs));
    setSubscriptions(subs);
    setNeedsRefresh((prev) => !prev); // trigger renders
  };

  /* ──────────────────────────────────────────────────────────
     Funciones Firebase
  ─────────────────────────────────────────────────────────── */
  const loadSubscriptionsFromFirebase = async (): Promise<
    SubscriptionEntity[]
  > => {
    try {
      const ref = doc(db, FIREBASE_COLLECTION, FIREBASE_DOCUMENT_ID);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data?.subscriptions) {
          const parsed = JSON.parse(data.subscriptions) as SubscriptionEntity[];
          setFirebaseSubscriptions(parsed);
          setIsFirebaseLoaded(true);
          return parsed;
        }
      }
      return [];
    } catch (err) {
      console.error("Error loading from Firebase:", err);
      setIsFirebaseLoaded(false);
      return [];
    }
  };

  const saveSubscriptionsToFirebase = async (subs: SubscriptionEntity[]) => {
    try {
      const ref = doc(db, FIREBASE_COLLECTION, FIREBASE_DOCUMENT_ID);
      await setDoc(ref, {
        subscriptions: JSON.stringify(subs),
        lastUpdated: new Date(),
      });
      setFirebaseSubscriptions(subs);
    } catch (err) {
      console.error("Error saving to Firebase:", err);
    }
  };

  /*  Se ejecuta una sola vez para crear el doc si no existe y luego cargar */
  useEffect(() => {
    const init = async () => {
      try {
        const ref = doc(db, FIREBASE_COLLECTION, FIREBASE_DOCUMENT_ID);
        const snap = await getDoc(ref);
        if (!snap.exists()) await saveSubscriptionsToFirebase(subscriptions);
        await loadSubscriptionsFromFirebase();
      } catch (err) {
        console.error("Error initializing Firebase:", err);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- CRUD Firebase ---------- */
  const deleteSubscriptionFirebase = async (index: number) => {
    const updated = firebaseSubscriptions.filter((_, i) => i !== index);
    await saveSubscriptionsToFirebase(updated);
  };

  const updateSubscriptionFirebase = async (
    index: number,
    sub: SubscriptionEntity
  ) => {
    if (index < 0 || index >= firebaseSubscriptions.length) return;
    const updated = firebaseSubscriptions.map((s, i) =>
      i === index ? sub : s
    );
    await saveSubscriptionsToFirebase(updated);
  };

  const refreshSingleFirebaseSubscription = async (index: number) => {
    if (index < 0 || index >= firebaseSubscriptions.length) return;
    const updatedSub = await refreshSubscription(firebaseSubscriptions[index]);
    const updated = firebaseSubscriptions.map((s, i) =>
      i === index ? updatedSub : s
    );
    await saveSubscriptionsToFirebase(updated);
  };

  const refreshAllFirebaseSubscriptions = async () => {
    const updated = await Promise.all(
      firebaseSubscriptions.map(refreshSubscription)
    );
    await saveSubscriptionsToFirebase(updated);
  };

  /* ──────────────────────────────────────────────────────────
     Funciones originales (local)
  ─────────────────────────────────────────────────────────── */
  const forceReloadSubscriptions = async (
    subs: SubscriptionEntity[] | null
  ) => {
    try {
      if (subs) {
        setSubscriptions(subs);
      } else {
        const stored = await AsyncStorage.getItem("subscriptions");
        if (stored) setSubscriptions(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Force reload failed:", err);
    }
  };

  const getDateFormat = () => (region === "CO" ? "dd/MM/yyyy" : "MM/dd/yyyy");

  const refreshSubscription = async (
    sub: SubscriptionEntity
  ): Promise<SubscriptionEntity> => {
    const fmt = getDateFormat();
    const next = startOfDay(parse(sub.nextPayment, fmt, new Date()));
    const today = startOfDay(new Date());
    if (!isThisMonth(next) || differenceInDays(next, today) >= 0) return sub;

    const newLast = next;
    const newNext = startOfDay(addMonths(newLast, 1));
    return {
      ...sub,
      lastPayment: format(newLast, fmt),
      nextPayment: format(newNext, fmt),
    };
  };

  /* ──────────────────────────────────────────────────────────
     contextValue
  ─────────────────────────────────────────────────────────── */
  const contextValue: SubscriptionContextType = {
    /* Local */
    subscriptions,
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

    /* Util */
    forceReloadSubscriptions,

    /* Firebase */
    firebaseSubscriptions,
    isFirebaseLoaded,
    loadSubscriptionsFromFirebase,
    saveSubscriptionsToFirebase,
    deleteSubscriptionFirebase,
    updateSubscriptionFirebase,
    refreshSingleFirebaseSubscription,
    refreshAllFirebaseSubscriptions,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

/* ──────────────────────────────────────────────────────────
   Hook
─────────────────────────────────────────────────────────── */
export const useSubscriptions = () => useContext(SubscriptionContext);
