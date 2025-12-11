import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";

/* -------------------------------------------------------------
   Styled square avatar fallback
------------------------------------------------------------- */
const SquareAvatar = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: 8,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

/* -------------------------------------------------------------
   UNIVERSAL STRING SANITIZER
------------------------------------------------------------- */
const stringifyValue = (val) => {
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object" && "value" in val) return String(val.value || "");
  if (Array.isArray(val))
    return val.map((v) => stringifyValue(v)).filter(Boolean).join(", ");
  return "";
};

/* -------------------------------------------------------------
   NAME PARSER
------------------------------------------------------------- */
const getDisplayName = (item) => {
  if (!item) return "Unnamed";

  const name =
    item.name ||
    item.fullName ||
    item.displayName ||
    item.raw?.name ||
    item.raw?.fullName ||
    item.fieldsData?.name ||
    item.fieldsData?.fullName ||
    (item.raw?.firstName && item.raw?.lastName
      ? `${item.raw.firstName} ${item.raw.lastName}`
      : null);

  return stringifyValue(name) || "Unnamed";
};

/* -------------------------------------------------------------
   AVATAR PARSER
------------------------------------------------------------- */
const getAvatarUrl = (item) => {
  const paths = [
    item.avatar,
    item.avatar?.url,
    item.avatar?.[0]?.url,
    item.raw?.avatar,
    item.raw?.avatar?.url,
    item.raw?.avatar?.[0]?.url,
    item.fieldsData?.avatar,
    item.fieldsData?.avatar?.url,
    item.fieldsData?.avatar?.[0]?.url,
  ];

  for (const p of paths) {
    if (typeof p === "string") return p;
    if (p?.url) return p.url;
  }
  return null;
};

/* -------------------------------------------------------------
   SEARCH FILTER
------------------------------------------------------------- */
const matchesSearch = (item, search) => {
  if (!search) return true;
  return getDisplayName(item).toLowerCase().includes(search.toLowerCase());
};

/* -------------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------- */
export default function SelectableListViewWeb({ data = [], onSelect, name = "Item" }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return data.filter((item) => matchesSearch(item, search));
  }, [data, search]);

  return (
    <Box sx={{ p: 1 }}>
      <TextField
        variant="outlined"
        fullWidth
        size="small"
        label={`Search ${name}`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Paper variant="outlined">
        <List disablePadding>
          {filtered.map((item) => {
            const name = getDisplayName(item);
            const initials = name
              .split(" ")
              .map((p) => stringifyValue(p[0]))
              .join("")
              .substring(0, 2)
              .toUpperCase();

            const avatarUrl = getAvatarUrl(item);

            return (
              <ListItemButton
                key={item._id || name}
                onClick={() => onSelect?.(item)}
                sx={{ py: 1.2, borderBottom: "1px solid", borderColor: "divider" }}
              >
                <ListItemAvatar>
                  {avatarUrl ? (
                    <Avatar
                      src={avatarUrl}
                      sx={{ width: 48, height: 48, borderRadius: 2 }}
                      variant="rounded"
                    />
                  ) : (
                    <SquareAvatar variant="rounded">{initials}</SquareAvatar>
                  )}
                </ListItemAvatar>

                <ListItemText
                  primary={name}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            );
          })}

          {!filtered.length && (
            <Box sx={{ textAlign: "center", py: 4, opacity: 0.5, fontSize: 14 }}>
              No results
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
}
