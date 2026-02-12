// src/components/ActionMenu/BossCrownsProductAction.jsx
import React, { useState, useCallback } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useTheme, Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import BottomSheetModal from "../../BottomSheetModal";
import BossCrownsProductList from "./BossCrownsProductList";

/* ===================================================================
   ✅ BOSS CROWNS PRODUCT ACTION MENU ITEM
=================================================================== */
export default function BossCrownsProductAction({
  visible,
  onPress,
  onDismiss,
  onProductSelect,
}) {
  const theme = useTheme();

  const handleProductSelect = useCallback((product) => {
    console.log("Selected product from BossCrowns:", product);
    
    // Transform Shopify product data to match your view schema
    const transformedProduct = {
    productName: product.title,
    description: product.description,
    productImage: product.images?.map(img => ({
      url: img.node.src,
      public_id: "" // Shopify images don't have public_id, but we need the structure
    })) || [], // ⭐ Transform to {url, public_id} format
    isActive: product.status === 'ACTIVE',
    raw: product, // Keep original Shopify data
  };
    
    console.log("Transformed product data:", transformedProduct);
    
    if (onProductSelect) {
      onProductSelect(transformedProduct);
    }
    
    onDismiss();
  }, [onProductSelect, onDismiss]);

  return (
    <>
      {/* ⭐ BOSS CROWNS PRODUCT BUTTON */}
   <TouchableOpacity
  style={[
    styles.actionButton,
    {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
  ]}
  onPress={onPress}
>
  <Icon
    name="crown"
    size={20}
    color={theme.colors.primary}
    style={{ marginRight: 6 }}
  />
  <Text
    variant="labelMedium"
    style={{ color: theme.colors.primary, fontWeight: "600" }}
  >
    BossCrowns Product
  </Text>
</TouchableOpacity>

      {/* ⭐ BOTTOM SHEET MODAL */}
      <BottomSheetModal
        actionName="BossCrowns Product"
        visible={visible}
        onDismiss={onDismiss}
        component={BossCrownsProductList}
        onSelect={handleProductSelect}
        mode="expanded"
        title="BossCrowns Products"
        subtitle="Search and select products from your Shopify store"
        icon="crown"
        infoBanner={{
          icon: "information-outline",
          text: "Search for products by name or description",
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});