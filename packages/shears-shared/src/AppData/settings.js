import { ProductsList } from "./view-schema/products-view";
import { ServicesList } from "./view-schema/services-view";
import { PaymentSetup } from "./view-schema/stripe-setup-view";

export const shearSettings = [
     {
  name: 'Products',
  displayName: 'Add Products',
icon: { ios: 'add-circle', android: 'plus-circle', web: 'fa fa-plus' },
  views: [ProductsList],
  fields: [
    {
      field: 'productName',
      override: {
        required: true,
        label: 'Product Name',
        display: { order: 1 },
      },
    },
    {
      field: 'productSKU',
      override: {
        required: true,
        label: 'SKU / Barcode',
        display: { order: 2 },
      },
    },
    {
      field: 'category',
      override: {
        label: 'Category',
        inputConfig: {
          options: ['Haircare', 'Styling Tools', 'Accessories', 'Gift Sets', 'Other'],
        },
        display: { order: 3 },
      },
    },
    {
      field: 'brand',
      override: {
        label: 'Brand',
        display: { order: 4 },
      },
    },
    {
      field: 'description',
      override: {
        label: 'Description',
        required: false,
        multiline: true,
        display: { order: 5 },
      },
    },
    {
      field: 'cost',
      override: {
        required: true,
        label: 'Cost (per unit)',
        inputConfig: { prefix: '$', step: 0.01 },
        display: { order: 6 },
      },
    },
    {
      field: 'price',
      override: {
        required: true,
        label: 'Retail Price',
        inputConfig: { prefix: '$', step: 0.01 },
        display: { order: 7 },
      },
    },
    {
      field: 'taxRate',
      override: {
        label: 'Tax Rate (%)',
        inputConfig: { step: 0.01 },
        display: { order: 8 },
      },
    },
    {
      field: 'supplier',
      override: {
        required: false,
        label: 'Supplier Name',
        display: { order: 9 },
      },
    },
    {
      field: 'supplierContact',
      override: {
        field: 'supplierContact',
        label: 'Supplier Contact',
        type: 'object',
        inputConfig: {
          recordType: 'contacts',
          searchField: 'firstName',
        },
        display: { order: 10 },
      },
    },
    {
      field: 'image',
      override: {
        field: 'productImage',
        label: 'Product Image',
        display: { order: 11 },
      },
    },
    {
      field: 'isActive',
      override: {
        label: 'Active Product',
        type: 'boolean',
        defaultValue: true,
        display: { order: 12 },
      },
    },
  ],
},
{
  name: 'Services',
  displayName: 'Add Services',
  icon: { ios: 'scissors', android: 'content-cut', web: 'fa fa-cut' },
  views: [ServicesList],
  fields: [
    {
      field: 'serviceName',
      override: {
        required: true,
        display: { order: 1 },
      },
    },
    {
      field: 'description',
      override: {
        required: false,
        display: { order: 2 },
      },
    },
    {
      field: 'price',
      override: {
        required: true,
        display: { order: 3 },
      },
    },
    {
      field: 'duration',
      override: {
        required: true,
        display: { order: 4 },
        arrayConfig: { minItems: 1 },
      },
    },
    {
      field: 'category',
      override: {
        required: true,
        display: { order: 5 },
      },
    },
  ],
},
{
  name: 'PaymentSetup',
  displayName: 'Payment Connection Settings',
  icon: { ios: 'creditcard', android: 'credit-card', web: 'fa fa-credit-card' },
  views: [PaymentSetup],
  fields: [],
},

]