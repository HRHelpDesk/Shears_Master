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

  //Hyperlink Field
  {
    field: 'hyperlinkField',
    type: 'array',
    label: 'Hyperlink',
    input: 'hyperlink',
    display: { placeholder: 'Enter a URL', order: 32 },
  },
  
];