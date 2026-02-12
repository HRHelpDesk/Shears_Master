// src/components/ActionMenu/ActionMenu.jsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme, Text } from "react-native-paper";

import PhoneCallActionMenuItem from "./PhoneCallActionMenuItem";
import TextMessageActionMenuItem from "./TextMessageActionMenuItem";
import EmailActionMenuItem from "./EmailActionMenuItem";
import MapsActionMenuItem from "./MapsActionMenuItem";
import AutofillActionMenuItem from "./AutofillActionMenuItem";
import BossCrownsProductAction from './InfluencerApp/BossCrownsProductAction'

/* ===================================================================
   ✅ Extract Helpers — Recursively scan for actionable fields
=================================================================== */
const extractPhoneNumbers = (obj) => {
  const phones = [];

  const walk = (node) => {
    if (!node || typeof node !== "object") return;

    if (node?.raw?.phone && Array.isArray(node.raw.phone)) {
      node.raw.phone.forEach((p) => phones.push(p.value));
    }

    if (typeof node.phone === "string") phones.push(node.phone);

    if (Array.isArray(node.phone)) {
      node.phone.forEach((p) => p?.value && phones.push(p.value));
    }

    Object.values(node).forEach(walk);
  };

  walk(obj);
  return phones;
};

const extractEmails = (obj) => {
  const emails = [];

  const walk = (node) => {
    if (!node || typeof node !== "object") return;

    if (node?.raw?.email && Array.isArray(node.raw.email)) {
      node.raw.email.forEach((e) => e?.value && emails.push(e.value));
    }

    if (typeof node.email === "string") {
      emails.push(node.email);
    }

    if (Array.isArray(node.email)) {
      node.email.forEach((e) => e?.value && emails.push(e.value));
    }

    Object.values(node).forEach(walk);
  };

  walk(obj);
  return emails;
};

const extractAddresses = (obj) => {
  const addresses = [];

  const walk = (node) => {
    if (!node || typeof node !== "object") return;

    if (node?.raw?.address && Array.isArray(node.raw.address)) {
      node.raw.address.forEach((a) => addresses.push(a));
    }

    if (Array.isArray(node.address)) {
      node.address.forEach((a) => addresses.push(a));
    }

    if (typeof node.address === "string") {
      addresses.push(node.address);
    }

    Object.values(node).forEach(walk);
  };

  walk(obj);
  return addresses;
};

/* ===================================================================
   ✅ MAIN ACTION MENU COMPONENT
=================================================================== */
export default function ActionMenu({ 
  item, 
  recordType, 
  recordTypeName,
  onAutofill,
  onProductSelect, // ⭐ NEW PROP
  fields,
  appConfig,
  actionsMenu = [],
}) {
  const theme = useTheme();
  const [showAutofillModal, setShowAutofillModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false); // ⭐ NEW STATE

  console.log('AppConfig in ActionMenu:', appConfig); 
  
  const phones = extractPhoneNumbers(item);
  const emails = extractEmails(item);
  const addresses = extractAddresses(item);

  const hasActions = phones.length || emails.length || addresses.length;

  return (
    <View style={[styles.container, { borderColor: theme.colors.outline }]}>
      <Text
        variant="labelLarge"
        style={{
          marginBottom: 8,
          color: theme.colors.textSecondary,
          opacity: 0.8,
        }}
      >
        Actions
      </Text>

      <View style={styles.actionsRow}>
        {actionsMenu.includes('autofill') && (
          <AutofillActionMenuItem
            visible={showAutofillModal}
            onPress={() => setShowAutofillModal(true)}
            onDismiss={() => setShowAutofillModal(false)}
            onAutofill={onAutofill}
            recordType={recordType}
            recordTypeName={recordTypeName}
            fields={fields}
          />
        )}

        {/* ⭐ NEW BOSSCROWNS PRODUCT ACTION */}
        {actionsMenu.includes('bc-products') && (
          <BossCrownsProductAction
            visible={showProductModal}
            onPress={() => setShowProductModal(true)}
            onDismiss={() => setShowProductModal(false)}
            onProductSelect={onAutofill}
          />
        )}

        {/* {hasActions && (
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
            • More actions coming soon
          </Text>
        )} */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
});