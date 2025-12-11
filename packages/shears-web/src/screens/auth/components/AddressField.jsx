import React from "react";
import { Box, TextField, Typography, Divider } from "@mui/material";

export default function AddressField({ field, value, onChange }) {
  const fields = field.objectConfig || [];

  const update = (childField, val) => {
    onChange({ ...value, [childField]: val });
  };

  // Extract known fields (if present)
  const street1 = fields.find((f) => f.field === "street1");
  const street2 = fields.find((f) => f.field === "street2");
  const city = fields.find((f) => f.field === "city");
  const state = fields.find((f) => f.field === "state");
  const postalCode = fields.find((f) => f.field === "postalCode");

  // Any additional fields will be rendered full width after core layout
  const extraFields = fields.filter(
    (f) =>
      !["street1", "street2", "city", "state", "postalCode"].includes(f.field)
  );

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {field.label}
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Street 1 */}
      {street1 && (
        <TextField
          fullWidth
          label={street1.label || "Street 1"}
          margin="normal"
          value={value.street1 || ""}
          onChange={(e) => update("street1", e.target.value)}
        />
      )}

      {/* Street 2 */}
      {street2 && (
        <TextField
          fullWidth
          label={street2.label || "Street 2"}
          margin="normal"
          value={value.street2 || ""}
          onChange={(e) => update("street2", e.target.value)}
        />
      )}

      {/* City / State / Postal Code */}
      {(city || state || postalCode) && (
        <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
          {city && (
            <TextField
              label={city.label || "City"}
              fullWidth
              value={value.city || ""}
              onChange={(e) => update("city", e.target.value)}
            />
          )}

          {state && (
            <TextField
              label={state.label || "State"}
              sx={{ width: "30%" }}
              value={value.state || ""}
              onChange={(e) => update("state", e.target.value)}
            />
          )}

          {postalCode && (
            <TextField
              label={postalCode.label || "Postal Code"}
              sx={{ width: "30%" }}
              value={value.postalCode || ""}
              onChange={(e) => update("postalCode", e.target.value)}
            />
          )}
        </Box>
      )}

      {/* Any additional unknown address fields */}
      {extraFields.map((f) => (
        <TextField
          key={f.field}
          fullWidth
          label={f.label || f.field}
          margin="normal"
          value={value[f.field] || ""}
          onChange={(e) => update(f.field, e.target.value)}
        />
      ))}
    </Box>
  );
}
