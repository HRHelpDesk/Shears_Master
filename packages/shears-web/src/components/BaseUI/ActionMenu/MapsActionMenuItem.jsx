// src/components/BaseUI/ActionMenuWeb/MapsActionMenuItem.web.jsx
import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import LocationPinIcon from '@mui/icons-material/LocationPin';


export default function MapsActionMenuItem({ address }) {
  if (!address) return null;

  const stringified =
    typeof address === "string"
      ? address
      : [
          address.line1,
          address.line2,
          address.city,
          address.state,
          address.postalCode,
        ]
          .filter(Boolean)
          .join(", ");

  if (!stringified) return null;

  const handleClick = () => {
    const confirmed = window.confirm(`Open address?\n${stringified}`);
    if (!confirmed) return;

    const encoded = encodeURIComponent(stringified);

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      "_blank"
    );
  };

  return (
    <Tooltip title={`Open in Maps`}>
      <IconButton size="small" onClick={handleClick}>
        <LocationPinIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
