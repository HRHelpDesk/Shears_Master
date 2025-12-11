//link

export const SharedLinkField = [
  {
    field: 'linkField',
    type: 'object',
    label: 'Link',
    input: 'linkSelect',
    inputConfig: { recordType: 'contacts' },
    display: { placeholder: 'Select a record', order: 32 },
  },

  {
    field: 'linkField',
    type: 'array',
    label: 'Link',
    input: 'linkSelect',
    inputConfig: { recordType: 'contacts' },
    display: { placeholder: 'Select a record', order: 32 },
  },
//User Link Field
    {
    field: 'userLinkField',
    type: 'object',
    label: 'User Link',
    input: 'userSelect',
    inputConfig: { recordType: 'users' },
    display: { placeholder: 'Select a User', order: 32 },
  },
  
];