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
          inputConfig: { options: ['Primary', 'Work', 'Personal'] },
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
  field: 'singleEmail',
  type: 'string',
  label: 'Email',
  displayInList: false,
  required: false,
  validations: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  input: 'email',
  inputConfig: { 
    autoComplete: 'email', 
    lowercase: true 
  },
  display: { order: 4 },
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
          inputConfig: { options: ['Mobile', 'Work', 'Home'] },
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
  {
  field: 'socialMediaHandles',
  type: 'Array',
  label: 'Social Media Accounts',
  displayInList: false,
  required: false,
  arrayConfig: {
    object: [
      {
        field: 'platform',
        type: 'string',
        label: 'Platform',
        input: 'select',
        inputConfig: { 
          options: ['Instagram', 'TikTok', 'Facebook', 'YouTube', 'Twitter/X', 'Snapchat'] 
        },
      },
      {
        field: 'handle',
        type: 'string',
        label: 'Handle',
        input: 'text',
        inputConfig: { 
          placeholder: '@username',
          autoComplete: 'off',
        },
      },
    ],
    minItems: 0,
    maxItems: 6,
  },
  display: { order: 2 },
  input: 'array',
}
];