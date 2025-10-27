import { ProductsList } from "./view-schema/products-view";
import { ServicesList } from "./view-schema/services-view";

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
        display: { order: 1 },
      },
    },
    {
      field: 'productSKU',
      override: {
        required: true,
        display: { order: 2 },
      },
    },
    {
      field: 'description',
      override: {
        required: false,
        display: { order: 3 },
      },
    },
    {
      field: 'cost',
      override: {
        required: true,
        display: { order: 4 },
      },
    },
    {
      field: 'price',
      override: {
        required: true,
        display: { order: 5 },
      },
    },
    {
      field: 'supplier',
      override: {
        required: false,
        display: { order: 6 },
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

]