// src/components/BaseUI/ActionMenuWeb/EmailActionMenuItem.web.jsx
import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import EmailIcon from '@mui/icons-material/Email';


export default function EmailActionMenuItem({ email }) {
  if (!email) return null;

  const handleClick = () => {
    const confirmed = window.confirm(`Email ${email}?`);
    if (!confirmed) return;

    window.location.href = `mailto:${email}`;
  };

  return (
    <Tooltip title={`Email ${email}`}>
      <IconButton size="small" onClick={handleClick}>
        <EmailIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
