// src/components/BaseUI/Web/BossCrownsProductListWeb.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { searchProducts } from "shears-shared/src/Services/Authentication";

const SquareAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: 8,
}));

const PlaceholderBox = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: 8,
  backgroundColor: theme.palette.action.hover,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2rem",
}));

export default function BossCrownsProductListWeb({ onSelect }) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  /* ---------------------------------------------------------
     Search Products (debounced)
  --------------------------------------------------------- */
  useEffect(() => {
    if (!search.trim()) {
      setProducts([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchProducts(search, 25);
        setProducts(results);
        setHasSearched(true);
      } catch (error) {
        console.error("Failed to search products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  /* ---------------------------------------------------------
     Handle Product Selection
  --------------------------------------------------------- */
  const handleProductSelect = (product) => {
    if (!onSelect) return;

    console.log("Selected Shopify product:", product);

    // Transform product to include image as array
    const transformedProduct = {
      ...product,
      productImage: product.images?.[0]?.node?.src
        ? [product.images[0].node.src]
        : [],
    };

    console.log("Transformed product with image array:", transformedProduct);
    onSelect(transformedProduct);
  };

  /* ---------------------------------------------------------
     Loading State
  --------------------------------------------------------- */
  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 2 }}>
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Searching products...
        </Typography>
      </Box>
    );
  }

  /* ---------------------------------------------------------
     Empty State
  --------------------------------------------------------- */
  if (!hasSearched && !search.trim()) {
    return (
      <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        <TextField
          fullWidth
          size="medium"
          label="Search BossCrowns Products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          placeholder="Start typing to search..."
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.7 }}>
            🔍 Start typing to search for products
          </Typography>
        </Box>
      </Box>
    );
  }

  if (hasSearched && products.length === 0) {
    return (
      <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        <TextField
          fullWidth
          size="medium"
          label="Search BossCrowns Products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.7 }}>
            No products found for "{search}"
          </Typography>
        </Box>
      </Box>
    );
  }

  /* ---------------------------------------------------------
     Product List
  --------------------------------------------------------- */
  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      <TextField
        fullWidth
        size="medium"
        label="Search BossCrowns Products"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
        sx={{
          mb: 3,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
          },
        }}
      />

      <List
        disablePadding
        sx={{
          bgcolor: "background.paper",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {products.map((product, index) => {
          const imageUrl = product.images?.[0]?.node?.src || null;
          const price = product.variants?.[0]?.node?.price?.amount || null;
          const description = product.description?.replace(/<[^>]*>/g, "") || "";

          return (
            <ListItemButton
              key={product.id}
              onClick={() => handleProductSelect(product)}
              sx={{
                py: 2,
                px: 2.5,
                borderBottom: index !== products.length - 1 ? "1px solid" : "none",
                borderColor: "divider",
                alignItems: "flex-start",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "action.hover",
                  transform: "translateX(4px)",
                },
              }}
            >
              <ListItemAvatar sx={{ mt: 0.5, minWidth: 96 }}>
                {imageUrl ? (
                  <SquareAvatar
                    src={imageUrl}
                    variant="rounded"
                    sx={{
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      transition: "transform 0.2s ease",
                      "&:hover": { transform: "scale(1.05)" },
                    }}
                  />
                ) : (
                  <PlaceholderBox>📦</PlaceholderBox>
                )}
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: "1.05rem" }}>
                      {product.title}
                    </Typography>
                    {product.status === "ACTIVE" && (
                      <Chip
                        label="Active"
                        size="small"
                        color="success"
                        sx={{
                          height: 22,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box component="span" sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
                    {description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.875rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {description}
                      </Typography>
                    )}
                    {price && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "primary.main",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        ${parseFloat(price).toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                }
                secondaryTypographyProps={{ component: "div" }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}