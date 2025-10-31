/** @module fields/types/contact/address */
export const AddressFields = [
  {
    field: 'address',
    type: 'Array',
    label: 'Addresses',
    displayInList: false,
    required: false,
    arrayConfig: {
      object: [
        {
          field: 'label',
          type: 'string',
          label: 'Label',
          defaultValue: 'Home',
          input: 'select',
          inputConfig: {
            options: ['Home', 'Work', 'Billing', 'Shipping', 'Other'],
          },
        },
        { field: 'street', type: 'string', label: 'Street', required: false, input: 'text' },
        { field: 'city', type: 'string', label: 'City', required: false, input: 'text' },
        {
          field: 'state',
          type: 'string',
          label: 'State',
          required: false,
          input: 'select',
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
          validations: { pattern: /^\d{5}(-\d{4})?$/ },
          input: 'zipCode',
          inputConfig: { mask: '#####-####' },
        },
      ],
      minItems: 0,
      maxItems: 5,
    },
    display: { order: 5 },
    input: 'array',
  },
];