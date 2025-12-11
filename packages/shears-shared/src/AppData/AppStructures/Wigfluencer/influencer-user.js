export const influencerUser = {
  fields: [
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
      enum: ["admin", "influencer"],
      default: "influencer",
      displayInRegistration: false,
      display: { order: 5 }
    },

    /* --------------------------------------------------------
       INFLUENCER ADDITIONAL FIELDS
    -------------------------------------------------------- */
    {
      field: "discountCode",
      type: "string",
      label: "Discount Code",
      required: false,
      displayInRegistration: false,
      display: { order: 6 }
    },
    {
      field: "socialHandle",
      type: "string",
      label: "Social Handle",
      required: false,
      displayInRegistration: true,
      display: { order: 7 }
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
      display: { order: 8 }
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
        }
      ],
      displayInRegistration: false,
      display: { order: 9 }
    }
  ]
};
