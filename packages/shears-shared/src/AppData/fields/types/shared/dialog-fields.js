//category

export const DialogFields = [
     {
    field: 'category',
    type: 'string',
    label: 'Category',
    displayInList: false,
    required: true,
    validations: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[A-Za-z\s-]+$/,
    },
    display: { placeholder: 'Enter category', order: 10 },
    input: 'text',
  },
]