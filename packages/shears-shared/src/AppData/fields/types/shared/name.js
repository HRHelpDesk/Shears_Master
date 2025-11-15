//name
//firstName
//lastName
//serviceName
//productName
export const SharedNameFields = [
      {
    field: 'name',
    type: 'string',
    label: 'Name',
    displayInList: true,
    required: true,
    validations: {
      minLength: 2,
      maxLength: 100,
      pattern: /^[A-Za-z0-9\s&-]+$/,
    },
    display: { placeholder: 'Enter service name', order: 6 },
    input: 'text',
  },
]