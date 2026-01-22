// src/components/ActionMenu/ActionMenu.jsx (web)
import React, { useState } from "react";
import { Box, Typography, styled } from "@mui/material";
import AutofillActionMenuItem from "./AutofillActionMenuItem";

const ActionContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2.5),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.mode === "dark" 
    ? "rgba(255,255,255,0.03)" 
    : "rgba(255,255,255,0.6)",
}));

const ActionsRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
  alignItems: "center",
}));

export default function ActionMenu({
  item,
  recordType,
  recordTypeName,
  onAutofill,
  fields,          // required for autofill
  appConfig,       // required for field lookup fallback
  actionsMenu = [], // array like ['autofill', ...]
}) {
  const [showAutofillModal, setShowAutofillModal] = useState(false);

  const hasAutofill = actionsMenu.includes("autofill");

  return (
    <ActionContainer>
      <Typography 
        variant="labelLarge" 
        sx={{ 
          mb: 1, 
          color: "text.secondary", 
          opacity: 0.8 
        }}
      >
        Actions
      </Typography>

      <ActionsRow>
        {hasAutofill && (
          <AutofillActionMenuItem
            visible={showAutofillModal}
            onPress={() => setShowAutofillModal(true)}
            onDismiss={() => setShowAutofillModal(false)}
            onAutofill={onAutofill}
            recordType={recordType}
            recordTypeName={recordTypeName}
            fields={fields}
            appConfig={appConfig}
          />
        )}

        {/* Future actions can go here */}
        {/* {hasActions && !hasAutofill && (
          <Typography variant="caption" color="text.secondary">
            • More actions coming soon
          </Typography>
        )} */}
      </ActionsRow>
    </ActionContainer>
  );
}