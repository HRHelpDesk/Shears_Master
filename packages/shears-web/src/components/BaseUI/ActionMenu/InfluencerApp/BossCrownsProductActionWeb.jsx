// src/components/ActionMenu/BossCrownsProductActionWeb.jsx
import React, { useCallback } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import { Storefront } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import BossCrownsProductListWeb from "./BossCrownsProductListWeb";

export default function BossCrownsProductActionWeb({
  visible,
  onPress,
  onDismiss,
  onProductSelect,
}) {
  const handleProductSelect = useCallback(
    (product) => {
      console.log("Selected product from BossCrowns:", product);

      // Normalize Shopify product → view schema
      const transformedProduct = {
        productName: product.title,
        description: product.description,
        productImage:
          product.images?.map((img) => ({
            url: img.node.src,
            public_id: "",
          })) || [],
        isActive: product.status === "ACTIVE",
        raw: product,
      };

      console.log("Transformed product data:", transformedProduct);

      onProductSelect?.(transformedProduct);
      onDismiss();
    },
    [onProductSelect, onDismiss]
  );

  return (
    <>
      {/* BossCrowns Action Button */}
      <Button
        variant="outlined"
        startIcon={<Storefront />}
        onClick={onPress}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          fontWeight: 600,
          px: 2,
        }}
      >
        BossCrowns Product
      </Button>

      {/* Full-screen Dialog (matches Autofill) */}
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
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid",
            borderColor: "divider",
            px: 3,
            py: 2,
          }}
        >
          <Box>
            <Typography variant="h6">BossCrowns Products</Typography>
            <Typography variant="body2" color="text.secondary">
              Search and select a product
            </Typography>
          </Box>

          <IconButton onClick={onDismiss}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <BossCrownsProductListWeb onSelect={handleProductSelect} />
        </DialogContent>
      </Dialog>
    </>
  );
}
