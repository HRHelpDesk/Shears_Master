import React from "react";
import { TextField, MenuItem } from "@mui/material";

export default function DynamicField({ field, value, onChange }) {
  const commonProps = {
    fullWidth: true, // Force input to span full available width
    sx: { width: "100%" }, // Ensures full width inside grid box
    label: field.label,
    margin: "normal",
    value,
    onChange: (e) => onChange(e.target.value),
  };

  if (field.input === "select") {
    return (
      <TextField select {...commonProps}>
        {field.enum?.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return <TextField {...commonProps} type={field.input || "text"} />;
}
