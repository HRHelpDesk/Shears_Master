// src/components/BaseUI/ActionMenuWeb/FieldActionsForEntry.web.jsx
import React from "react";
import { Box } from "@mui/material";

import PhoneCallActionMenuItem from "./PhoneCallActionMenuItem";
import TextMessageActionMenuItem from "./TextMessageActionMenuItem";
import EmailActionMenuItem from "./EmailActionMenuItem";
import MapsActionMenuItem from "./MapsActionMenuItem";

/* ============================================================
   ✅ Extractors for PHONE / EMAIL / ADDRESS (single entry)
   — identical logic to mobile version
============================================================ */
const extractPhonesEntry = (entry) => {
  const phones = [];
  if (!entry) return phones;

  if (entry?.value && /\d/.test(entry.value)) phones.push(entry.value);
  if (typeof entry === "string" && /\d/.test(entry)) phones.push(entry);

  return phones;
};

const extractEmailsEntry = (entry) => {
  const emails = [];
  if (!entry) return emails;

  if (entry?.value && entry.value.includes("@")) emails.push(entry.value);
  if (typeof entry === "string" && entry.includes("@")) emails.push(entry);

  return emails;
};

const extractAddressesEntry = (entry) => {
  const addresses = [];
  if (!entry) return addresses;

  if (typeof entry === "object" && !entry.value) {
    addresses.push({
      line1: entry.street || entry.line1 || "",
      line2: entry.line2 || "",
      city: entry.city || "",
      state: entry.state || "",
      postalCode: entry.zip || entry.postalCode || "",
    });
  }

  if (typeof entry === "string" && entry.length > 4) {
    addresses.push({
      line1: entry,
      line2: "",
      city: "",
      state: "",
      postalCode: "",
    });
  }

  return addresses;
};

/* ============================================================
   ✅ MAIN COMPONENT (WEB)
============================================================ */
export default function FieldActionsForEntry({ entry }) {
  const phones = extractPhonesEntry(entry);
  const emails = extractEmailsEntry(entry);
  const addresses = extractAddressesEntry(entry);

  if (!(phones.length || emails.length || addresses.length)) return null;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {phones.map((p, i) => (
        <PhoneCallActionMenuItem key={`ph-${i}`} phone={p} />
      ))}

      {phones.map((p, i) => (
        <TextMessageActionMenuItem key={`sms-${i}`} phone={p} />
      ))}

      {emails.map((e, i) => (
        <EmailActionMenuItem key={`em-${i}`} email={e} />
      ))}

      {addresses.map((a, i) => (
        <MapsActionMenuItem key={`ad-${i}`} address={a} />
      ))}
    </Box>
  );
}
