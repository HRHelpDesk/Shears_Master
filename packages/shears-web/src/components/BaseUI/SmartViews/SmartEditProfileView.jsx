// src/components/SmartViews/SmartEditProfileView.jsx

import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Box,
  Typography,
  Divider,
  Button,
  Paper,
  Container,
  CircularProgress,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

import PlainTextInput from "../SmartInputs/PlainTextInput";
import { AuthContext } from "../../../context/AuthContext";
import { FieldMap } from "../../../config/component-mapping/FieldMap";
import { updateRecord } from "shears-shared/src/Services/Authentication";

/* ============================================================
   Utility
============================================================ */
const getValue = (source, path) => {
  if (!source || !path) return "";
  const normalized = path.replace(/\[(\d+)\]/g, ".$1");
  return normalized.split(".").reduce((acc, key) => acc?.[key], source) ?? "";
};

/* ============================================================
   Render Nested Fields
============================================================ */
const RenderNestedFields = ({
  nestedFields,
  item,
  handleChange,
  parentPath,
  columns = 3,
  user,
}) => {
  const groupedByRow = nestedFields.reduce((acc, f) => {
    const row = f.layout?.row || 1;
    if (!acc[row]) acc[row] = [];
    acc[row].push(f);
    return acc;
  }, {});

  return (
    <>
      {Object.keys(groupedByRow).map((rowKey) => {
        const rowFields = groupedByRow[rowKey];
        const totalSpan = rowFields.reduce(
          (s, f) => s + (f.layout?.span || 1),
          0
        );

        return (
          <Box
            key={`row-${rowKey}`}
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mb: 2,
            }}
          >
            {rowFields.map((nestedField) => {
              const span = nestedField.layout?.span || 1;
              const width = `calc(${(span / totalSpan) * 100}% - 16px)`;

              return (
                <Box
                  key={nestedField.field}
                  sx={{ flex: `0 0 ${width}`, minWidth: 0 }}
                >
                  <RenderField
                    fieldDef={nestedField}
                    item={item}
                    handleChange={handleChange}
                    parentPath={parentPath}
                    user={user}
                  />
                </Box>
              );
            })}
          </Box>
        );
      })}
    </>
  );
};

/* ============================================================
   RenderField
============================================================ */
const RenderField = ({
  fieldDef,
  item,
  handleChange,
  parentPath = "",
  user,
}) => {
  const mode = "edit";
  const inputType = fieldDef.input || fieldDef.type || "text";
  const nestedFields =
    fieldDef.objectConfig || fieldDef.arrayConfig?.object || [];
  const FieldComponent = FieldMap[inputType] || PlainTextInput;

  const actualField = fieldDef.override?.field || fieldDef.field;
  const fieldPath = parentPath
    ? `${parentPath}.${actualField}`
    : actualField;

  const value = getValue(item, fieldPath);

  /* Auto-init object/array */
  useEffect(() => {
    if (fieldDef.arrayConfig?.object && !Array.isArray(value)) {
      handleChange(fieldPath, []);
    } else if (
      fieldDef.objectConfig &&
      (value === undefined || typeof value !== "object")
    ) {
      handleChange(fieldPath, {});
    }
  }, []);

  /* IMAGE FIELD */
  if (inputType === "image") {
    return (
      <Box sx={{ mb: 2 }}>
        <FieldComponent
          label={fieldDef.label || fieldDef.field}
          mode={mode}
          value={value}
          user={user}
          onChangeText={(newVal) => handleChange(fieldPath, newVal)}
          inputConfig={fieldDef.inputConfig || {}}
          required={fieldDef.required || fieldDef.override?.required}
        />
      </Box>
    );
  }

  /* ARRAY FIELD */
  if (Array.isArray(value) && inputType !== "dateRange") {
    const handleAddArrayItem = () => {
      const newItem =
        fieldDef.input === "linkSelect"
          ? { _id: "", name: "" }
          : Object.fromEntries(
              (nestedFields || []).map((nf) => [nf.field, ""])
            );
      handleChange(fieldPath, [...value, newItem]);
    };

    const handleDeleteArrayItem = (idx) => {
      const updated = [...value];
      updated.splice(idx, 1);
      handleChange(fieldPath, updated);
    };

    // Helper to singularize field names
    const singularize = (word) => {
      if (!word) return word;
      if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
      if (word.endsWith('s')) return word.slice(0, -1);
      return word;
    };

    return (
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="h6" color="primary">
            {fieldDef.label || fieldDef.field}
            {fieldDef.required && (
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                *
              </Typography>
            )}
          </Typography>

          {(mode === "edit" || mode === "add") && (
            <Button
              variant="text"
              startIcon={<AddIcon />}
              onClick={handleAddArrayItem}
              size="small"
            >
              Add
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {value.length === 0 ? (
          <Box
            sx={{
              py: 3,
              textAlign: "center",
            }}
          >
            {mode === "edit" ? (
              <Typography
                onClick={handleAddArrayItem}
                sx={{
                  color: "text.secondary",
                  fontStyle: "italic",
                  cursor: "pointer",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Tap to add first entry
              </Typography>
            ) : (
              <Typography sx={{ color: "text.secondary", fontStyle: "italic" }}>
                No entries
              </Typography>
            )}
          </Box>
        ) : (
          value.map((entry, idx) => (
            <Paper
              key={`${fieldPath}[${idx}]`}
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(74,144,226,0.03)",
                border: 1,
                borderColor: (theme) =>
                  theme.palette.mode === "dark" ? "#4B5563" : "#F3F4F6",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {singularize(fieldDef.name || fieldDef.field)
                    .charAt(0)
                    .toUpperCase() +
                    singularize(fieldDef.name || fieldDef.field).slice(1)}{" "}
                  #{idx + 1}
                </Typography>

                {(mode === "edit" || mode === "add") && (
                  <Button
                    variant="text"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteArrayItem(idx)}
                    color="error"
                    size="small"
                  >
                    Remove
                  </Button>
                )}
              </Box>

              <Box>
                {fieldDef.input === "linkSelect" ? (
                  <FieldMap.linkSelect
                    label={fieldDef.label || fieldDef.field}
                    value={entry}
                    mode={mode}
                    user={user}
                    recordTypeName={
                      fieldDef.inputConfig?.recordType ||
                      fieldDef.recordTypeName ||
                      "contacts"
                    }
                    onChangeText={(newVal) => {
                      const updated = [...value];
                      updated[idx] = newVal;
                      handleChange(fieldPath, updated);
                    }}
                  />
                ) : (
                  <RenderNestedFields
                    nestedFields={nestedFields}
                    item={item}
                    handleChange={handleChange}
                    parentPath={`${fieldPath}[${idx}]`}
                    columns={fieldDef.columns || 3}
                    user={user}
                  />
                )}
              </Box>
            </Paper>
          ))
        )}
      </Box>
    );
  }

  /* LINK SELECT (single) */
  if (fieldDef.input === "linkSelect" && !Array.isArray(value)) {
    return (
      <Box sx={{ mb: 2 }}>
        <FieldMap.linkSelect
          label={fieldDef.label || fieldDef.field}
          value={value}
          mode={mode}
          user={user}
          recordTypeName={
            fieldDef.inputConfig?.recordType ||
            fieldDef.recordTypeName ||
            "contacts"
          }
          onChangeText={(newVal) => handleChange(fieldPath, newVal)}
        />
      </Box>
    );
  }

  /* OBJECT FIELD */
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    fieldDef.objectConfig
  ) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{ color: "text.secondary", mb: 1 }}
        >
          {fieldDef.label || fieldDef.field}
          {fieldDef.required && (
            <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.02)"
                : "rgba(74,144,226,0.03)",
            border: 1,
            borderColor: (theme) =>
              theme.palette.mode === "dark" ? "#4B5563" : "#F3F4F6",
          }}
        >
          <RenderNestedFields
            nestedFields={fieldDef.objectConfig}
            item={item}
            handleChange={handleChange}
            parentPath={fieldPath}
            columns={fieldDef.columns || 3}
            user={user}
          />
        </Box>
      </Box>
    );
  }

  /* BASIC FIELD */
  return (
    <Box sx={{ mb: 2 }}>
      <FieldComponent
        label={fieldDef.label || fieldDef.field}
        value={value}
        mode={mode}
        item={item}
        user={user}
        onChangeText={(newVal) => handleChange(fieldPath, newVal)}
        multiline={fieldDef.input === "textarea"}
        type={fieldDef.input === "number" ? "number" : "text"}
        defaultValue={fieldDef.inputConfig?.defaultValue || ""}
        options={
          fieldDef.input === "select"
            ? fieldDef.inputConfig?.options || []
            : []
        }
        required={fieldDef.required || fieldDef.override?.required}
        inputConfig={fieldDef.inputConfig || {}}
      />
    </Box>
  );
};

/* ============================================================
   MAIN COMPONENT
============================================================ */
export const SmartEditProfileView = ({ fields = [] }) => {
  const { token, user, setUser, refreshUser } = useContext(AuthContext);

  const [localItem, setLocalItem] = useState({ ...user });
  const [saving, setSaving] = useState(false);
  const originalItemRef = useRef(JSON.parse(JSON.stringify(user)));

  const handleChange = (path, value) => {
    setLocalItem((prev) => {
      const updated = { ...prev };
      const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
      let target = updated;
      while (keys.length > 1) {
        const key = keys.shift();
        if (!target[key]) target[key] = {};
        target = target[key];
      }
      target[keys[0]] = value;
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      localItem.__isUser = true;
      await updateRecord(user.userId, localItem, token);
      setUser((prev) => ({ ...prev, ...localItem }));
      originalItemRef.current = JSON.parse(JSON.stringify(localItem));
      
      // Web alert alternative
      if (window.alert) {
        window.alert("Profile updated successfully");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      if (window.alert) {
        window.alert("Failed to save profile");
      }
    } finally {
      await refreshUser();
      setSaving(false);
    }
  };

  // Replace the return statement in SmartEditProfileView with this:

return (
  <Box
    sx={{
      minHeight: "100vh",
      bgcolor: "background.default",
      display: "flex",
      flexDirection: "column",
      paddingBottom:5
    }}
  >
    {/* Scrollable content */}
    <Box sx={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <Container maxWidth="lg" sx={{ py: 4, pb: 10 /* ← extra bottom padding */ }}>
        <Box sx={{ mb: 3 }}>
          {fields.map((field, index) => (
            <React.Fragment key={`${field.field}-${index}`}>
              <RenderField
                fieldDef={field}
                item={localItem}
                handleChange={handleChange}
                user={user}
              />
              {index < fields.length - 1 && (
                <Divider sx={{ my: 2, opacity: 0.3 }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Container>
    </Box>

    {/* Sticky / fixed save bar at bottom */}
    <Box
      sx={{
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        p: 2,
        position: "sticky",
        bottom: 0,
        zIndex: 10,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <Container maxWidth="lg">
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          fullWidth
          size="large"
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </Container>
    </Box>
  </Box>
);
};

export default SmartEditProfileView;