// packages/shared/src/AppData/fields/types/shared/payment-fields.js

export const PaymentFields = [
  {
    field: 'payment',
    type: 'object',
    label: 'Payment',
    displayInList: true,
    required: false,
    input: 'object',
    columns: 3,
    display: { order: 99 },

    objectConfig: [
      {
        field: 'amount',
        type: 'number',
        label: 'Amount',
        required: true,
        input: 'currency',
        inputConfig: { prefix: '$', step: 0.01 },
        display: { order: 1 },
        layout: { row: 1, span: 2 },
      },
      {
        field: 'status',
        type: 'string',
        label: 'Status',
        input: 'select',
        inputConfig: {
          options: ['Unpaid', 'Pending', 'Paid', 'Canceled'],
        },
        defaultValue: 'Pending',
        display: { order: 2 },
        layout: { row: 1, span: 1},
      },
      {
        field: 'payNow',
        type: 'button',
        label: 'Pay Now',
        input: 'paymentButton',
        display: { order: 3 },
        layout: { row: 2, span: 3 },
      },
    ],
  },
];
