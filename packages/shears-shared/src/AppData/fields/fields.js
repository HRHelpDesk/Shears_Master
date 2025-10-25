export const Fields = [
  {
    field: 'firstName',
    type: 'string',
    label: 'First Name',
    displayInList: true,
    required: true,
    validations: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[A-Za-z\s-]+$/, // Letters, spaces, hyphens
    },
    display: {
      placeholder: 'Enter first name',
      order: 1,
    },
    input: 'text', // Maps to a standard text input component
  },
  {
    field: 'lastName',
    type: 'string',
    label: 'Last Name',
    displayInList: true,
    required: true,
    validations: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[A-Za-z\s-]+$/, // Letters, spaces, hyphens
    },
    display: {
      placeholder: 'Enter last name',
      order: 2,
    },
    input: 'text', // Standard text input
  },
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
          input: 'select', // Dropdown for labels like "Primary", "Work", etc.
          inputConfig: {
            options: ['Primary', 'Work', 'Personal', 'Other'], // Predefined options
          },
        },
        {
          field: 'value',
          type: 'string',
          label: 'Email Address',
          validations: {
            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          },
          input: 'email', // Maps to a specialized EmailInput component
          inputConfig: {
            autoComplete: 'email', // Browser autocomplete hint
            lowercase: true, // Normalize email to lowercase
          },
        },
      ],
      minItems: 0,
      maxItems: 5,
    },
    display: {
      order: 4,
    },
    input: 'array', // Maps to an ArrayInput component that renders subfields
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
          inputConfig: {
            options: ['Mobile', 'Work', 'Home', 'Other'],
          },
        },
        {
          field: 'value',
          type: 'string',
          label: 'Phone Number',
          validations: { pattern: /^\+?[1-9]\d{1,14}$/ },
          input: 'phoneNumber', // Maps to a PhoneNumberInput component
          inputConfig: {
            mask: '+1 (###) ###-####', // Optional mask for formatting
            countryCode: true, // Allow country code input
          },
        },
      ],
      minItems: 0,
      maxItems: 5,
    },
    display: {
      order: 3,
    },
    input: 'array', // Array input for managing multiple phone numbers
  },
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
      {
        field: 'street',
        type: 'string',
        label: 'Street',
        required: false,
        input: 'text',
      },
      {
        field: 'city',
        type: 'string',
        label: 'City',
        required: false,
        input: 'text',
      },
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
        inputConfig: {
          mask: '#####-####', // Optional mask for ZIP+4
        },
      },
    ],
    minItems: 0,
    maxItems: 5,
  },
  display: {
    order: 5,
  },
  input: 'array', // Matches phone/email array structure
},

{
  field: 'serviceName',
  type: 'string',
  label: 'Service Name',
  displayInList: true,
  required: true,
  validations: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[A-Za-z0-9\s&\-]+$/, // Letters, numbers, spaces, hyphens, ampersands
  },
  display: {
    placeholder: 'Enter service name',
    order: 6,
  },
  input: 'text',
},

{
  field: 'description',
  type: 'string',
  label: 'Description',
  displayInList: false,
  required: false,
  validations: {
    maxLength: 500,
  },
  display: {
    placeholder: 'Enter service description',
    order: 7,
  },
  input: 'textarea', // Multiline input
  inputConfig: {
    rows: 4,
  },
},

{
  field: 'price',
  type: 'number',
  label: 'Price',
  displayInList: true,
  required: true,
  validations: {
    min: 0,
    max: 100000,
  },
  display: {
    placeholder: 'Enter price',
    order: 8,
  },
  input: 'number',
  inputConfig: {
    prefix: '$',
    step: 0.01,
  },
},

{
  field: 'duration',
  type: 'object', // change from 'Array' to 'object'
  label: 'Duration',
  displayInList: true,
  required: true,
  objectConfig: [ // renamed from arrayConfig to objectConfig for clarity
    {
      field: 'hours',
      type: 'number',
      label: 'Hours',
      validations: { min: 0, max: 23 },
      input: 'number',
      inputConfig: { step: 1, min: 0, max: 23 },
    },
    {
      field: 'minutes',
      type: 'number',
      label: 'Minutes',
      validations: { min: 0, max: 59 },
      input: 'number',
      inputConfig: { step: 5, min: 0, max: 59 },
    },
  ],
  display: {
    order: 9,
  },
  input: 'object', // renders like a grouped field inline
},


{
  field: 'category',
  type: 'string',
  label: 'Category',
  displayInList: false,
  required: true,
  validations: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[A-Za-z\s-]+$/, // Letters, spaces, hyphens
  },
  display: {
    placeholder: 'Enter category',
    order: 10,
  },
  input: 'text', // Standard text input like serviceName
},



 
];