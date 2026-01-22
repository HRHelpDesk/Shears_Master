import { DriversList } from "./views/drivers-view";

export const firstLineSettings = [
  /* ----------------------------------------------------------
     DRIVERS
  ---------------------------------------------------------- */
  {
    name: 'Drivers',
    recordType: 'drivers',
    permissions: ['owner', 'admin'],
    displayName: 'Add Drivers',
    icon: { 
      ios: 'person.fill.viewfinder', 
      android: 'account-box', 
      web: 'fa fa-id-card' 
    },
    views: [DriversList],

    fields: [
      {
        field: 'image',
        override: {
          field: 'driverPhoto',
          displayInList: false,
          label: 'Driver Photo',
          display: { order: 0 },
          inputConfig: {
            maxSizeMB: 5,
            accept: "image/png,image/jpeg",
            maxPhotos: 1,
          }
        },
      },
      {
        field: 'name',
        override: {
          field: 'firstName',
          label: 'First Name',
          required: true,
          display: { placeholder: 'Enter first name', order: 1 },
          validations: { minLength: 2, maxLength: 50 },
        },
      },
      {
        field: 'name',
        override: {
          field: 'lastName',
          label: 'Last Name',
          required: true,
          display: { placeholder: 'Enter last name', order: 2 },
          validations: { minLength: 2, maxLength: 50 },
        },
      },
      {
        field: 'phone',
        override: {
          required: true,
          display: { order: 3 },
          arrayConfig: { minItems: 1 },
        },
      },
      {
        field: 'email',
        override: {
          required: true,
          display: { order: 4 },
          arrayConfig: { minItems: 1 },
        },
      },
      {
        field: 'name',
        override: {
          field: 'licenseNumber',
          label: 'License Number',
          required: true,
          display: { placeholder: 'Enter CDL license number', order: 5 },
          validations: { minLength: 5, maxLength: 50 },
        },
      },
      {
        field: 'date',
        override: {
          field: 'licenseExpiration',
          label: 'License Expiration',
          type: 'string',
          required: true,
          display: { order: 6 },
        },
      },
      {
        field: 'name',
        override: {
          field: 'truckNumber',
          label: 'Truck Number',
          required: false,
          display: { placeholder: 'Enter assigned truck number', order: 7 },
          validations: { maxLength: 20 },
        },
      },
      {
        field: 'name',
        override: {
          field: 'truckMake',
          label: 'Truck Make',
          required: false,
          display: { placeholder: 'e.g., Peterbilt, Kenworth', order: 8 },
          validations: { maxLength: 50 },
        },
      },
      {
        field: 'name',
        override: {
          field: 'truckModel',
          label: 'Truck Model',
          required: false,
          display: { placeholder: 'Enter truck model', order: 9 },
          validations: { maxLength: 50 },
        },
      },
      {
        field: 'name',
        override: {
          field: 'vinNumber',
          label: 'VIN Number',
          required: false,
          display: { placeholder: 'Vehicle identification number', order: 10 },
          validations: { maxLength: 17 },
        },
      },
      {
        field: 'isActive',
        override: {
          label: 'Active Driver',
          type: 'boolean',
          defaultValue: true,
          display: { order: 11 },
        },
      },
      {
        field: 'notes',
        override: {
          field: 'driverNotes',
          label: 'Driver Notes',
          display: { order: 12 },
        },
      },
    ],
  },
];
