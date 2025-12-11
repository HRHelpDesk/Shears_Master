import React, { useState, useEffect, useContext } from "react";
import {
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
} from "react-native";

import { TextInput, Text, Avatar, useTheme } from "react-native-paper";
import { AuthContext } from "../../context/AuthContext";
import { getSubUsers } from "shears-shared/src/Services/Authentication";

import BottomSheetModal from "../BaseUI/BottomSheetModal";
import SelectableListView from "../BaseUI/SubMenu/SelectableListView";

export default function SmartUserLinkSelect({
  label = "User",
  value,
  onChangeText,
  placeholder = "Select user...",
  mode = "edit",
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Sync displayed user name */
  useEffect(() => {
    setSearchValue(value?.fullName || "");
  }, [value]);

  /* Fetch users */
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
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  const handleSelect = (u) => {
    onChangeText(u);
    setSearchValue(u.fullName);
    setVisible(false);
  };

  /* ------------------------------------------------------------
     READ MODE
  ------------------------------------------------------------ */
  if (mode === "read") {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={{ marginBottom: 6, color: theme.colors.primary }}>
          {label}
        </Text>

        <TouchableOpacity
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpanded((e) => !e);
          }}
        >
          <View
            style={{
              padding: 14,
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 8,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {value?.fullName || "Not set"}
            </Text>
            <Text style={{ opacity: 0.6 }}>{expanded ? "▲" : "▼"}</Text>
          </View>
        </TouchableOpacity>

        {expanded && value && (
          <View style={{ paddingTop: 12 }}>
            {value.avatar && (
              <Avatar.Image
                size={48}
                source={{ uri: value.avatar }}
                style={{ marginBottom: 10 }}
              />
            )}

            <Text>Email: {value.email || "—"}</Text>
            <Text>Role: {value.role || "—"}</Text>
          </View>
        )}
      </View>
    );
  }

  /* ------------------------------------------------------------
     EDIT MODE
  ------------------------------------------------------------ */
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ marginBottom: 6 }}>{label}</Text>

      <TouchableOpacity onPress={() => setVisible(true)}>
        <View
          style={{
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
            backgroundColor: theme.colors.surface,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ opacity: searchValue ? 1 : 0.5 }}>
            {searchValue || placeholder}
          </Text>
          <Text style={{ opacity: 0.5 }}>⌄</Text>
        </View>
      </TouchableOpacity>

      <BottomSheetModal
        visible={visible}
        onDismiss={() => setVisible(false)}
        component={SelectableListView}
        name="users"
        data={users}
        loading={loading}
        onSelect={(u) => handleSelect(u)}
      />
    </View>
  );
}
