// src/components/ActionMenu/AutofillActionMenuItem.jsx
import React, { useState, useEffect, useContext } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useTheme, Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { AuthContext } from "../../../context/AuthContext";
import { getRecords } from "shears-shared/src/Services/Authentication";

import BottomSheetModal from "../BottomSheetModal";
import SelectableListView from "../SubMenu/SelectableListView";

/* ===================================================================
   ✅ AUTOFILL ACTION MENU ITEM
=================================================================== */
export default function AutofillActionMenuItem({
  visible,
  onPress,
  onDismiss,
  onAutofill,
  recordType,
  recordTypeName,
  fields, // ⭐ ADD THIS PROP
}) {
  const theme = useTheme();
  const { token, user, appConfig } = useContext(AuthContext); // ⭐ ADD appConfig
  
  const [localData, setLocalData] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ===================================================================
     ✅ GET FIELDS FROM APPCONFIG
  =================================================================== */
  const displayFields = React.useMemo(() => {
    if (fields?.length) return fields;
    
    if (!appConfig) return [];

    const route = appConfig.mainNavigation.find(
      (r) =>
        r.displayName?.toLowerCase() === recordTypeName?.toLowerCase() ||
        r.name?.toLowerCase() === recordTypeName?.toLowerCase() ||
        r.displayName?.toLowerCase() === recordType?.toLowerCase() ||
        r.name?.toLowerCase() === recordType?.toLowerCase()
    );

    return route?.fields || [];
  }, [fields, appConfig, recordTypeName, recordType]);

  /* ===================================================================
     ✅ FETCH RECORDS
  =================================================================== */
  useEffect(() => {
    const fetchRecords = async () => {
      if (!recordType || !token || !user?.subscriberId) return;
      
      try {
        setLoading(true);
        const res = await getRecords({
          recordType: recordType,
          token,
          subscriberId: user.subscriberId,
          userId: user.userId,
        });
        if (res) setLocalData(res);
      } catch (err) {
        console.error("Failed to load records:", err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch when modal becomes visible
    if (visible) {
      fetchRecords();
    }
  }, [visible, recordType, token, user?.subscriberId, user?.userId]);

  const handleSelect = (selectedItem) => {
    console.log("Selected item for autofill:", selectedItem);
    onAutofill?.(selectedItem);
    onDismiss();
  };

  return (
    <>
      {/* ⭐ AUTOFILL BUTTON */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            backgroundColor: theme.colors.primaryContainer,
            borderColor: theme.colors.primary,
          },
        ]}
        onPress={onPress}
      >
        <Icon
          name="auto-fix"
          size={20}
          color={theme.colors.primary}
          style={{ marginRight: 6 }}
        />
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.primary, fontWeight: "600" }}
        >
          Autofill
        </Text>
      </TouchableOpacity>

      {/* ⭐ BOTTOM SHEET MODAL */}
      <BottomSheetModal
        actionName="Autofill"
        visible={visible}
        onDismiss={onDismiss}
        component={SelectableListView}
        data={localData}
        name={recordTypeName || recordType}
        fields={displayFields} // ⭐ PASS FIELDS
        loading={loading}
        onSelect={handleSelect}
        mode="expanded"
        title="Autofill"
        subtitle={`Select from ${recordTypeName || recordType}`}
        icon="auto-fix"
        infoBanner={{
          icon: "information-outline",
          text: "Dates and times will not be copied",
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});