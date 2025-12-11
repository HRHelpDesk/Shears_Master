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

  {
    field: "flashSaleAndCoupon",
    type: "object",
    label: "Flash Sale & Coupon",
    input: "object",
    displayInList: true,
    required: false,
    display: { order: 6 },

    objectConfig: [
      {
        field: "flashSalePercent",
        type: "number",
        label: "Flash Sale (%)",
        defaultValue: 0,
        input: "number",
        inputConfig: {
          min: 0,
          max: 100,
          step: 1,
          placeholder: "0–100",
        },
        validations: {
          min: 0,
          max: 100,
        },
      },
      {
        field: "couponAmount",
        type: "number",
        label: "Coupon Amount ($)",
        defaultValue: 0,
        input: "number",
        inputConfig: {
          min: 0,
          step: 1,
          placeholder: "$0 if none",
        },
        validations: {
          min: 0,
        },
      },
    ],
  },




];