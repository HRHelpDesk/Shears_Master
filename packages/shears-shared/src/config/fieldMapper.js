import { Fields } from "../AppData/fields/fields";

/**
 * Merge base field definitions with overrides defined in app config
 * @param {Array} appFields - The field definitions from the app config (AppData)
 * @returns {Array} - The merged and normalized field definitions
 */
export function mapFields(appFields = []) {
  console.log('Input appFields:', JSON.stringify(appFields, null, 2));

  // Map base Fields for lookup
  const fieldMap = Object.fromEntries(Fields.map(f => [f.field, f]));

  return appFields.map(appField => {
    const baseField = fieldMap[appField.field];
    if (!baseField) {
      console.warn(`Unknown field: ${appField.field}`);
      return appField;
    }

    // Merge arrayConfig if exists
    const mergedArrayConfig = baseField.arrayConfig
      ? {
          ...baseField.arrayConfig,
          ...(appField.override?.arrayConfig || {}),
          object: appField.override?.arrayConfig?.object || baseField.arrayConfig?.object,
        }
      : undefined;

    // If the field is an object (non-array), define objectConfig from keys
    let objectConfig;
    if (!mergedArrayConfig && typeof baseField.defaultValue === 'object' && baseField.defaultValue !== null) {
      objectConfig = Object.keys(baseField.defaultValue).map(k => {
        const sub = baseField.defaultValue[k];
        return {
          field: k,
          label: k.charAt(0).toUpperCase() + k.slice(1), // fallback label
          type: typeof sub,
          input: 'text',
          defaultValue: sub ?? '',
        };
      });
    } else if (!mergedArrayConfig && baseField.type === 'object' && baseField.objectConfig) {
      objectConfig = baseField.objectConfig;
    }

    // Merge base field with overrides
    return {
      ...baseField,
      ...appField.override,
      arrayConfig: mergedArrayConfig,
      objectConfig: objectConfig || baseField.objectConfig, // for object fields
      display: {
        ...baseField.display,
        ...(appField.override?.display || {}),
      },
      validations: {
        ...baseField.validations,
        ...(appField.override?.validations || {}),
        pattern: appField.override?.validations?.pattern || baseField.validations?.pattern,
      },
    };
  });
}

/**
 * Returns the correct input component for a given field definition
 * @param {Object} fieldDef - Field definition (from Fields array or mappedFields)
 * @returns {React.Component} - The input component
 */
export function getInputComponent(fieldDef, FieldMap) {
  if (!fieldDef || !fieldDef.input) return null;

  const InputComponent = FieldMap[fieldDef.input];
  if (!InputComponent) {
    console.warn(`No input component mapped for type: ${fieldDef.input}`);
    return null;
  }

  return InputComponent;
}