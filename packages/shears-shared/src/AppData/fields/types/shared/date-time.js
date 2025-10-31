//date
//time
//duration

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
  },
   {
    field: 'time',
    type: 'object',
    label: 'Time Range',
    displayInList: true,
    required: true,
    objectConfig: [
      {
        field: 'startTime',
        type: 'number',
        label: 'Start Time',
        validations: { min: 0, max: 23 },
        input: 'time',
        inputConfig: { step: 1, min: 0, max: 23 },
      },
      {
        field: 'endTime',
        type: 'number',
        label: 'End Time',
        validations: { min: 0, max: 59 },
        input: 'time',
        inputConfig: { step: 5, min: 0, max: 59 },
      },
    ],
    display: { order: 3 },
    input: 'object',
  },
  {
    field: 'duration',
    type: 'object',
    label: 'Duration',
    displayInList: true,
    required: true,
    objectConfig: [
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
    display: { order: 2 },
    input: 'object',
  },
];