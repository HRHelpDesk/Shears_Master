// src/components/BaseUI/ActionMenuWeb/TextMessageActionMenuItem.web.jsx
import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import SmsIcon from '@mui/icons-material/Sms';


export default function TextMessageActionMenuItem({ phone, message = "" }) {
  if (!phone) return null;

  const normalized = String(phone).replace(/[^\d]/g, "");

  const handleClick = () => {
    if (!normalized) return;

    const confirmed = window.confirm(`Send SMS to ${phone}?`);
    if (!confirmed) return;

    let url = `sms:${normalized}`;
    if (message) url += `?body=${encodeURIComponent(message)}`;

    window.open(url, "_self");
  };

  return (
    <Tooltip title={`Text ${phone}`}>
      <IconButton size="small" onClick={handleClick}>
        <SmsIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
