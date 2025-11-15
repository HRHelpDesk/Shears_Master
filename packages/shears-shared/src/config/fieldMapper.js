import { Fields } from "../AppData/fields/fields";

/**
 * Merge base field definitions with overrides defined in app config
 * @param {Array} appFields - The field definitions from the app config (AppData)
 * @returns {Array} - The merged and normalized field definitions
 */
// shears-shared/src/config/fieldMapper.js
// ✅ safe deep clone helper
const clone = (obj) => JSON.parse(JSON.stringify(obj));

export function mapFields(appFields = []) {
  // ✅ Clone base fields up front so they're never mutated
  const fieldMap = Object.fromEntries(
    Fields.map(f => [f.field, clone(f)])
  );

  return appFields.map(appField => {
    const baseField = fieldMap[appField.field];

    if (!baseField) {
      console.warn(`No base field found for ${appField.field}`);
      return clone(appField.override || appField);
    }

    const override = appField.override || {};

    // ✅ Deep clone base before merging ANYTHING
    const finalBase = clone(baseField);

    /* ---------------------------------------------------------------------- */
    /* ✅ Determine final type (override wins)                                 */
    /* ---------------------------------------------------------------------- */

    const finalType =
      override.type ||
      (override.arrayConfig ? "array" : null) ||
      (override.objectConfig ? "object" : null) ||
      finalBase.type;

    /* ---------------------------------------------------------------------- */
    /* ✅ Merge display / validations / inputConfig                            */
    /* ---------------------------------------------------------------------- */

    const mergedDisplay = {
      ...finalBase.display,
      ...(override.display || {}),
    };

    const mergedValidations = {
      ...finalBase.validations,
      ...(override.validations || {}),
      pattern:
        override.validations?.pattern ??
        finalBase.validations?.pattern,
    };

    const mergedInputConfig = {
      ...finalBase.inputConfig,
      ...(override.inputConfig || {}),
    };

    /* ---------------------------------------------------------------------- */
    /* ✅ Merge arrayConfig                                                    */
    /* ---------------------------------------------------------------------- */

    let mergedArrayConfig;

    if (finalType === "array") {
      const baseArrayObject =
        finalBase.arrayConfig?.object ||
        finalBase.objectConfig ||
        [];

      const overrideArrayObject = override.arrayConfig?.object || [];

      const mergedObject = baseArrayObject.map(baseObjField => {
        const overrideChild = overrideArrayObject.find(
          o => o.field === baseObjField.field
        );
        return {
          ...baseObjField,
          ...(overrideChild || {}),
        };
      });

      const newOverrides = overrideArrayObject.filter(
        o => !baseArrayObject.some(b => b.field === o.field)
      );

      mergedArrayConfig = {
        ...finalBase.arrayConfig,
        ...(override.arrayConfig || {}),
        object: [...mergedObject, ...newOverrides],
      };
    }

    /* ---------------------------------------------------------------------- */
    /* ✅ Merge objectConfig                                                   */
    /* ---------------------------------------------------------------------- */

    let mergedObjectConfig;

    if (finalType === "object") {
      const baseObjConfig = finalBase.objectConfig || [];
      const overrideObjConfig = override.objectConfig || [];

      const mergedObjects = baseObjConfig.map(baseObjField => {
        const overrideChild = overrideObjConfig.find(
          o => o.field === baseObjField.field
        );
        return {
          ...baseObjField,
          ...(overrideChild || {}),
        };
      });

      const newOverrides = overrideObjConfig.filter(
        o => !baseObjConfig.some(b => b.field === o.field)
      );

      mergedObjectConfig = [...mergedObjects, ...newOverrides];
    }

    /* ---------------------------------------------------------------------- */
    /* ✅ FINAL MERGED FIELD                                                   */
    /* ---------------------------------------------------------------------- */

    const output = {
      ...finalBase,
      ...override,

      type: finalType,

      display: mergedDisplay,
      validations: mergedValidations,
      inputConfig: mergedInputConfig,

      arrayConfig: finalType === "array" ? mergedArrayConfig : undefined,
      objectConfig: finalType === "object" ? mergedObjectConfig : undefined,

      // ✅ Important: override.field becomes the final field name
      field: override.field || finalBase.field,

      recordTypeName:
        override.inputConfig?.recordType ||
        finalBase.inputConfig?.recordType ||
        finalBase.recordTypeName ||
        "contacts",
    };

    return output;
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