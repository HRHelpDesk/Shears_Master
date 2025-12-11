import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Collapse,
  Avatar,
} from "@mui/material";

import { alpha, useTheme } from "@mui/material/styles";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { AuthContext } from "../../../context/AuthContext";
import { getSubUsers } from "shears-shared/src/Services/Authentication";

import BottomSheetModalWeb from "../../BaseUI/BottomSheetModal";
import SelectableListViewWeb from "../../BaseUI/SubMenu/SelectableListView";

/* --------------------------------------------------------------
   Main Component
-------------------------------------------------------------- */
export default function SmartUserLinkSelect({
  label = "User",
  value,
  onChangeText,
  placeholder = "Select user...",
  mode = "edit",
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  const [visible, setVisible] = useState(false); // bottom sheet
  const [searchValue, setSearchValue] = useState("");
  const [expanded, setExpanded] = useState(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  /* --------------------------------------------------------------
     Sync displayed text
  -------------------------------------------------------------- */
  useEffect(() => {
    console.log("SmartUserLinkSelect value changed:", value);
    if (value?.fullName) setSearchValue(value.fullName);
    else setSearchValue("");
  }, [value]);

  /* --------------------------------------------------------------
     Fetch sub-users when modal opens
  -------------------------------------------------------------- */
  useEffect(() => {
    if (!visible) return;
    if (!token || !user?.subscriberId) return;

    (async () => {
      try {
        setLoading(true);
        const data = await getSubUsers(user.subscriberId, token);
        console.log("Fetched users for SmartUserLinkSelect:", data);

        setUsers(
          data?.map((u) => ({
            _id: u._id,
            fullName: u.fullName,
            email: u.email,
            role: u.role,
            avatar: u.avatar,
            raw: u,
          })) || []
        );
      } catch (e) {
        console.error("User fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  /* --------------------------------------------------------------
     Handle SELECT
  -------------------------------------------------------------- */
  const handleSelect = (u) => {
    onChangeText(u);
    setSearchValue(u.fullName);
    setVisible(false);
  };

  /* --------------------------------------------------------------
     READ MODE
  -------------------------------------------------------------- */
  if (mode === "read") {
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
            {value?.fullName || <em style={{ opacity: 0.6 }}>Not set</em>}
          </Typography>

          <KeyboardArrowDownIcon
            sx={{
              transition: "0.3s",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              opacity: 0.6,
            }}
          />
        </Box>

        <Collapse in={expanded}>
          {value && (
            <Box sx={{ mt: 2, pl: 1 }}>
              {value.avatar && (
                <Avatar
                  src={value.avatar}
                  sx={{ width: 48, height: 48, borderRadius: 1, mb: 1 }}
                />
              )}

              <Typography>Email: {value.email || "—"}</Typography>
              <Typography>Role: {value.role || "—"}</Typography>
            </Box>
          )}
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
        value={searchValue}
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
            bgcolor: theme.palette.background.paper,
          },
        }}
      />

      {/* --------------------------------------------------------------
          Bottom Sheet Modal
      -------------------------------------------------------------- */}
      <BottomSheetModalWeb
        visible={visible}
        onDismiss={() => setVisible(false)}
        name="users"
        component={SelectableListViewWeb}
        data={users}
        loading={loading}
        onSelect={(u) => handleSelect(u)}
      />
    </Box>
  );
}
