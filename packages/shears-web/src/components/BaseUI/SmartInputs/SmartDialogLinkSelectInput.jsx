// src/components/SmartInputs/SmartDialogLinkSelectInput.web.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Collapse,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";

import { AuthContext } from "../../../context/AuthContext";
import { getRecords } from "shears-shared/src/Services/Authentication";

import FieldActionsForEntry from "../ActionMenu/FieldActionsForEntry";
import GlassActionButtonWeb from "../../UI/GlassActionButton";

import BottomSheetModalWeb from "../../BaseUI/BottomSheetModal";
import SelectableListViewWeb from "../../BaseUI/SubMenu/SelectableListView";

/* --------------------------------------------------------------
   HELPERS (same as RN)
-------------------------------------------------------------- */
const formatLinkedValue = (key, value) => {
  if (!value) return "";

  if (key === "price") {
    const num = parseFloat(value);
    return isNaN(num) ? value : `$${num.toFixed(2)}`;
  }

  if (key === "duration" && typeof value === "object") {
    return `${value.hours || 0}h ${value.minutes || 0}m`;
  }

  return value;
};

const getLinkedDisplayFields = (raw) => {
  if (!raw || typeof raw !== "object") return [];

  const fields = [];
  if (raw.price != null) fields.push({ key: "price", label: "Price", layout: "inline" });
  if (raw.duration != null) fields.push({ key: "duration", label: "Duration", layout: "inline" });
  if (Array.isArray(raw.phone)) fields.push({ key: "phone", label: "Phone", layout: "inline" });
  if (raw.description) fields.push({ key: "description", label: "Description", layout: "full" });
  if (raw.saleAmount) fields.push({ key: "saleAmount", label: "Sale Amount", layout: "full" });
  if (raw.percentage) fields.push({ key: "percentage", label: "Percentage off Regular Price", layout: "full" });
  return fields;
};

/* --------------------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------------------- */
export default function SmartDialogLinkSelectInput({
  label,
  value,
  recordTypeName = "contacts",
  onChangeText,
  placeholder = "Select...",
  mode = "edit",
  showQuantity = false,
  autoEnableQuantityFor = ["products"],
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  const [visible, setVisible] = useState(false); // controls BottomSheetModalWeb
  const [searchValue, setSearchValue] = useState("");
  const [expanded, setExpanded] = useState(false);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const [quantity, setQuantity] = useState(value?.quantity || 1);

  const quantityEnabled =
    showQuantity || autoEnableQuantityFor.includes(recordTypeName);

  /* --------------------------------------------------------------
     Sync displayed value
  -------------------------------------------------------------- */
  useEffect(() => {
    if (value?.name) setSearchValue(value.name);
    else setSearchValue("");
  }, [value]);

  useEffect(() => {
    if (value?.quantity != null) setQuantity(value.quantity);
  }, [value]);

  /* --------------------------------------------------------------
     Fetch records on modal open
  -------------------------------------------------------------- */
  useEffect(() => {
    if (!visible) return;

    (async () => {
      try {
        setLoading(true);
        const response = await getRecords({
          recordType: recordTypeName.toLowerCase(),
          subscriberId: user.subscriberId,
          userId: user.userId,
          token,
          status: "active",
        });

        const formatted =
          response?.map((r) => {
            const f = r.fieldsData || {};
            const nameKeys = Object.keys(f).filter(
              (k) => k.toLowerCase().includes("name") && f[k]
            );

            const displayName = nameKeys.length
              ? nameKeys.slice(0, 2).map((k) => f[k]).join(" ")
              : "(Unnamed)";

            return {
              _id: r._id,
              name: displayName,
              raw: f,
              fieldsData: r.fieldsData,
            };
          }) || [];

        setRecords(formatted);
      } catch (err) {
        console.error("Fetch error:", err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  /* --------------------------------------------------------------
     Handle SELECT
  -------------------------------------------------------------- */
  const handleSelect = (record) => {
    onChangeText({
      ...record,
      quantity: quantity || 1,
    });

    setSearchValue(record.name);
    setVisible(false);
  };

  /* --------------------------------------------------------------
     READ MODE
  -------------------------------------------------------------- */
  if (mode === "read") {
    const raw = value?.raw || {};
    const fields = getLinkedDisplayFields(raw);

    const compact = fields.filter((f) => f.layout === "inline");
    const fullWidth = fields.filter((f) => f.layout === "full");

    const phoneEntry = raw.phone?.[0] || null;

    return (
      <Box sx={{ my: 1 }}>
        <Typography variant="subtitle2">{label}</Typography>

        <Box
          onClick={() => setExpanded((e) => !e)}
          sx={{
            mt: 0.5,
            p: 1.5,
            borderRadius: 1,
            cursor: "pointer",
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.background.paper, 0.5)
                : theme.palette.grey[100],
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>
            {value?.name || (
              <em style={{ opacity: 0.6 }}>Not set</em>
            )}
          </Typography>

          <KeyboardArrowDownIcon
            sx={{
              transition: "0.3s",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              opacity: 0.6,
            }}
          />
        </Box>

        {quantityEnabled && value?.quantity && (
          <Typography
            variant="body2"
            sx={{ mt: 0.75, ml: 0.5, fontWeight: 600, opacity: 0.8 }}
          >
            Quantity: {value.quantity}
          </Typography>
        )}

        <Collapse in={expanded}>
          <Box sx={{ mt: 1, pl: 1 }}>
            {/* Inline fields */}
            {compact.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 2 }}>
                {compact.map((f) => {
                  const isPhone = f.key === "phone";
                  let formattedValue = formatLinkedValue(f.key, raw[f.key]);

                  if (isPhone && phoneEntry) formattedValue = phoneEntry.value;

                  return (
                    <Box key={f.key}>
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>
                        {f.label}
                      </Typography>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>
                          {formattedValue}
                        </Typography>

                        {isPhone && phoneEntry && (
                          <FieldActionsForEntry entry={phoneEntry} />
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* Full width fields */}
            {fullWidth.map((f) => (
              <Box sx={{ mb: 1.5 }} key={f.key}>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  {f.label}
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {formatLinkedValue(f.key, raw[f.key])}
                </Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>
    );
  }

  /* --------------------------------------------------------------
     EDIT MODE
  -------------------------------------------------------------- */
  return (
    <Box sx={{ my: 1 }}>
      <Typography variant="subtitle2">{label}</Typography>

      {/* Selector input */}
      <TextField
        value={searchValue || ""}
        placeholder={placeholder}
        fullWidth
        variant="outlined"
        onClick={() => setVisible(true)}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end" sx={{ cursor: "pointer" }}>
              ⌄
            </InputAdornment>
          ),
        }}
        sx={{
          mt: 0.5,
          "& .MuiOutlinedInput-root": {
            borderRadius: 1,
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.background.paper, 0.9)
                : theme.palette.background.paper,
          },
        }}
      />

      {/* Quantity */}
      {quantityEnabled && value?._id && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Quantity
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <GlassActionButtonWeb
              icon={<RemoveIcon />}
              onClick={() => {
                const newQ = Math.max(1, quantity - 1);
                setQuantity(newQ);
                onChangeText({ ...value, quantity: newQ });
              }}
              size={40}
              theme={theme}
            />

            <TextField
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                const final = Math.max(1, val);
                setQuantity(final);
                onChangeText({ ...value, quantity: final });
              }}
              inputProps={{ min: 1, style: { textAlign: "center" } }}
              sx={{ width: 100 }}
            />

            <GlassActionButtonWeb
              icon={<AddIcon />}
              onClick={() => {
                const newQ = quantity + 1;
                setQuantity(newQ);
                onChangeText({ ...value, quantity: newQ });
              }}
              size={40}
              theme={theme}
            />
          </Box>
        </Box>
      )}

      {/* --------------------------------------------------------------
          WEB BOTTOM SHEET MODAL (Full Screen)
      -------------------------------------------------------------- */}
      <BottomSheetModalWeb
        visible={visible}
        onDismiss={() => setVisible(false)}
        name={recordTypeName}
        component={SelectableListViewWeb}
        data={records}
        loading={loading}
        onSelect={(record) => handleSelect(record)}
      />
    </Box>
  );
}
