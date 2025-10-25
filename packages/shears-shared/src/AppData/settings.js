import { ProductsList } from "./view-schema/products-view";

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
}

]