// src/components/ActionMenu/ActionMenuWeb.jsx
import React, { useState } from "react";
import { Box, Typography, styled } from "@mui/material";
import AutofillActionMenuItem from "./AutofillActionMenuItem";
import BossCrownsProductActionWeb from "./InfluencerApp/BossCrownsProductActionWeb";

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

export default function ActionMenuWeb({
  item,
  recordType,
  recordTypeName,
  onAutofill,
  onProductSelect,  // ⭐ NEW PROP
  fields,
  appConfig,
  actionsMenu = [],
}) {
  const [showAutofillModal, setShowAutofillModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false); // ⭐ NEW STATE

  const hasAutofill = actionsMenu.includes("autofill");
  const hasBCProducts = actionsMenu.includes("bc-products"); // ⭐ NEW CHECK

  return (
    <ActionContainer>
      <Typography 
        variant="labelLarge" 
        sx={{ 
          mb: 1, 
          color: "text.secondary", 
          opacity: 0.8,
          fontWeight: 600,
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

        {/* ⭐ BOSSCROWNS PRODUCT ACTION */}
        {hasBCProducts && (
          <BossCrownsProductActionWeb
            visible={showProductModal}
            onPress={() => setShowProductModal(true)}
            onDismiss={() => setShowProductModal(false)}
            onProductSelect={onProductSelect || onAutofill} // ⭐ Use same handler as autofill
          />
        )}

        {/* Future actions can go here */}
      </ActionsRow>
    </ActionContainer>
  );
}