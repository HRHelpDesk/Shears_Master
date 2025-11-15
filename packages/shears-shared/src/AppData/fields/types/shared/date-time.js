export const TimeDateFields = [
  {
    field: 'date',
    type: 'string',
    label: 'Date',
    displayInList: false,
    required: true,
    validations: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[A-Za-z\s-]+$/,
    },
    display: { placeholder: 'Enter date', order: 1 },
    input: 'date',
    layout: { row: 1, span: 3 }, // full-width single column row
  },
  {
    field: 'time',
    type: 'object',
    label: 'Time Range',
    displayInList: true,
    required: true,
    input: 'object',
    columns: 2, // show start and end time side by side
    display: { order: 2 },
    objectConfig: [
      {
        field: 'startTime',
        type: 'string',
        label: 'Start Time',
        validations: { min: 0, max: 23 },
        input: 'time',
        inputConfig: { step: 1, min: 0, max: 23 },
        layout: { row: 1, span: 1 }, // left column
      },
      {
        field: 'endTime',
        type: 'string',
        label: 'End Time',
        validations: { min: 0, max: 59 },
        input: 'time',
        inputConfig: { step: 5, min: 0, max: 59 },
        layout: { row: 1, span: 1 }, // right column
      },
    ],
  },
  {
    field: 'duration',
    type: 'object',
    label: 'Duration',
    displayInList: true,
    required: true,
    input: 'object',
    columns: 2, // show hours and minutes side by side
    display: { order: 3 },
    objectConfig: [
      {
        field: 'hours',
        type: 'number',
        label: 'Hours',
        validations: { min: 0, max: 23 },
        input: 'number',
        inputConfig: { step: 1, min: 0, max: 23 },
        layout: { row: 1, span: 1 }, // left
      },
      {
        field: 'minutes',
        type: 'number',
        label: 'Minutes',
        validations: { min: 0, max: 59 },
        input: 'number',
        inputConfig: { step: 5, min: 0, max: 59 },
        layout: { row: 1, span: 1 }, // right
      },
    ],
  },
];
