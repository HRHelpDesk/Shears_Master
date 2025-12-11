export const shearUser = {
  fields: [
    /* --------------------------------------------------------
       IDENTITY + LOGIN
    -------------------------------------------------------- */
    {
      field: "firstName",
      type: "string",
      input: "text",
      fullWidth: false,
      label: "First Name",
      required: true,
      displayInRegistration: true,
      display: { order: 1 }
    },
    {
      field: "lastName",
      type: "string",
      input: "text",
      fullWidth: false,
      label: "Last Name",
      required: true,
      displayInRegistration: true,
      display: { order: 2 }
    },
    {
      field: "email",
      type: "string",
      input: "email",
      fullWidth: true,
      label: "Email",
      required: true,
      validations: { lowercase: true },
      displayInRegistration: true,
      display: { order: 3 }
    },
    {
      field: "password",
      type: "string",
      input: "password",
      fullWidth: false,
      label: "Password",
      required: true,
      displayInRegistration: true,
      display: { order: 4 }
    },
    {
      field: "phone",
      type: "string",
      input: "phone",
      fullWidth: true,
      label: "Phone Number",
      required: false,
      displayInRegistration: true,
      display: { order: 5 }
    },
    {
      field: "avatar",
      type: "image",
      input: "file",
      fullWidth: false,
      label: "Profile Image",
      required: false,
      displayInList: false,
      displayInRegistration: false,
      inputConfig: {
        accept: "image/png,image/jpeg",
        maxPhotos: 1,
      }
    },

    /* --------------------------------------------------------
       ROLE / USER TYPE
    -------------------------------------------------------- */
    {
      field: "role",
      type: "string",
      input: "select",
      fullWidth: false,
      label: "Role",
      required: true,
      enum: ["owner", "barber", "stylist", "manager"],
      default: "owner",
      displayInRegistration: false,
      display: { order: 6 }
    },

    /* --------------------------------------------------------
       BUSINESS INFORMATION
    -------------------------------------------------------- */
    {
      field: "businessName",
      type: "string",
      input: "text",
      fullWidth: true,
      label: "Business Name",
      required: false,
      displayInRegistration: true,
      display: { order: 7 }
    },
    {
      field: "businessWebsite",
      type: "string",
      input: "text",
      fullWidth: false,
      label: "Business Website",
      required: false,
      displayInRegistration: false,
      display: { order: 8 }
    },
    {
      field: "businessAddress",
      type: "object",
      input: "object",
      fullWidth: false,
      label: "Business Address",
      displayInRegistration: true,
      required: false,
      objectConfig: [
        { field: "street1", type: "string", label: "Street 1" },
        { field: "street2", type: "string", label: "Street 2" },
        { field: "city", type: "string", label: "City" },
        { field: "state", type: "string", label: "State" },
        { field: "postalCode", type: "string", label: "Postal Code" },
        { field: "country", type: "string", label: "Country", default: "US" }
      ],
      display: { order: 9 }
    },

    /* --------------------------------------------------------
       STRIPE REGISTRATION + BILLING (🔥 CONSOLIDATED)
       Controls:
       - whether Register.jsx shows PaymentElement
       - stores all Stripe data after registration
    -------------------------------------------------------- */
    {
      field: "stripe",
      type: "object",
      input: "object",
      fullWidth: true,
      label: "Stripe",
      displayInRegistration: false,       // Controls whether payment is required at signup
      required: false,
      objectConfig: [
        // Registration-time control
        {
          field: "enabled",
          type: "boolean",
          input: "switch",
          label: "Enable Payment at Registration",
          default: false   // 🔥 You toggle this per app to show/hide payment
        },

        // Saved details from Stripe after registration
        {
          field: "customerId",
          type: "string",
          input: "text",
          label: "Stripe Customer ID",
          default: "",
          displayInRegistration: false
        },
        {
          field: "subscriptionId",
          type: "string",
          input: "text",
          label: "Stripe Subscription ID",
          default: "",
          displayInRegistration: false
        },
        {
          field: "paymentMethodId",
          type: "string",
          input: "text",
          label: "Stripe Payment Method ID",
          default: "",
          displayInRegistration: false
        },
        {
          field: "renewalDate",
          type: "date",
          input: "date",
          label: "Renewal Date",
          default: "",
          displayInRegistration: false
        },

        // Terminal
        {
          field: "terminalAccountId",
          type: "string",
          input: "text",
          label: "Terminal Account ID",
          default: "",
          displayInRegistration: false
        },
        {
          field: "connected",
          type: "boolean",
          input: "switch",
          label: "Stripe Connected",
          default: false,
          displayInRegistration: false
        }
      ],
      display: { order: 10 }
    },

    /* --------------------------------------------------------
       MEMBERSHIP (🔥 CONSOLIDATED)
    -------------------------------------------------------- */
    {
      field: "membership",
      type: "object",
      input: "object",
      fullWidth: true,
      label: "Membership",
      displayInRegistration: false,
      required: false,
      objectConfig: [
        {
          field: "plan",
          type: "string",
          input: "select",
          label: "Plan",
          enum: ["solo", "team5", "team10", "enterprise"],
          default: "solo"
        },
        {
          field: "seatLimit",
          type: "number",
          input: "number",
          label: "Seat Limit",
          default: 1
        },
        {
          field: "status",
          type: "string",
          input: "select",
          label: "Status",
          enum: ["active", "past_due", "canceled", "trialing"],
          default: "active"
        }
      ],
      display: { order: 11 }
    },

    /* --------------------------------------------------------
       LOCATIONS / MULTI-LOCATION SUPPORT
    -------------------------------------------------------- */
    {
      field: "locations",
      type: "array",
      input: "array",
      fullWidth: false,
      label: "Locations",
      displayInRegistration: false,
      required: false,
      arrayConfig: {
        minItems: 0,
        object: [
          { field: "name", type: "string", label: "Location Name" },
          { field: "phone", type: "string", label: "Phone" },
          { field: "timezone", type: "string", label: "Timezone", default: "America/Chicago" },
          {
            field: "address",
            label: "Address",
            type: "object",
            objectConfig: [
              { field: "street1", type: "string" },
              { field: "street2", type: "string" },
              { field: "city", type: "string" },
              { field: "state", type: "string" },
              { field: "postalCode", type: "string" },
              { field: "country", type: "string", default: "US" }
            ]
          }
        ]
      }
    },

    {
      field: "defaultLocationId",
      type: "string",
      input: "select",
      fullWidth: false,
      label: "Default Location",
      displayInRegistration: false
    },

    /* --------------------------------------------------------
       USER PREFERENCES
    -------------------------------------------------------- */
    {
      field: "preferences",
      type: "object",
      input: "object",
      fullWidth: false,
      label: "Preferences",
      displayInRegistration: false,
      objectConfig: [
        {
          field: "emailNotifications",
          type: "boolean",
          input: "switch",
          label: "Email Notifications",
          default: true
        },
        {
          field: "pushNotifications",
          type: "boolean",
          input: "switch",
          label: "Push Notifications",
          default: true
        },
        {
          field: "venmoQR",
          type: "string",
          input: "text",
          label: "Venmo QR",
          default: ""
        },
        {
          field: "cashappQR",
          type: "string",
          input: "text",
          label: "CashApp QR",
          default: ""
        }
      ]
    }
  ]
};
