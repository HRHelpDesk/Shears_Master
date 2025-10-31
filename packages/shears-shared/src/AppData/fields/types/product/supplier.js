/** @module fields/types/product/supplier */
export const ProductSupplierFields = [
  {
    field: 'supplier',
    type: 'object',
    label: 'Supplier',
    displayInList: false,
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
    display: { order: 6 },
    input: 'object',
  },
];