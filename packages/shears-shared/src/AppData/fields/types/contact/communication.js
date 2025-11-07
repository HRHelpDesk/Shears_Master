/** @module fields/types/contact/communication */
export const CommunicationFields = [
  {
    field: 'email',
    type: 'Array',
    label: 'Emails',
    displayInList: false,
    required: false,
    arrayConfig: {
      object: [
        {
          field: 'label',
          type: 'string',
          label: 'Label',
          defaultValue: 'Primary',
          input: 'select',
          inputConfig: { options: ['Primary', 'Work', 'Personal', 'Other'] },
        },
        {
          field: 'value',
          type: 'string',
          label: 'Email Address',
          validations: {
            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          },
          input: 'email',
          inputConfig: { autoComplete: 'email', lowercase: true },
        },
      ],
      minItems: 0,
      maxItems: 5,
    },
    display: { order: 4 },
    input: 'array',
  },
  {
    field: 'phone',
    type: 'Array',
    label: 'Phone Numbers',
    displayInList: true,
    required: false,
    arrayConfig: {
      object: [
        {
          field: 'label',
          type: 'string',
          label: 'Label',
          defaultValue: 'Mobile',
          input: 'select',
          inputConfig: { options: ['Mobile', 'Work', 'Home', 'Other'] },
        },
        {
          field: 'value',
          type: 'string',
          label: 'Phone Number',
          validations: { pattern: /^\+?[1-9]\d{1,14}$/ },
          input: 'phone',
          inputConfig: { mask: '+1 (###) ###-####', countryCode: true },
        },
      ],
      minItems: 0,
      maxItems: 5,
    },
    display: { order: 3 },
    input: 'array',
  },
];