// src/components/BasicLayoutPageWeb.jsx
import React, { useState, useContext } from "react";
import { Box } from "@mui/material";
import RenderBasicField from "./RenderBasicField";
import { AuthContext } from "../../context/AuthContext";


export default function BasicLayoutPage({ fields = [] }) {
  const { user } = useContext(AuthContext);

  // Initialize form state from fields
  const initialState = {};
  fields.forEach((f) => {
    initialState[f.field] = "";
  });

  const [form, setForm] = useState(initialState);

  const handleChange = (fieldKey, newVal) => {
    setForm((prev) => ({ ...prev, [fieldKey]: newVal }));
  };

  return (
    <Box
      sx={{
        flex: 1,
        width: "100%",
        padding: 2,
        bgcolor: "background.default",
      }}
    >
      {fields.map((field) => (
        <RenderBasicField
          key={field.field}
          field={field}
          user={user}
          value={form[field.field]}
          onChange={handleChange}
        />
      ))}

      {/* Debug display - optional */}
      {/* <pre style={{ marginTop: 24 }}>{JSON.stringify(form, null, 2)}</pre> */}
    </Box>
  );
}
