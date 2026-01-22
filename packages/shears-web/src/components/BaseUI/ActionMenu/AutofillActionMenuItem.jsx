// src/components/ActionMenu/AutofillActionMenuItem.jsx (web)
import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CloseIcon from "@mui/icons-material/Close";
import { AuthContext } from "../../../context/AuthContext";
import { getRecords } from "shears-shared/src/Services/Authentication";
import SelectableListViewWeb from "../SubMenu/SelectableListView"; // adjust path if needed

export default function AutofillActionMenuItem({
  visible,
  onPress,
  onDismiss,
  onAutofill,
  recordType,
  recordTypeName,
  fields: propFields,       // passed from ListItemDetail
  appConfig,
}) {
  const { token, user } = useContext(AuthContext);

  const [localData, setLocalData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Compute displayFields like mobile (fallback to appConfig if propFields missing)
  const displayFields = useMemo(() => {
    if (propFields?.length) return propFields;

    if (!appConfig?.mainNavigation) return [];

    const route = appConfig.mainNavigation.find(
      (r) =>
        r.displayName?.toLowerCase() === recordTypeName?.toLowerCase() ||
        r.name?.toLowerCase() === recordTypeName?.toLowerCase() ||
        r.displayName?.toLowerCase() === recordType?.toLowerCase() ||
        r.name?.toLowerCase() === recordType?.toLowerCase()
    );

    return route?.fields || [];
  }, [propFields, appConfig, recordTypeName, recordType]);

  // Fetch records when visible
  useEffect(() => {
    if (!visible || !recordType || !token || !user?.subscriberId) return;

    const fetchRecords = async () => {
      setLoading(true);
      try {
        const res = await getRecords({
          recordType,
          token,
          subscriberId: user.subscriberId,
          userId: user.userId,
        });
        setLocalData(res || []);
      } catch (err) {
        console.error("Failed to load records for autofill:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [visible, recordType, token, user]);

  const handleSelect = (selectedItem) => {
    console.log("Autofill selected:", selectedItem);
    onAutofill?.(selectedItem);
    onDismiss();
  };

  return (
    <>
      {/* Autofill Button */}
      <Button
        variant="outlined"
        startIcon={<AutoFixHighIcon />}
        onClick={onPress}
        sx={{
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 600,
        }}
      >
        Autofill
      </Button>

      {/* Full-screen Dialog */}
       <Dialog
        fullScreen
        open={visible}
        onClose={onDismiss}
        sx={{
          "& .MuiDialog-paper": {
            bgcolor: "background.default",
          },
        }}
      >
        <DialogTitle sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: 3,
          py: 2,
        }}>
          <Box>
            <Typography variant="h6">Autofill</Typography>
            <Typography variant="body2" color="text.secondary">
              Select from {recordTypeName || recordType}
            </Typography>
          </Box>
          <IconButton onClick={onDismiss}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <SelectableListViewWeb
              data={localData}
              onSelect={handleSelect}
              name={recordTypeName || recordType}
              fields={displayFields}         // ← Now correctly passed (like mobile)
              appConfig={appConfig}
              mode="expanded"                // ← Matches mobile
              // You can add these if you extend SelectableListViewWeb later
              // title="Autofill"
              // subtitle={`Select from ${recordTypeName || recordType}`}
              // icon="auto-fix"
              // infoBanner={{ icon: "information-outline", text: "Dates and times will not be copied" }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}