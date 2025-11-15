import React from "react";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { FieldMap } from "../../config/component-mapping/FieldMap";
import PlainTextInput from "../../components/SmartInputs/PlainTextInput";

export default function RenderBasicField({ field, value, onChange, user }) {
  const theme = useTheme();

  const inputType = field.input || field.type || "text";
  const FieldComponent = FieldMap[inputType] || PlainTextInput;

  return (
    <View style={{ marginBottom: 16 }}>
      <FieldComponent
        label={field.label || field.field}
        value={value}
        placeholder={field.display?.placeholder}
        multiline={inputType === "textarea"}
        keyboardType={inputType === "number" ? "numeric" : "default"}
        options={field.input === "select" ? field.inputConfig?.options || [] : []}
        onChangeText={(val) => onChange(field.field, val)}
        mode="edit"

        // 🔥 NEW: pass user down
        user={user}
      />
    </View>
  );
}
