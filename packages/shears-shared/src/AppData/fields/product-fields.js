export const ProductFields = [
  {
    field: 'productName',
    type: 'string',
    label: 'Product Name',
    displayInList: true,
    required: true,
    validations: {
      minLength: 2,
      maxLength: 100,
      pattern: /^[A-Za-z0-9\s&\-]+$/, // Letters, numbers, spaces, hyphens, ampersands
    },
    display: {
      placeholder: 'Enter product name',
      order: 1,
    },
    input: 'text',
  },
  {
    field: 'productSKU',
    type: 'string',
    label: 'Product SKU',
    displayInList: true,
    required: true,
    validations: {
      minLength: 3,
      maxLength: 50,
      pattern: /^[A-Za-z0-9_-]+$/, // Letters, numbers, underscores, hyphens
    },
    display: {
      placeholder: 'Enter SKU (e.g. PROD-001)',
      order: 2,
    },
    input: 'text',
  },

  {
    field: 'cost',
    type: 'number',
    label: 'Cost',
    displayInList: true,
    required: true,
    validations: {
      min: 0,
      max: 100000,
    },
    display: {
      placeholder: 'Enter product cost',
      order: 4,
    },
    input: 'number',
    inputConfig: {
      prefix: '$',
      step: 0.01,
    },
  },
  {
    field: 'price',
    type: 'number',
    label: 'Price',
    displayInList: true,
    required: true,
    validations: {
      min: 0,
      max: 100000,
    },
    display: {
      placeholder: 'Enter selling price',
      order: 5,
    },
    input: 'number',
    inputConfig: {
      prefix: '$',
      step: 0.01,
    },
  },
  {
    field: 'supplier',
    type: 'object',
    label: 'Supplier',
    displayInList: true,
    required: false,
    objectConfig: [
      {
        field: 'name',
        type: 'string',
        label: 'Supplier Name',
        input: 'text',
        display: { placeholder: 'Enter supplier name' },
      },
      {
        field: 'contact',
        type: 'string',
        label: 'Contact Info',
        input: 'text',
        display: { placeholder: 'Enter supplier contact' },
      },
    ],
    display: {
      order: 6,
    },
    input: 'object', // grouped fields inline
  },
];
