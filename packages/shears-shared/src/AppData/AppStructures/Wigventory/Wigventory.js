import { ProfileView } from "../../view-schema/profile-view";
import { WigView } from "./views/wigs";
import { MaintenanceLogView } from "./views/wigs";
import { DashboardView } from "./views/dashboard";
// import { SettingsView } from "./views/settings";

/* ============================================
   WHITELABEL THEME (Your Glam Style)
============================================ */
const wigventoryWhitelabels = [
  {
    whiteLabel: "wigventory",
    app: "wigventory",
    themeColors: {
      light: {
        primary: "#B43361",
        secondary: "#F3D4D4",
        accent: "#E45A89",

        background: "#FFFFFF",
        surface: "#FDF8F9",
        surfaceVariant: "#F7EDEF",

        text: "#121212",
        textSecondary: "#6B5560",
        textLight: "#B0899A",

        primaryContainer: "#F3D4D4",
        secondaryContainer: "#FDECF0",

        border: "#E7D4DA",
        borderLight: "#F4E4E8",

        error: "#EF4444",
        onPrimary: "#FFFFFF",
        onSecondary: "#121212",
        onSurface: "#121212",

        inputBackground: "#FFFFFF",
        inputBorder: "#E7D4DA",
        inputFocusBorder: "#B43361",
      },

      dark: {
        primary: "#E45A89",
        secondary: "#B43361",
        accent: "#F3D4D4",

        background: "#121212",
        surface: "#1E1E1E",
        surfaceVariant: "#2A2A2A",

        text: "#FFFFFF",
        textSecondary: "#DDBBC8",
        textLight: "#A78D96",

        primaryContainer: "#3A1A27",
        secondaryContainer: "#5C2B3E",

        border: "#3C3C3C",
        borderLight: "#2A2A2A",

        error: "#F87171",
        onPrimary: "#121212",
        onSecondary: "#FFFFFF",
        onSurface: "#FFFFFF",

        inputBackground: "#1E1E1E",
        inputBorder: "#3C3C3C",
        inputFocusBorder: "#E45A89",
      },

      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
      radius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
    },
  },
];

/* ===========================================================
   NEW FIELDS BASED ON QUESTIONNAIRE
=========================================================== */

const wigFields = [
  {
    field: "image",
    override: {
      field: "wigPhotos",
      label: "Wig Photos",
      required: false,
      displayInList: false,
      inputConfig: {
        maxSizeMB: 5,
        maxPhotos: 3,
        accept: "image/png,image/jpeg",
      },
      display: { order: 1 },
    },
  },

  {
    field: "name",
    override: {
      field: "wigName",
      label: "Wig Name",
      required: true,
      display: { placeholder: "Ex: Body Wave 28”", order: 2 },
    },
  },

  {
    field: "string",
    override: {
      field: "brand",
      label: "Brand",
      required: false,
      input: "string",
      display: { order: 3 },
    },
  },

  {
    field: "string",
    override: {
      field: "barcode",
      label: "Barcode / QR Code",
      required: false,
      input: "string",
      display: { order: 4 },
    },
  },

  {
    field: "multiSelect",
    override: {
      field: "categories",
      label: "Categories",
      input: "select",
      inputConfig: {
        options: [
          "Lace Front",
          "Mono",
          "Basic Cap",
          "Pixie",
          "8\"",
          "10\"",
          "12\"",
          "14\"",
          "16\"",
          "18\"",
          "20\"",
          "22\"",
          "24\"",
          "26\"",
          "30\""
        ],
        allowCustom: true,
      },
      display: { order: 5 },
    },
  },

  {
    field: "string",
    override: {
      field: "length",
      label: "Length",
      required: false,
      display: { placeholder: "Ex: 28 inches", order: 6 },
    },
  },

  {
    field: "string",
    override: {
      field: "color",
      label: "Color",
      required: false,
      display: { placeholder: "Ex: Natural Black", order: 7 },
    },
  },

  {
    field: "string",
    override: {
      field: "texture",
      label: "Texture",
      required: false,
      display: { placeholder: "Ex: Body Wave, Straight", order: 8 },
    },
  },

  {
    field: "string",
    override: {
      field: "density",
      label: "Density",
      required: false,
      display: { placeholder: "Ex: 150%, 180%", order: 9 },
    },
  },

  {
    field: "array",
    override: {
      field: "tags",
      label: "Tags",
      input: "array",
      display: { order: 10 },
    },
  },

  {
    field: "notes",
    override: {
      field: "notes",
      label: "Notes",
      required: false,
      display: { order: 11 },
    },
  },
];

/* ===========================================================
   MAINTENANCE LOG FIELDS
=========================================================== */

const maintenanceFields = [
  {
    field: "date",
    override: {
      field: "lastWornDate",
      label: "Last Worn Date",
      type: "string",
      display: { order: 1 },
    },
  },
  {
    field: "date",
    override: {
      field: "dateWashed",
      label: "Date Washed",
      display: { order: 2 },
    },
  },
  {
    field: "date",
    override: {
      field: "dateStyled",
      label: "Date Re-Styled",
      display: { order: 3 },
    },
  },
  {
    field: "number",
    override: {
      field: "hoursWorn",
      label: "Approx. Hours Worn",
      inputConfig: { step: 1 },
      display: { order: 4 },
    },
  },
];

/* ===========================================================
   PROFILE FIELDS
=========================================================== */
const profileFields = [
  {
    field: "image",
    override: {
      field: "avatar",
      label: "Profile Photo",
      displayInList: false,
      inputConfig: {
        maxSizeMB: 5,
        accept: "image/png,image/jpeg",
        maxPhotos: 1,
      },
      display: { order: 1 },
    },
  },
  {
    field: "name",
    override: {
      field: "firstName",
      label: "First Name",
      required: true,
      display: { order: 2 },
    },
  },
  {
    field: "name",
    override: {
      field: "lastName",
      label: "Last Name",
      required: true,
      display: { order: 3 },
    },
  },
  {
    field: "email",
    override: {
      field: "email",
      label: "Email",
      required: true,
      display: { order: 4 },
    },
  },
];

/* ===========================================================
   FINAL APPDATA
=========================================================== */

export const Wigventory = [
  {
    appName: "wigventory",
    whiteLabels: wigventoryWhitelabels,
    defaultWhiteLabel: "wigventory",

    /* ------------------------------------------------------
       MAIN NAVIGATION (Based on questionnaire)
    ------------------------------------------------------- */
    mainNavigation: [
      
    ],

    /* ------------------------------------------------------
       SUBNAV: Not needed for MVP, but available
    ------------------------------------------------------- */
    subNavigation: [
      {
        name: "Dashboard",
        displayName: "Dashboard",
        icon: { ios: "chart.bar", android: "chart-bar", web: "fa fa-chart-bar" },
        views: [DashboardView],
        fields: [], // Dashboard doesn't need fields
      },

      {
        name: "Wigs",
        displayName: "My Wigs",
        icon: { ios: "scissors", android: "content-cut", web: "fa fa-scissors" },
        fields: wigFields,
        views: [WigView],
      },

      {
        name: "Maintenance",
        displayName: "Maintenance Log",
        icon: { ios: "wrench.and.screwdriver", android: "tools", web: "fa fa-tools" },
        fields: maintenanceFields,
        views: [MaintenanceLogView],
      },

      {
        name: "Profile",
        displayName: "Profile",
        icon: { ios: "person.crop.circle", android: "account-circle", web: "fa fa-user-circle" },
        fields: profileFields,
        views: [ProfileView],
      },
    ],

    /* ------------------------------------------------------
       SETTINGS
    ------------------------------------------------------- */
    settings: [
      // {
      //   name: "DeleteAccount",
      //   displayName: "Delete Account",
      //   icon: { ios: "trash", android: "trash-can", web: "fa fa-trash" },
      //   views: [SettingsView],
      //   fields: [],
      // },
    ],

    defaultRoute: "Dashboard",
  },
];
