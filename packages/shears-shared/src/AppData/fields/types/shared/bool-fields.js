export const BoolFields = [
   {
    field: 'isActive',
    type: 'boolean',
    label: 'Active Status',
    displayInList: true,
    required: true,
    defaultValue: true, // ✅ optional but recommended
    validations: {
      // ✅ boolean has no length/min/max but schema consistency matters
      allowedValues: [true, false],
    },
    display: {
      placeholder: 'Toggle active status',
      order: 1,
      helper: 'Determines whether this item is currently enabled.',
    },
    input: 'boolean', // ✅ maps to SmartSwitchInput via FieldMap
    inputConfig: {
      onLabel: 'Active',   // ✅ optional config for UI
      offLabel: 'Inactive',
    },
  },

]