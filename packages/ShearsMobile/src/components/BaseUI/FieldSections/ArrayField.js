// components/Fields/ArrayField.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AddNestedItemButton from '../../UI/AddNestedItemButton';

const withOpacity = (hex, opacity) => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
};

const ArrayField = ({
  fieldKey,
  value,
  def,
  isReadOnly,
  primaryColor,
  theme,
  renderFieldRecursive,
  handleAddNestedItem,
  handleRemoveNestedItem,
  styles: customStyles,
}) => {
  const objectConfig = def.arrayConfig?.object || [];

  // Normalise the incoming value to *always* be an array
  const safeValue = Array.isArray(value)
    ? value
    : value === undefined || value === null
      ? []
      : typeof value === 'object'
        ? Object.values(value)
        : [];

  if (!Array.isArray(value)) {
    console.warn(`Warning: Field "${fieldKey}" expected an array but got:`, typeof value, value);
  }

  const containerStyle = [
    customStyles.arrayContainer,
    !isLiquidGlassSupported && { backgroundColor: '#fff' },
  ];

  return (
    <LiquidGlassView
      key={fieldKey}
      style={containerStyle}
      effect="clear"
      tintColor={withOpacity(primaryColor, 0.2)}
      colorScheme="system"
    >
      {/* Title */}
      <Text style={[customStyles.arrayTitle, { color: theme.colors.onSurface }]}>
        {def.label}
      </Text>

      {/* Empty state (read-only) */}
      {safeValue.length === 0 && isReadOnly ? (
        <Text style={{ color: theme.colors.disabled }}>None</Text>
      ) : (
        /* Items */
        safeValue.map((entry, idx) => (
          <View
            key={idx}
            style={[
              customStyles.arrayItem,
              { backgroundColor: withOpacity(theme.colors.surface, 0.1) },
            ]}
          >
            {/* Render every sub-field of the array item */}
            {objectConfig.map(subField =>
              renderFieldRecursive(
                subField.field,
                entry?.[subField.field],
                subField,
                fieldKey,
                idx
              )
            )}

            {/* Delete button (edit mode only) */}
            {!isReadOnly && (
              <TouchableOpacity
                onPress={() => handleRemoveNestedItem(fieldKey, idx)}
                style={customStyles.deleteButton}
              >
                <Icon name="delete" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      {/* Add button (edit mode only) */}
      {!isReadOnly && (
        <AddNestedItemButton
          label={def.label}
          onPress={() => handleAddNestedItem(fieldKey)}
        />
      )}
    </LiquidGlassView>
  );
};

export default ArrayField;