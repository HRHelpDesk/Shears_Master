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
  {
  field: 'status',
  type: 'string',
  label: 'Status',
  required: true,
  input: 'select',
  inputConfig: {
    options: ['Open', 'Paid', 'Canceled'], // dropdown choices
  },
  defaultValue: 'Open',
  displayInList: true, // show in list view
  display: { order: 5 }, // controls sort position in your list/detail layout
}

]