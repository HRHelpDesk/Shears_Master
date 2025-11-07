export const AddressFields = [
  {
    field: 'address',
    type: 'array',
    label: 'Addresses',
    input: 'array',
    arrayConfig: {
      object: [
        {
          field: 'label',
          type: 'string',
          label: 'Label',
          input: 'select',
          inputConfig: {
            options: ['Home', 'Work', 'Billing', 'Shipping', 'Other'],
          },
          layout: { row: 1, span: 1 },
        },
        {
          field: 'street',
          type: 'string',
          label: 'Street',
          input: 'text',
          layout: { row: 2, span: 3 }, // full-width
        },
        {
          field: 'city',
          type: 'string',
          label: 'City',
          input: 'text',
          layout: { row: 3, span: 1 },
        },
        {
          field: 'state',
          type: 'string',
          label: 'State',
          input: 'select',
          layout: { row: 3, span: 1 },
          inputConfig: {
            options: [
              'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
              'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
              'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
              'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
              'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
            ],
          },
        },
        {
          field: 'zip',
          type: 'string',
          label: 'ZIP Code',
          input: 'zipCode',
          layout: { row: 3, span: 1 },
          inputConfig: { mask: '#####-####' },
        },
      ],
      minItems: 0,
      maxItems: 5,
    },
    display: { order: 5 },
  },
];
