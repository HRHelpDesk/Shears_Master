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

/* ============================================================
   Utility — Safe deep getter (FIXED)
============================================================ */
const getValue = (source, path) => {
  if (!source || !path) return "";

  // ✅ CRITICAL FIX
  const base = source.fieldsData ?? source;
  const normalized = path.replace(/\[(\d+)\]/g, ".$1");

  return (
    normalized
      .split(".")
      .reduce((acc, key) => acc?.[key], base) ?? ""
  );
};

/* ============================================================
   RenderField — READ ONLY
============================================================ */
function RenderReadOnlyField({ fieldDef, item, theme, parentPath = "" }) {
  const inputType = fieldDef.input || fieldDef.type || "text";
  const nestedFields =
    fieldDef.objectConfig || fieldDef.arrayConfig?.object || [];

  const FieldComponent = FieldMap[inputType] || FieldMap.text;

  const fieldPath = parentPath
    ? `${parentPath}.${fieldDef.field}`
    : fieldDef.field;

  const value = getValue(item, fieldPath);

  /* IMAGE FIELD */
  if (inputType === "image") {
    return (
      <Box sx={{ mb: 2 }}>
        <FieldComponent
          label={fieldDef.label}
          value={value}
          mode="read"
          inputConfig={fieldDef.inputConfig}
        />
      </Box>
    );
  }

  /* ARRAY FIELD */
  if (Array.isArray(value)) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ mb: 1 }} variant="subtitle1">
          {fieldDef.label}
        </Typography>

        {value.length === 0 ? (
          <Typography sx={{ opacity: 0.6, fontStyle: "italic" }}>
            No entries
          </Typography>
        ) : (
          value.map((_, idx) => (
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
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {fieldDef.label} #{idx + 1}
              </Typography>

              {nestedFields.map((nf) => (
                <RenderReadOnlyField
                  key={nf.field}
                  fieldDef={nf}
                  item={item}
                  theme={theme}
                  parentPath={`${fieldPath}[${idx}]`}
                />
              ))}
            </Box>
          ))
        )}
      </Box>
    );
  }

  /* OBJECT FIELD */
  if (
    value &&
    typeof value === "object" &&
    fieldDef.objectConfig &&
    !Array.isArray(value)
  ) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ mb: 1 }} variant="subtitle2">
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
          {fieldDef.objectConfig.map((nf) => (
            <RenderReadOnlyField
              key={nf.field}
              fieldDef={nf}
              item={item}
              theme={theme}
              parentPath={fieldPath}
            />
          ))}
        </Box>
      </Box>
    );
  }

  /* BASIC FIELD */
  return (
    <Box sx={{ mb: 2 }}>
      <FieldComponent
        label={fieldDef.label}
        value={value}
        mode="read"
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
