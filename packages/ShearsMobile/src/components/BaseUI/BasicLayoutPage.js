import React, { useState, useEffect, useContext, useCallback } from "react";
import { ScrollView, View, RefreshControl } from "react-native"; // ← add RefreshControl
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { Text, Button, useTheme } from "react-native-paper";
import RenderBasicField from "./RenderBasicField";
import { AuthContext } from "../../context/AuthContext";
import { useTriggerRefresh } from '../../context/RefreshContext';

export const BasicLayoutPage = ({ fields = [] }) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const trigger = useTriggerRefresh();
  const { token, user } = useContext(AuthContext);

  // Initialize local state from fields
  const initialState = {};
  fields.forEach((f) => {
    initialState[f.field] = ""; // later can add default values
  });

  const [form, setForm] = useState(initialState);
  const [refreshing, setRefreshing] = useState(false); // ← NEW state for pull-to-refresh

  const handleChange = (fieldKey, newVal) => {
    setForm((prev) => ({ ...prev, [fieldKey]: newVal }));
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Trigger the same refresh that happens on focus
      trigger('dashboard-data');
      // Optional: you can trigger more specific keys if needed
      // trigger('weekly-snapshot');
      // trigger('pending-requests');
      // trigger('lives-schedule');

      // Optional: If BasicLayoutPage itself fetches something,
      // do it here too (most likely not needed in your case)
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      // Give a little delay so the spinner looks natural
      // (widgets fetch async anyway)
      setTimeout(() => {
        setRefreshing(false);
      }, 800); // ← adjust as you like (400–1500 ms feels good)
    }
  }, [trigger]);

  // Still keep auto-refresh on focus
  useFocusEffect(
    useCallback(() => {
      trigger('dashboard-data');
      // trigger('weekly-snapshot');
      // trigger('pending-requests');
      // trigger('lives-schedule');
    }, [trigger])
  );

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}           // Android spinner color
          tintColor={theme.colors.primary}          // iOS spinner color
          title="Refreshing dashboard..."           // Android title (optional)
          titleColor={theme.colors.onSurfaceVariant}
        />
      }
    >
      <View style={{ padding: 16 }}>
        {/* Your content goes here */}

        {fields.map((field) => (
          <RenderBasicField
            user={user}
            key={field.field}
            field={field}
            value={form[field.field]}
            onChange={handleChange}
          />
        ))}

        {/* TEMP: Dump form for debugging */}
        {/* <View style={{ marginTop: 20 }}>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
            {JSON.stringify(form, null, 2)}
          </Text>
        </View> */}
      </View>
    </ScrollView>
  );
};

export default BasicLayoutPage;