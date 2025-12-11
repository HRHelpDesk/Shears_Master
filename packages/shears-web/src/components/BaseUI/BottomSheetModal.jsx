// src/components/BaseUI/Web/BottomSheetModalWeb.jsx
import React from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Slide,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import { capitalizeFirstLetter } from "shears-shared/src/utils/stringHelpers";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/* ----------------------------------------------------------
   Styled Components
---------------------------------------------------------- */
const SheetContainer = styled(Box)(({ theme }) => ({
  height: "100%",
  overflowY: "auto",
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2),
}));

export default function BottomSheetModal({
  visible,
  onDismiss,
  component: Component,
  name,
  ...props
}) {
  return (
    <Dialog
      fullScreen
      open={visible}
      onClose={onDismiss}
      TransitionComponent={Transition}
    >
      {/* HEADER BAR */}
      <AppBar
        sx={{
          position: "relative",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? theme.palette.background.paper
              : "#ffffffcc",
          backdropFilter: "blur(10px)",
          boxShadow: "none",
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          <Typography
            sx={{ flex: 1, fontWeight: 700 }}
            variant="h6"
            component="div"
          >
            {capitalizeFirstLetter(name)}
          </Typography>

          <IconButton edge="end" onClick={onDismiss}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* CONTENT AREA */}
      <SheetContainer>
        {Component && <Component {...props} />}
      </SheetContainer>
    </Dialog>
  );
}
