// src/components/FieldSections/PrimitiveField.js
import React from 'react';
import { View, Text } from 'react-native';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';

const withOpacity = (hex, opacity) => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
};

const PrimitiveField = ({
  InputComponent,
  fieldKey,
  value,
  def,
  isReadOnly,
  primaryColor,
  theme,
  onChange,
  styles: customStyles,
}) => {
  const containerStyle = [
    customStyles.arrayContainer,
    !isLiquidGlassSupported && { backgroundColor: '#fff' },
  ];

  // For linkSelect fields: show .name in read mode
  const displayValue =
    def.input === 'linkSelect' && value && typeof value === 'object' && value.name
      ? value.name
      : value != null
        ? String(value)
        : '(empty)';

  // For input: show .name in text field
  const inputValue =
    def.input === 'linkSelect' && value && typeof value === 'object'
      ? value.name || ''
      : value != null
        ? String(value)
        : '';

  return (
    <LiquidGlassView
      style={containerStyle}
      effect="clear"
      tintColor={withOpacity(primaryColor, 0.15)}
      colorScheme="system"
    >
      <Text style={[customStyles.label, { color: theme.colors.onSurface, marginBottom: 4 }]}>
        {def.label}
      </Text>

      {isReadOnly ? (
        <Text style={[customStyles.value, { color: theme.colors.onSurface }]}>
          {displayValue}
        </Text>
      ) : (
        <InputComponent
          value={inputValue}
          onChangeText={onChange} // ← receives full object from SmartDialogLinkSelectInput
          recordTypeName={def.recordTypeName}
          label={def.label}
          placeholder={`Select ${def.label}...`}
          {...def.inputConfig}
        />
      )}
    </LiquidGlassView>
  );
};

export default PrimitiveField;