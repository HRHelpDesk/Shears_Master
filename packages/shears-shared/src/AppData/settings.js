import { ProductsList } from "./view-schema/products-view";
import { ServicesList } from "./view-schema/services-view";
import { PaymentSetup } from "./view-schema/stripe-setup-view";
import { Users } from "./view-schema/user-view";

export const shearSettings = [
     {
  name: 'Products',
  permissions: ['owner', 'admin', 'barber', 'stylist'], 
  displayName: 'Add Products',
icon: { ios: 'add-circle', android: 'plus-circle', web: 'fa fa-plus' },
  views: [ProductsList],
  fields: [
   
    {
    field: 'name', // refers to base field in SharedNameFields
    override: {
      field: 'productName', // ← This changes the actual output key
      label: 'Product Name',
      display: { placeholder: 'Enter Product Name', order: 1 },
      required: true,
      validations: {
        minLength: 2,
        maxLength: 50,
      },
    },
  },
    {
      field: 'productSKU',
      override: {
        required: false,
        displayInList:false,
        label: 'SKU / Barcode',
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
    field: 'name', // refers to base field in SharedNameFields
    override: {
      field: 'brand', // ← This changes the actual output key
      label: 'Brand',
      display: { placeholder: 'Enter the Brand Name', order: 1 },
      required: true,
      validations: {
        minLength: 2,
        maxLength: 50,
      },
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
      field: 'image',
      override: {
        field: 'productImage',
        displayInList: false,
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
  permissions: ['owner', 'admin', 'barber', 'stylist'], 
  displayName: 'Add Services',
  icon: { ios: 'scissors', android: 'content-cut', web: 'fa fa-cut' },
  views: [ServicesList],
  fields: [
    {
    field: 'name', // refers to base field in SharedNameFields
    override: {
      field: 'serviceName', // ← This changes the actual output key
      label: 'Service Name',
      display: { placeholder: 'Enter Service Name', order: 1 },
      required: true,
      validations: {
        minLength: 2,
        maxLength: 50,
      },
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
        type:'object',
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
{
  name: 'Users',
  displayName: 'Add Users',
  permissions: ['owner', 'admin'], 
  icon: { ios: 'people', android: 'account-group', web: 'fa fa-users' },
  views: [Users],
  fields: [
      {
    field: 'name', // refers to base field in SharedNameFields
    override: {
      field: 'firstName', // ← This changes the actual output key
      label: 'First Name',
      display: { placeholder: "Enter User's First Name", order: 1 },
      required: true,
      validations: {
        minLength: 2,
        maxLength: 50,
      },
    },
  },
  {
    field: 'name', // refers to base field in SharedNameFields
    override: {
      field: 'lastName', // ← This changes the actual output key
      label: 'Last Name',
      display: { placeholder: "Enter User's Last Name", order: 1 },
      required: true,
      validations: {
        minLength: 2,
        maxLength: 50,
      },
    },
  },

     {
    field: 'name', // refers to base field in SharedNameFields
    override: {
      field: 'email', // ← This changes the actual output key
      label: 'Email Address',
      display: { placeholder: 'Enter the Brand Name', order: 1 },
      required: true,
      validations: {
        minLength: 2,
        maxLength: 50,
      },
    },
  },
  {
      field: 'category',
      override: {
        field:'role',
        label: 'User Role',
        inputConfig: {

          options: ['owner', 'admin', 'barber', 'stylist'],
        },
        display: { order: 3 },
      },
    },
  ],
},

]