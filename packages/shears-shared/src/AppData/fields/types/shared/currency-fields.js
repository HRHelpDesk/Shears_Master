//price
//cost
export const CurrencyFields = [
     {
    field: 'price',
    type: 'number',
    label: 'Price',
    displayInList: true,
    required: true,
    validations: { min: 0, max: 100000 },
    display: { placeholder: 'Enter selling price', order: 5 },
    input: 'currency',
    inputConfig: { prefix: '$', step: 0.01 },
  },
    {
    field: 'cost',
    type: 'number',
    label: 'Cost',
    displayInList: true,
    required: true,
    validations: { min: 0, max: 100000 },
    display: { placeholder: 'Enter product cost', order: 4 },
    input: 'currency',
    inputConfig: { prefix: '$', step: 0.01 },
  },

]