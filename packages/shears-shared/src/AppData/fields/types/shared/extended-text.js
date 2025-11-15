//description
//notes

export const SharedTextareaFields = [
     {
    field: 'description',
    type: 'string',
    label: 'Description',
    displayInList: false,
    required: false,
    validations: { maxLength: 500 },
    display: { placeholder: 'Enter description', order: 7 },
    input: 'textarea',
    inputConfig: { rows: 4 },
  },
  {
    field: 'notes',
    type: 'string',
    label: 'Notes',
    displayInList: false,
    required: false,
    validations: { maxLength: 500 },
    display: { placeholder: 'Enter Note', order: 30 },
    input: 'textarea',
    inputConfig: { rows: 4 },
  },
];