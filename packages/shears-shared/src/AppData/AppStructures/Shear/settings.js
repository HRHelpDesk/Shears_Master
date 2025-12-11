import { ProductsList } from "../../view-schema/products-view";
import { ServicesList } from "../../view-schema/services-view";
import { PaymentSetup } from "../../view-schema/stripe-setup-view";
import { Users } from "../../view-schema/user-view";

export const shearSettings = [
  /* ----------------------------------------------------------
     PRODUCTS
  ---------------------------------------------------------- */
  {
    name: 'Products',
    recordType: 'products',       // ⭐ ADDED
    permissions: ['owner', 'admin', 'barber', 'stylist'],
    displayName: 'Add Products',
    icon: { ios: 'add-circle', android: 'plus-circle', web: 'fa fa-plus' },
    views: [ProductsList],

    fields: [
      {
        field: 'name',
        override: {
          field: 'productName',
          label: 'Product Name',
          display: { placeholder: 'Enter Product Name', order: 1 },
          required: true,
          validations: { minLength: 2, maxLength: 50 },
        },
      },
      {
        field: 'image',
        override: {
          field: 'productImage',
          displayInList: false,
          label: 'Product Images',
          display: { order: 11 },
        },
      },
      {
        field: 'productSKU',
        override: {
          label: 'SKU / Barcode',
          displayInList: false,
          display: { placeholder: 'Enter Product SKU/Barcode', order: 2 },
        },
      },
      {
        field: 'category',
        override: {
          label: 'Category',
          inputConfig: {
            options: ['Haircare', 'Styling Tools', 'Accessories', 'Gift Sets'],
          },
          display: { order: 3 },
        },
      },
      {
        field: 'name',
        override: {
          field: 'brand',
          label: 'Brand',
          display: { placeholder: 'Enter the Brand Name', order: 4 },
          required: true,
          validations: { minLength: 2, maxLength: 50 },
        },
      },
      {
        field: 'description',
        override: {
          label: 'Description',
          multiline: true,
          display: { order: 5 },
        },
      },
      {
        field: 'cost',
        override: {
          label: 'Cost (per unit)',
          required: true,
          inputConfig: { prefix: '$', step: 0.01 },
          display: { order: 6 },
        },
      },
      {
        field: 'price',
        override: {
          label: 'Retail Price',
          required: true,
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
          label: 'Supplier Name',
          display: { order: 9 },
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

  /* ----------------------------------------------------------
     SERVICES
  ---------------------------------------------------------- */
  {
    name: 'Services',
    recordType: 'services',       // ⭐ ADDED
    permissions: ['owner', 'admin', 'barber', 'stylist'],
    displayName: 'Add Services',
    icon: { ios: 'scissors', android: 'content-cut', web: 'fa fa-cut' },
    views: [ServicesList],

    fields: [
      {
        field: 'name',
        override: {
          field: 'serviceName',
          label: 'Service Name',
          display: { placeholder: 'Enter Service Name', order: 1 },
          required: true,
          validations: { minLength: 2, maxLength: 50 },
        },
      },
      {
        field: 'description',
        override: {
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
          type: 'object',
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

  /* ----------------------------------------------------------
     PAYMENT SETUP
     (No recordType — not CRUD, only config)
  ---------------------------------------------------------- */
  {
    name: 'PaymentSetup',
    displayName: 'Payment Connection Settings',
    icon: { ios: 'creditcard', android: 'credit-card', web: 'fa fa-credit-card' },
    views: [PaymentSetup],
    fields: [],
  },

  /* ----------------------------------------------------------
     USERS
  ---------------------------------------------------------- */
  {
    name: 'Users',
    recordType: 'users',       // ⭐ ADDED
    displayName: 'Add Users',
    permissions: ['owner', 'admin'],
    icon: { ios: 'people', android: 'account-group', web: 'fa fa-users' },
    views: [Users],

    fields: [
      {
        field: 'name',
        override: {
          field: 'firstName',
          label: 'First Name',
          display: { placeholder: "Enter User's First Name", order: 1 },
          required: true,
          validations: { minLength: 2, maxLength: 50 },
        },
      },
      {
        field: 'name',
        override: {
          field: 'lastName',
          label: 'Last Name',
          display: { placeholder: "Enter User's Last Name", order: 2 },
          required: true,
          validations: { minLength: 2, maxLength: 50 },
        },
      },
      {
        field: 'name',
        override: {
          field: 'email',
          label: 'Email Address',
          display: { placeholder: 'Enter Email Address', order: 3 },
          required: true,
          validations: { minLength: 2, maxLength: 50 },
        },
      },
      {
        field: 'category',
        override: {
          field: 'role',
          label: 'User Role',
          inputConfig: {
            options: ['owner', 'admin', 'barber', 'stylist'],
          },
          display: { order: 4 },
        },
      },
    ],
  },
];
