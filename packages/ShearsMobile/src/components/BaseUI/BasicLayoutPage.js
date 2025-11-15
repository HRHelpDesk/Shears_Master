import React, { useState, useEffect, useContext } from "react";
import { ScrollView, View } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import RenderBasicField from "./RenderBasicField";
import { AuthContext } from "../../context/AuthContext";

export const BasicLayoutPage = ({ fields = [] }) => {
  const theme = useTheme();
const {token, user} = useContext(AuthContext)
  // Initialize local state from fields
  const initialState = {};
  fields.forEach((f) => {
    initialState[f.field] = ""; // later can add default values
  });

  const [form, setForm] = useState(initialState);

  const handleChange = (fieldKey, newVal) => {
    setForm((prev) => ({ ...prev, [fieldKey]: newVal }));
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: theme.colors.background,
      }}
    >
      {/* <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          marginBottom: 16,
          color: theme.colors.onBackground,
        }}
      >
        Basic Layout Page
      </Text> */}

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
    </ScrollView>
  );
};

export default BasicLayoutPage;
