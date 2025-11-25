// src/components/ListItemDetail.jsx
import React, { useContext, useEffect, useMemo, useRef } from "react";
import {
  Modal,
  Box,
  Typography,
  Divider,
  IconButton,
  Button as MuiButton,
  Stack,
} from "@mui/material";
import { v4 as uuidv4 } from 'uuid';

import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import { useTheme } from "@mui/material/styles";
import PlainTextInput from "./SmartInputs/PlainTextInput";
import PaymentButtonWeb from "./SmartInputs/PaymentButton";

import { FieldMap } from "../../config/component-mapping/FieldMap";
import FieldActionsForEntry from "../BaseUI/ActionMenu/FieldActionsForEntry";
import GlassActionButtonWeb from "../UI/GlassActionButton";
import SubtitleText from "../UI/SubtitleText";

import {
  singularize,
  currencyToNumber,
  formatCurrency,
  buildTransactionFromAppointment
} from "shears-shared/src/utils/stringHelpers";


import {
  createRecord,
  deleteRecord,
  updateRecord,
} from "shears-shared/src/Services/Authentication";

import { AuthContext } from "../../context/AuthContext";

/* ============================================================
   🧩 Utility — Safe deep value getter
============================================================ */
const getValue = (source, path) => {
  if (!source || !path) return "";
  const normalized = path.replace(/\[(\d+)\]/g, ".$1");
  return normalized.split(".").reduce((acc, key) => acc?.[key], source) ?? "";
};

/* ============================================================
   🧩 Render Nested Groups (objectConfig or array item)
============================================================ */
const RenderNestedFields = ({
  nestedFields = [],
  item,
  handleChange,
  mode,
  theme,
  parentPath,
  onPaymentComplete
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
                  {RenderField({
                    fieldDef: nf,
                    item,
                    handleChange,
                    mode,
                    theme,
                    parentPath,
                    onPaymentComplete,

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
   🧩 RenderField — Web parity with mobile
============================================================ */
function RenderField({
  fieldDef,
  item,
  handleChange,
  mode,
  theme,
  parentPath = "",
  onPaymentComplete,
}) {
  const inputType = fieldDef.input || fieldDef.type || "text";
  const nestedFields =
    fieldDef.objectConfig || fieldDef.arrayConfig?.object || [];

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
          mode={mode}
          onChangeText={(nv) => handleChange(fieldPath, nv)}
          inputConfig={fieldDef.inputConfig}
        />
      </Box>
    );
  }

  /* ------------------------------------------------------------
     ⭐ ARRAY FIELD
  ------------------------------------------------------------ */
  const isArray = Array.isArray(value);
  const shouldAutoInitArray =
    fieldDef.arrayConfig?.object ||
    fieldDef.type === "array" ||
    fieldDef.input === "array";

  if (shouldAutoInitArray && !isArray) {
    handleChange(fieldPath, []);
  }

  if (isArray) {
    const addItem = () => {
      const newEntry =
        fieldDef.input === "linkSelect"
          ? { _id: "", name: "" }
          : Object.fromEntries(
              (nestedFields || []).map((nf) => [nf.field, ""])
            );

      handleChange(fieldPath, [...value, newEntry]);
    };

    const deleteItem = (i) => {
      const updated = [...value];
      updated.splice(i, 1);
      handleChange(fieldPath, updated);
    };

    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography sx={{ color: theme.palette.primary.main }} variant="subtitle1">
            {fieldDef.label}
          </Typography>

          {mode !== "read" && (
            <MuiButton
              size="small"
              startIcon={<AddIcon />}
              onClick={addItem}
              sx={{ textTransform: "none" }}
            >
              Add
            </MuiButton>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {value.length === 0 ? (
          <Typography
            sx={{ fontStyle: "italic", color: "text.secondary" }}
            onClick={mode !== "read" ? addItem : undefined}
          >
            {mode !== "read" ? "+ Add first entry" : "No entries"}
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

                {mode === "read" ? (
                  <FieldActionsForEntry entry={entry} />
                ) : (
                  <MuiButton
                    size="small"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => deleteItem(idx)}
                    sx={{ color: theme.palette.error.main, textTransform: "none" }}
                  >
                    Remove
                  </MuiButton>
                )}
              </Box>

              {/* FIELDS */}
              {fieldDef.input === "linkSelect" ? (
                <FieldMap.linkSelect
                  label={fieldDef.label}
                  value={entry}
                  mode={mode}
                  recordTypeName={fieldDef.inputConfig?.recordType}
                  onChangeText={(nv) => {
                    const updated = [...value];
                    updated[idx] = nv;
                    handleChange(fieldPath, updated);
                  }}
                />
              ) : (
                <RenderNestedFields
                  nestedFields={nestedFields}
                  item={item}
                  handleChange={handleChange}
                  mode={mode}
                  theme={theme}
                  parentPath={`${fieldPath}[${idx}]`}
                  onPaymentComplete={onPaymentComplete}

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
          mode={mode}
          recordTypeName={fieldDef.inputConfig?.recordType}
          onChangeText={(nv) => handleChange(fieldPath, nv)}
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
            handleChange={handleChange}
            parentPath={fieldPath}
            mode={mode}
            theme={theme}
            onPaymentComplete={onPaymentComplete}
          />
        </Box>
      </Box>
    );
  }

  /* ------------------------------------------------------------
     ⭐ PAYMENT BUTTON (FULL MOBILE PARITY)
  ------------------------------------------------------------ */
  if (inputType === "paymentButton") {
    const currentAmount = item?.payment?.amount || "0";
    const currentTax = item?.payment?.tax || 0;
    const numericAmount = currencyToNumber(currentAmount);

    return (
      <Box sx={{ mb: 2 }}>
        <PaymentButtonWeb
          label={fieldDef.label || "Payment"}
          mode={mode}
          item={item}
          amount={numericAmount}
          tax={Number(currentTax)}
          onStatusChange={(paymentUpdate) => {
            console.log("Payment update received:", paymentUpdate);
            const base = parentPath?.endsWith("payment")
              ? parentPath
              : "payment";

            // update web local state
            handleChange(`${base}.status`, paymentUpdate.status);
            handleChange(`${base}.method`, paymentUpdate.method);
            handleChange(`${base}.sendReceipt`, paymentUpdate.sendReceipt);

            if (paymentUpdate.paymentIntent) {
              handleChange(`${base}.paymentIntentId`, paymentUpdate.paymentIntent.id);
            }

            if (paymentUpdate.status === "Paid") {
              console.log("Payment marked as Paid, invoking onPaymentComplete");
              onPaymentComplete?.(paymentUpdate);
            }
          }}
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

  return (
    <Box sx={{ mb: 2 }}>
      <FieldComponent
        label={fieldDef.label}
        value={value}
        mode={mode}
        onChangeText={(nv) => handleChange(fieldPath, nv)}
        options={selectOptions}
        multiline={fieldDef.input === "textarea"}
      />
    </Box>
  );
}

/* ============================================================
   🧩 MAIN COMPONENT
============================================================ */
export default function ListItemDetail({
  open,
  onClose,
  item = {},
  fields = [],
  name,
  mode: initialMode = "read",
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  /* ------------------- INIT FROM SCHEMA ------------------- */
  const initFromSchema = (schema) => {
    const o = {};
    schema.forEach((f) => {
      if (f.objectConfig) o[f.field] = initFromSchema(f.objectConfig);
      else if (f.arrayConfig?.object) o[f.field] = [];
      else o[f.field] = "";
    });
    return o;
  };

  const initialData = useMemo(() => {
    if (!item || typeof item !== "object") return initFromSchema(fields);

    if (item.fieldsData) return item.fieldsData;

    if (Object.keys(item).length > 0) return item;

    return initFromSchema(fields);
  }, [item, fields]);

  const [localItem, setLocalItem] = React.useState(initialData);
  const [mode, setMode] = React.useState(initialMode);

  const lastAutoAmount = useRef(0);

  /* INIT auto amount */
  useEffect(() => {
    const amt = currencyToNumber(localItem?.payment?.amount || "0");
    lastAutoAmount.current = amt;
  }, []);

  /* ============================================================
     🧮 AUTO CALC — Full Mobile Parity
  ============================================================ */
  const buildAutoKey = (obj) => {
    const results = [];

    const walk = (node) => {
      if (!node || typeof node !== "object") return;

      // Price × Quantity
      if (node.raw?.price != null) {
        results.push({
          price: node.raw.price,
          qty: Number(node.quantity ?? 1),
        });
      }

      // Duration
      if (node.raw?.duration) {
        results.push({
          dur: node.raw.duration,
        });
      }

      if (Array.isArray(node)) node.forEach(walk);
      else Object.values(node).forEach(walk);
    };

    walk(obj);
    return JSON.stringify(results);
  };

  const autoKey = buildAutoKey(localItem);

  useEffect(() => {
    if (!localItem) return;

    let totalAmount = 0;
    let totalMinutes = 0;

    const walk = (node) => {
      if (!node || typeof node !== "object") return;

      if (node.raw?.price != null) {
        const p = currencyToNumber(node.raw.price);
        const q = Number(node.quantity ?? 1);
        totalAmount += p * q;
      }

      if (node.raw?.duration) {
        const h = Number(node.raw.duration.hours || 0);
        const m = Number(node.raw.duration.minutes || 0);
        totalMinutes += h * 60 + m;
      }

      if (Array.isArray(node)) node.forEach(walk);
      else Object.values(node).forEach(walk);
    };

    walk(localItem);

    setLocalItem((prev) => {
      const updated = { ...prev };

      /* Duration + endTime */
      if (totalMinutes > 0) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;

        updated.duration = {
          hours: h.toString(),
          minutes: m.toString().padStart(2, "0"),
        };

        if (updated.time?.startTime) {
          const [sh, sm] = updated.time.startTime.split(":").map(Number);
          const start = new Date(0, 0, 0, sh, sm);
          const end = new Date(start.getTime() + totalMinutes * 60000);

          updated.time.endTime =
            `${String(end.getHours()).padStart(2, "0")}:` +
            `${String(end.getMinutes()).padStart(2, "0")}`;
        }
      }

      /* Payment Amount Auto */
      if (!updated.payment) updated.payment = {};

      const current = currencyToNumber(updated.payment.amount);

      if (!updated.payment.amount || current === lastAutoAmount.current) {
        updated.payment.amount = formatCurrency(String(totalAmount));
        lastAutoAmount.current = totalAmount;
      }

      return updated;
    });
  }, [autoKey]);

  /* ============================================================
     🔧 handleChange
  ============================================================ */
  const handleChange = (path, value) => {
    setLocalItem((prev) => {
      const updated = { ...prev };
      const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");

      let t = updated;
      while (keys.length > 1) {
        const k = keys.shift();
        if (!t[k]) t[k] = {};
        t = t[k];
      }
      t[keys[0]] = value;
      return updated;
    });
  };

  /* ============================================================
     💳 handlePaymentComplete (transaction creation)
  ============================================================ */
  const handlePaymentComplete = async (paymentUpdate) => {
    console.log("Payment completed:", paymentUpdate);
    try {
       const newID = paymentUpdate?.paymentIntent
      ? paymentUpdate.paymentIntent.id
        : uuidv4();
        console.log("Using transaction ID:", newID);  
      const tx = buildTransactionFromAppointment(localItem, paymentUpdate, newID);
    console.log("Built transaction:", tx);
      // Create transaction
      await createRecord(
        tx,
        "transactions",
        token,
        user.userId,
        user.subscriberId,
        user
      );

      // Update appointment if exists
      if (item?._id) {
        await updateRecord(item._id, localItem, token);
      }
    } catch (err) {
      console.error("Transaction/save failed:", err);
      alert("Payment captured but saving failed.");
    }
  };

  /* ============================================================
     💾 handleSave
  ============================================================ */
  const handleSave = async () => {
    try {
      const isUser = name?.toLowerCase() === "users";

      if (isUser) {
        if (mode === "add") {
          await createRecord(
            localItem,
            "user",
            token,
            user.userId,
            user.subscriberId,
            user
          );
        } else {
          const userIdToUpdate = item?.userId || item?._id;
          localItem.__isUser = true;
          await updateRecord(userIdToUpdate, localItem, token);
        }
        onClose();
        return;
      }

      if (mode === "edit" && item._id) {
        await updateRecord(item._id, localItem, token);
      } else {
        await createRecord(
          localItem,
          name.toLowerCase(),
          token,
          user.userId,
          user.subscriberId,
          user
        );
      }
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed: " + err.message);
    }
  };

  /* ============================================================
     🗑️ DELETE
  ============================================================ */
  const handleDelete = async () => {
    const isUser = name?.toLowerCase() === "users";
    const id = isUser ? item?.userId || item?._id : item?._id;

    if (!id) return;

    const confirmed = window.confirm(
      isUser ? "Delete this user?" : "Delete this item?"
    );
    if (!confirmed) return;

    try {
      await deleteRecord(id, token, isUser);
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed: " + err.message);
    }
  };

  /* ============================================================
     RESET on prop change
  ============================================================ */
  useEffect(() => {
    setLocalItem(initialData);
    setMode(initialMode);
  }, [item, initialMode]);

  /* ============================================================
     RENDER
  ============================================================ */
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
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ------------------------------------------------------ */}
        {/* HEADER */}
        {/* ------------------------------------------------------ */}
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {name === "users"
                  ? `${localItem.firstName || ""} ${localItem.lastName || ""}`
                  : localItem?.name || "Detail"}
              </Typography>

              <SubtitleText name={name} item={localItem} />

              {mode === "read" && localItem?.createdAt && (
                <Typography variant="caption" color="text.secondary">
                  Created{" "}
                  {new Date(localItem.createdAt).toLocaleDateString()}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1.5}>
              {mode === "read" ? (
                <>
                  {item?._id && (
                    <GlassActionButtonWeb
                      icon={<DeleteOutlineIcon />}
                      onClick={handleDelete}
                      color={theme.palette.error.main}
                      theme={theme}
                    />
                  )}

                  <GlassActionButtonWeb
                    icon={<EditIcon />}
                    onClick={() => setMode("edit")}
                    color={theme.palette.primary.main}
                    theme={theme}
                  />

                  <GlassActionButtonWeb
                    icon={<CloseIcon />}
                    onClick={onClose}
                    theme={theme}
                  />
                </>
              ) : (
                <>
                  <GlassActionButtonWeb
                    icon={<CheckIcon />}
                    onClick={handleSave}
                    color={theme.palette.primary.main}
                    theme={theme}
                  />

                  <GlassActionButtonWeb
                    icon={<CloseIcon />}
                    onClick={() =>
                      mode === "add" ? onClose() : setMode("read")
                    }
                    theme={theme}
                  />
                </>
              )}
            </Stack>
          </Box>
        </Box>

        {/* ------------------------------------------------------ */}
        {/* CONTENT */}
        {/* ------------------------------------------------------ */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          {fields.map((field, idx) => (
            <React.Fragment key={field.field}>
              {RenderField({
                fieldDef: field,
                item: localItem,
                handleChange,
                mode,
                theme,
                onPaymentComplete: handlePaymentComplete,
              })}

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
