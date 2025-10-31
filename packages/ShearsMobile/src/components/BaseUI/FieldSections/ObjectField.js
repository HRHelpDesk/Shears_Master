// components/Fields/ObjectField.js
import React from 'react';
import { Text } from 'react-native';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';

const withOpacity = (hex, opacity) => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
};

const ObjectField = ({
  fieldKey,
  value,
  def,
  primaryColor,
  theme,
  renderFieldRecursive,
  styles: customStyles,
}) => {
  const safeObject = typeof value === 'object' && value !== null ? value : {};
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
      <Text style={[customStyles.arrayTitle, { color: theme.colors.onSurface }]}>
        {def.label}
      </Text>

      {def.objectConfig.map((subField) => (
        renderFieldRecursive(
          subField.field,
          safeObject[subField.field],
          subField,
          fieldKey,
          undefined
        )
      ))}
    </LiquidGlassView>
  );
};

export default ObjectField;