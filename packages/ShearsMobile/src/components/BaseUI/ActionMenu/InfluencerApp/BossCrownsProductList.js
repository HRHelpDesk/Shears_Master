// src/components/BaseUI/SubMenu/BossCrownsProductList.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { searchProducts } from 'shears-shared/src/Services/Authentication';

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */
export default function BossCrownsProductList({ onSelect }) {
  const theme = useTheme();

  const [search, setSearch] = useState('');
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
        console.error('Failed to search products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [search]);

  /* ---------------------------------------------------------
     Handle Product Selection
  --------------------------------------------------------- */
   const handleProductSelect = (product) => {
    if (!onSelect) return;

    console.log('Selected Shopify product:', product);
    
    // Transform product to include image as array
    const transformedProduct = {
      ...product,
      productImage: product.images?.[0]?.node?.src 
        ? [product.images[0].node.src] 
        : []
    };
    
    console.log('Transformed product with image array:', transformedProduct);
    onSelect(transformedProduct);
  };

  /* ---------------------------------------------------------
     Render Product Item
  --------------------------------------------------------- */
  const renderProductItem = ({ item }) => {
    const imageUrl = item.images?.[0]?.node?.src || null;
    const price = item.variants?.[0]?.node?.price?.amount || null;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleProductSelect(item)}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.placeholderImage,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 24 }}>
                📦
              </Text>
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.textContainer}>
          <Text
            style={[styles.productName, { color: theme.colors.onSurface }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {item.description && (
            <Text
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {item.description.replace(/<[^>]*>/g, '')} {/* Strip HTML */}
            </Text>
          )}

          {price && (
            <Text style={[styles.price, { color: theme.colors.primary }]}>
              ${parseFloat(price).toFixed(2)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /* ---------------------------------------------------------
     Empty State
  --------------------------------------------------------- */
  const renderEmptyState = () => {
    if (loading) return null;

    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            🔍 Start typing to search for products
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          No products found for "{search}"
        </Text>
      </View>
    );
  };

  /* ---------------------------------------------------------
     Loading State
  --------------------------------------------------------- */
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
        Searching products...
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Input */}
      <TextInput
        style={[
          styles.searchInput,
          {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.surface,
            color: theme.colors.onSurface,
          },
        ]}
        placeholder="Search products..."
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={search}
        onChangeText={setSearch}
        autoFocus
      />

      {/* Product List */}
      {loading ? (
        renderLoadingState()
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={
            products.length === 0 ? styles.emptyListContent : undefined
          }
        />
      )}
    </View>
  );
}

/* ---------------------------------------------------------
   STYLES
--------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyListContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});