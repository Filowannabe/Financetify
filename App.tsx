import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NavigationContainer } from "@react-navigation/native";
import { ThemeProvider } from "./src/themes/index";
import React from "react";
import { IncomesCalculator } from "./src/IncomesCalculator";
import { SettingsProvider } from "./src/settings";

export default function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <SafeAreaProvider>
          <PaperProvider>
            <NavigationContainer>
              <IncomesCalculator />
            </NavigationContainer>
          </PaperProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}
