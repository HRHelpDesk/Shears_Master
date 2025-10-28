import { Fields } from "../AppData/fields/fields";

/**
 * Merge base field definitions with overrides defined in app config
 * @param {Array} appFields - The field definitions from the app config (AppData)
 * @returns {Array} - The merged and normalized field definitions
 */
export function mapFields(appFields = []) {
  const fieldMap = Object.fromEntries(Fields.map(f => [f.field, f]));

  return appFields.map(appField => {
    const baseField = fieldMap[appField.field];
    if (!baseField) return appField;

    // Merge arrayConfig or objectConfig (existing logic)
    const mergedArrayConfig = baseField.arrayConfig
      ? { ...baseField.arrayConfig, ...(appField.override?.arrayConfig || {}), object: appField.override?.arrayConfig?.object || baseField.arrayConfig?.object }
      : undefined;

    let objectConfig = !mergedArrayConfig && baseField.type === 'object' ? baseField.objectConfig : undefined;

    return {
      ...baseField,
      ...appField.override,
      arrayConfig: mergedArrayConfig,
      objectConfig: objectConfig,
      display: { ...baseField.display, ...(appField.override?.display || {}) },
      validations: { ...baseField.validations, ...(appField.override?.validations || {}), pattern: appField.override?.validations?.pattern || baseField.validations?.pattern },
      inputConfig: { ...baseField.inputConfig, ...(appField.override?.inputConfig || {}) },
            recordTypeName: appField.override?.inputConfig?.recordType || baseField.inputConfig?.recordType || 'contacts',

      field: appField.override?.field || baseField.field, // <-- important for changing key
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