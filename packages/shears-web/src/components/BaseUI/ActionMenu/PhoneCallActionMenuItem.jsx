// src/components/BaseUI/ActionMenuWeb/PhoneCallActionMenuItem.web.jsx
import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import PhoneIcon from '@mui/icons-material/Phone';

export default function PhoneCallActionMenuItem({ phone }) {
  if (!phone) return null;

  const normalized = String(phone).replace(/[^\d]/g, "");

  const handleClick = () => {
    if (!normalized) return;

    const confirmed = window.confirm(`Call ${phone}?`);
    if (!confirmed) return;

    window.open(`tel:${normalized}`, "_self");
  };

  return (
    <Tooltip title={`Call ${phone}`}>
      <IconButton size="small" onClick={handleClick}>
        <PhoneIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
