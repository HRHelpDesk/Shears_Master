// src/components/Dashboard/SmartWelcomeMessage.jsx

import React, { useContext, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { AuthContext } from "../../context/AuthContext";

export default function SmartWelcomeMessage() {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const formattedDate = useMemo(() => {
    const today = new Date();

    const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
    const monthName = today.toLocaleDateString("en-US", { month: "long" });
    const day = today.getDate();
    const year = today.getFullYear();

    const getOrdinal = (n) => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${dayName} ${monthName} ${day}${getOrdinal(day)}, ${year}`;
  }, []);

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text
        variant="headlineMedium"
        style={[styles.welcomeText, { color: theme.colors.primary }]}
      >
        Welcome {user.firstName}!
      </Text>

      <Text
        variant="bodyLarge"
        style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}
      >
        {formattedDate}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 2,
    paddingTop: 12,
    paddingBottom: 8,
  },
  welcomeText: {
    fontWeight: "700",
  },
  dateText: {
    marginTop: 4,
    opacity: 0.9,
  },
});
