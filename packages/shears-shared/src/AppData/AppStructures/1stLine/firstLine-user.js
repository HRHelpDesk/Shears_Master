export const firstLineUser = {
  fields: [
    /* --------------------------------------------------------
       IDENTITY + LOGIN
    -------------------------------------------------------- */
    {
      field: "firstName",
      type: "string",
      input: "text",
      label: "First Name",
      required: true,
      displayInRegistration: true,
      display: { order: 1 }
    },
    {
      field: "lastName",
      type: "string",
      input: "text",
      label: "Last Name",
      required: true,
      displayInRegistration: true,
      display: { order: 2 }
    },
    {
      field: "email",
      type: "string",
      input: "email",
      label: "Email",
      validations: { lowercase: true },
      required: true,
      displayInRegistration: true,
      display: { order: 3 }
    },
    {
      field: "password",
      type: "string",
      input: "password",
      label: "Password",
      required: true,
      displayInRegistration: true,
      display: { order: 4 }
    },

    /* --------------------------------------------------------
       ROLE
    -------------------------------------------------------- */
    {
      field: "role",
      type: "string",
      input: "select",
      label: "Role",
      required: true,
      enum: ["owner", "admin", "driver"],
      default: "driver",
      displayInRegistration: false,
      display: { order: 5 }
    },

    /* --------------------------------------------------------
       CONTACT
    -------------------------------------------------------- */
    {
      field: "phone",
      type: "string",
      input: "phone",
      label: "Phone Number",
      required: true,
      displayInRegistration: true,
      display: { order: 6 }
    },

    /* --------------------------------------------------------
       DRIVER-SPECIFIC FIELDS
    -------------------------------------------------------- */
    {
      field: "licenseNumber",
      type: "string",
      input: "text",
      label: "CDL License Number",
      required: false,
      displayInRegistration: false,
      display: { order: 7 }
    },
    {
      field: "licenseExpiration",
      type: "string",
      input: "date",
      label: "License Expiration Date",
      required: false,
      displayInRegistration: false,
      display: { order: 8 }
    },
    {
      field: "truckNumber",
      type: "string",
      input: "text",
      label: "Assigned Truck Number",
      required: false,
      displayInRegistration: false,
      display: { order: 9 }
    },

    /* --------------------------------------------------------
       PROFILE IMAGE
    -------------------------------------------------------- */
    {
      field: "avatar",
      type: "image",
      input: "file",
      label: "Profile Image",
      inputConfig: { accept: "image/png,image/jpeg", maxPhotos: 1 },
      displayInRegistration: false,
      display: { order: 10 }
    },

    /* --------------------------------------------------------
       PREFERENCES
    -------------------------------------------------------- */
    {
      field: "preferences",
      type: "object",
      input: "object",
      label: "Preferences",
      objectConfig: [
        {
          field: "emailNotifications",
          type: "boolean",
          input: "switch",
          label: "Email Notifications",
          default: true
        },
        {
          field: "smsNotifications",
          type: "boolean",
          input: "switch",
          label: "SMS Notifications",
          default: true
        },
        {
          field: "jobAlerts",
          type: "boolean",
          input: "switch",
          label: "Job Assignment Alerts",
          default: true
        }
      ],
      displayInRegistration: false,
      display: { order: 11 }
    }
  ]
};