// src/components/ReadOnly/ReadOnlyDetail.jsx
import React, { useMemo } from "react";
import {
  Modal,
  Box,
  Typography,
  Divider,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";

import SubtitleText from "../../UI/SubtitleText";
import { FieldMap } from "../../../config/component-mapping/FieldMap";
import PlainTextInput from "../SmartInputs/PlainTextInput";
import { singularize } from "shears-shared/src/utils/stringHelpers";

/* ============================================================
   Utility — Safe deep getter (FIXED)
============================================================ */
const getValue = (source, path) => {
  if (!source || !path) return "";
  
  // ✅ Check fieldsData first, just like the title calculation does
  const base = source.fieldsData ?? source;
  
  const normalized = path.replace(/\[(\d+)\]/g, ".$1");
  return normalized.split(".").reduce((acc, key) => acc?.[key], base) ?? "";
};

/* ============================================================
   🧩 Render Nested Groups (objectConfig or array item)
============================================================ */
const RenderNestedFields = ({
  nestedFields = [],
  item,
  theme,
  parentPath,
}) => {
  const grouped = nestedFields.reduce((acc, f) => {
    const row = f.layout?.row || 1;
    if (!acc[row]) acc[row] = [];
    acc[row].push(f);
    return acc;
  }, {});

  return (
    <>
      {Object.keys(grouped).map((rowKey) => {
        const rowFields = grouped[rowKey];
        const totalSpan = rowFields.reduce(
          (total, f) => total + (f.layout?.span || 1),
          0
        );

        return (
          <Box
            key={rowKey}
            sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}
          >
            {rowFields.map((nf) => {
              const span = nf.layout?.span || 1;
              const width = `calc(${(span / totalSpan) * 100}% - 8px)`;

              return (
                <Box key={nf.field} sx={{ flex: `0 0 ${width}`, minWidth: 200 }}>
                  {RenderReadOnlyField({
                    fieldDef: nf,
                    item,
                    theme,
                    parentPath,
                  })}
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
   🧩 RenderField — READ ONLY (matches ListItemDetail structure)
============================================================ */
function RenderReadOnlyField({ fieldDef, item, theme, parentPath = "" }) {
  const inputType = fieldDef.input || fieldDef.type || "text";
  const nestedFields =
    fieldDef.objectConfig || fieldDef.arrayConfig?.object || [];
    console.log('Rendering field:', fieldDef.field, 'of type:', inputType);

  const FieldComponent = FieldMap[inputType] || PlainTextInput;

  const fieldPath = parentPath
    ? `${parentPath}.${fieldDef.field}`
    : fieldDef.field;

  const value = getValue(item, fieldPath);

  /* ------------------------------------------------------------
     ⭐ IMAGE FIELD
  ------------------------------------------------------------ */
  if (inputType === "image") {
    return (
      <Box sx={{ mb: 2 }}>
        <FieldComponent
          label={fieldDef.label}
          value={value}
          mode="read"
          item={item}
          inputConfig={fieldDef.inputConfig}
        />
      </Box>
    );
  }

  /* ------------------------------------------------------------
     ⭐ ARRAY FIELD
  ------------------------------------------------------------ */
  if (Array.isArray(value)) {
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography sx={{ color: theme.palette.primary.main }} variant="subtitle1">
            {fieldDef.label}
          </Typography>
          {/* NO ADD BUTTON IN READ ONLY */}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {value.length === 0 ? (
          <Typography
            sx={{ fontStyle: "italic", color: "text.secondary" }}
          >
            No entries
          </Typography>
        ) : (
          value.map((entry, idx) => (
            <Box
              key={`${fieldPath}[${idx}]`}
              sx={{
                mb: 1.5,
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(74,144,226,0.04)",
              }}
            >
              {/* HEADER */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {singularize(fieldDef.label)} #{idx + 1}
                </Typography>
                {/* NO ACTIONS IN READ ONLY */}
              </Box>

              {/* FIELDS */}
              {fieldDef.input === "linkSelect" ? (
                <FieldMap.linkSelect
                  label={fieldDef.label}
                  value={entry}
                  mode="read"
                  item={item}
                  recordTypeName={fieldDef.inputConfig?.recordType}
                />
              ) : (
                <RenderNestedFields
                  nestedFields={nestedFields}
                  item={item}
                  theme={theme}
                  parentPath={`${fieldPath}[${idx}]`}
                />
              )}
            </Box>
          ))
        )}
      </Box>
    );
  }

  /* ------------------------------------------------------------
     ⭐ LINK SELECT
  ------------------------------------------------------------ */
  if (inputType === "linkSelect") {
    return (
      <Box sx={{ mb: 2 }}>
        <FieldComponent
          label={fieldDef.label}
          value={value}
          mode="read"
          item={item}
          recordTypeName={fieldDef.inputConfig?.recordType}
        />
      </Box>
    );
  }

  /* ------------------------------------------------------------
     ⭐ OBJECT FIELD
  ------------------------------------------------------------ */
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    fieldDef.objectConfig
  ) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ mb: 1 }} variant="body2" color="text.secondary">
          {fieldDef.label}
        </Typography>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.03)"
                : "rgba(74,144,226,0.04)",
          }}
        >
          <RenderNestedFields
            nestedFields={fieldDef.objectConfig}
            item={item}
            parentPath={fieldPath}
            theme={theme}
          />
        </Box>
      </Box>
    );
  }

  /* ------------------------------------------------------------
     ⭐ PAYMENT BUTTON (READ ONLY)
  ------------------------------------------------------------ */
  if (inputType === "paymentButton") {
    // Use the actual PaymentButton component in read mode
    const FieldComponent = FieldMap.paymentButton || PlainTextInput;
    
    return (
      <Box sx={{ mb: 2 }}>
        <FieldComponent
          label={fieldDef.label || "Payment"}
          mode="read"
          item={item}
          amount={0}
          tax={0}
        />
      </Box>
    );
  }

  /* ------------------------------------------------------------
     ⭐ BASIC FIELD
  ------------------------------------------------------------ */
  const isSelect =
    fieldDef.input === "select" ||
    (fieldDef.inputConfig && Array.isArray(fieldDef.inputConfig.options));

  const selectOptions = isSelect ? fieldDef.inputConfig?.options : null;
  const defaultValue = isSelect ? fieldDef.inputConfig?.defaultValue : null;

  return (
    <Box sx={{ mb: 2 }}>
      <FieldComponent
        label={fieldDef.label}
        value={value}
        mode="read"
        item={item}
        options={selectOptions}
        defaultValue={defaultValue}
        multiline={fieldDef.input === "textarea"}
      />
    </Box>
  );
}

/* ============================================================
   MAIN MODAL
============================================================ */
export default function ReadOnlyDetail({ open, onClose, item, fields, name }) {
  const theme = useTheme();

  const title = useMemo(() => {
    if (!item || typeof item !== "object") return "Details";

    const source = item.fieldsData ?? item;

    const nameKey = Object.keys(source).find(
      (key) =>
        key.toLowerCase().includes("name") &&
        typeof source[key] === "string" &&
        source[key].trim().length > 0
    );

    if (nameKey) return source[nameKey];
    if (source.title) return source.title;

    const fullName = `${source.firstName || ""} ${source.lastName || ""}`.trim();
    if (fullName) return fullName;

    return "Details";
  }, [item]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "95%", md: "70%", lg: "60%" },
          maxHeight: "90vh",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <SubtitleText name={name} item={item} />
          </Box>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          {fields.map((field, idx) => (
            <React.Fragment key={field.field}>
              <RenderReadOnlyField
                fieldDef={field}
                item={item}
                theme={theme}
              />
              {idx < fields.length - 1 && (
                <Divider sx={{ my: 2, opacity: 0.3 }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Modal>
  );
}