// src/components/RenderBasicFieldWeb.jsx
import React from "react";
import { Box } from "@mui/material";
import { FieldMap } from "../../config/component-mapping/FieldMap";
import PlainTextInput from "./SmartInputs/PlainTextInput";

export default function RenderBasicField({ field, value, onChange, user }) {
  const inputType = field.input || field.type || "text";
  const FieldComponent = FieldMap[inputType] || PlainTextInput;

  const selectOptions =
    field.input === "select"
      ? field.inputConfig?.options || []
      : undefined;

  return (
    <Box sx={{ mb: 3 }}>
      <FieldComponent
        label={field.label || field.field}
        value={value}
        placeholder={field.display?.placeholder}
        multiline={inputType === "textarea"}
        type={inputType === "number" ? "number" : "text"}
        options={selectOptions}
        onChange={(e) => {
          const nv = e?.target?.value ?? e;
          onChange(field.field, nv);
        }}
        mode="edit"
        user={user}
        inputConfig={field.inputConfig}
      />
    </Box>
  );
}
