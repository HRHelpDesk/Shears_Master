/** @module fields/types/product/core */
export const ProductCoreFields = [

  {
    field: 'productSKU',
    type: 'string',
    label: 'Product SKU',
    displayInList: true,
    required: true,
    validations: {
      minLength: 3,
      maxLength: 50,
      pattern: /^[A-Za-z0-9_-]+$/,
    },
    display: { placeholder: 'Enter SKU (e.g. PROD-001)', order: 2 },
    input: 'text',
  },

    {
    field: 'taxRate',
    type: 'string',
    label: 'Tax Rate',
    displayInList: true,
    required: true,
    validations: {
      minLength: 3,
      maxLength: 50,
      pattern: /^[A-Za-z0-9_-]+$/,
    },
    display: { placeholder: 'Enter SKU (e.g. PROD-001)', order: 2 },
    input: 'number',
  },


];