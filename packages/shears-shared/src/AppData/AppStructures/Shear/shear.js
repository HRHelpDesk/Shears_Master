import { shearSettings } from "./settings";
import { CalendarList, CalendarMonthView, CalendarToday } from "../../view-schema/calendar-view";
import { ContactView } from "../../view-schema/contacts-view";
import { ProfileView } from "../../view-schema/profile-view";
import { InventoryList } from "../../view-schema/inventory-view";
import { StripeCheckout, StripeTerminal, TransactionList } from "../../view-schema/stripe-setup-view";
import { shearWhitelabels } from "./shear-white-labels";
import { shearUser } from "./shear-user";

export const Shear = [
  {
    appName: 'shear',
    whiteLabels: shearWhitelabels,
    defaultWhiteLabel: 'shear',
    user: shearUser,

    /* ===========================================================
       MAIN NAVIGATION
    ============================================================ */
    mainNavigation: [

      /* ----------------------------------------------------------
         APPOINTMENTS / CALENDAR
      ---------------------------------------------------------- */
      {
        name: 'Calendar',
        recordType: 'appointments',   // ⭐ ADDED
        permissions: ['owner', 'admin', 'barber', 'stylist'],
        displayName: 'Appointments',
        icon: { ios: 'calendar', android: 'calendar-today', web: 'fa fa-calendar-alt' },

        views: [CalendarMonthView, CalendarList, CalendarToday],

        fields: [
          {
            field: 'linkField',
            override: {
              field: 'contact',
              label: 'Client',
              type: 'object',
              inputConfig: {
                recordType: 'contacts',
                searchField: 'firstName',
              },
              display: { order: 1 },
            },
          },
          {
            field: 'linkField',
            override: {
              field: 'service',
              label: 'Service',
              type: 'array',
              inputConfig: {
                recordType: 'services',
                searchField: 'serviceName',
              },
              display: { order: 2 },
            },
          },
          {
            field: 'linkField',
            override: {
              field: 'product',
              label: 'Product',
              type: 'array',
              inputConfig: {
                recordType: 'products',
                searchField: 'productName',
              },
              display: { order: 3 },
            },
          },
          {
            field: 'payment',
            override: {
              label: 'Payment Information',
              required: false,
              display: { order: 6 },
            },
          },
          {
            field: 'date',
            override: {
              type: 'string',
              required: true,
              display: { order: 4 },
              arrayConfig: { minItems: 1 },
            },
          },
          {
            field: 'duration',
            override: {
              type: 'object',
              required: true,
              display: { order: 3 },
              arrayConfig: { minItems: 1 },
            },
          },
          {
            field: 'time',
            override: {
              type: 'object',
              required: true,
              display: { order: 5 },
              arrayConfig: { minItems: 1 },
            },
          },
          {
            field: 'notes',
            override: {
              field: 'appointmentNotes',
              label: 'Appointment Notes',
              display: { order: 6 },
            },
          },
          {
            field: 'notes',
            override: {
              field: 'clientNotes',
              label: 'Client Notes',
              display: { order: 7 },
            },
          },
        ],
      },

      /* ----------------------------------------------------------
         CONTACTS (CLIENTS)
      ---------------------------------------------------------- */
      {
        name: 'Contacts',
        recordType: 'contacts',   // ⭐ ADDED
        permissions: ['owner', 'admin', 'barber', 'stylist'],
        actions: ['phone'],
        displayName: 'Clients',
        icon: { ios: 'person.2.fill', android: 'contacts', web: 'fa fa-address-book' },

        views: [ContactView],

        fields: [
          {
            field: 'image',
            override: {
              field: 'avatar',
              displayInList: false,
              label: 'Customer Image',
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
            field: 'address',
            override: {
              type: 'array',
              input: 'array',
              required: true,
              display: { order: 5 },
              arrayConfig: { minItems: 1 },
            },
          },
        ],
      },

      /* ----------------------------------------------------------
         TRANSACTIONS
      ---------------------------------------------------------- */
      {
        name: 'Transactions',
        recordType: 'transactions',   // ⭐ ADDED
        permissions: ['owner', 'admin', 'barber', 'stylist'],
        displayName: 'Transactions',
        icon: { ios: 'dollarsign.circle', android: 'currency-usd', web: 'fa fa-dollar-sign' },

        views: [TransactionList, StripeCheckout, StripeTerminal],

        fields: [
          {
            field: "paymentName",
            override: {
              field: "paymentName",
              label: "Payment Name",
              required: true,
              input: "select",
              inputConfig: { options: ["Quick Pay", "Product", "Service"] },
              display: { order: 2 },
            },
          },
          {
            field: "id",
            override: {
              field: "transactionId",
              label: "Transaction ID",
              required: true,
              displayInList: true,
              display: { order: 2 },
            },
          },
          {
            field: "linkField",
            override: {
              field: "client",
              label: "Client",
              type: "object",
              required: true,
              inputConfig: {
                recordType: "contacts",
                searchField: "firstName",
              },
              display: { order: 1 },
            },
          },
          {
            field: "paymentType",
            override: {
              field: "paymentType",
              label: "Payment Type",
              required: true,
              input: "select",
              inputConfig: {
                options: ["Cash", "Credit", "Venmo", "Cash App"],
              },
              display: { order: 2 },
            },
          },
          {
            field: "currency",
            override: {
              field: "totalAmount",
              label: "Total Amount",
              required: true,
              input: "currency",
              display: { order: 5 },
            },
          },
          {
            field: "date",
            override: {
              field: "transactionDate",
              label: "Transaction Date",
              type: "string",
              required: true,
              displayInList: true,
              arrayConfig: { minItems: 1 },
              display: { order: 6 },
            },
          },
          {
            field: "name",
            override: {
              field: "sendReceipt",
              label: "Receipt Sent?",
              input: "select",
              inputConfig: { options: ["Yes", "No"] },
              display: { order: 7 },
            },
          },
          {
            field: "notes",
            override: {
              field: "notes",
              label: "Transaction Notes",
              display: { order: 8 },
            },
          },
          {
            field: "name",
            override: {
              field: "serviceItems",
              label: "Line Items",
              type: "array",
              input: "array",
              displayInList: false,
              display: { order: 9 },
              arrayConfig: {
                minItems: 0,
                object: [
                  { field: "description", label: "Description" },
                  { field: "qty", label: "Quantity", type: "number" },
                  { field: "price", label: "Price", type: "currency" },
                ],
              },
            },
          },
        ],
      },

      /* ----------------------------------------------------------
         PROFILE (NO RECORDTYPE — uses user object)
      ---------------------------------------------------------- */
      {
        name: 'Profile',
        recordType: 'user',   // ⭐ ADDED
        displayName: 'Profile',
        icon: { ios: 'person.crop.circle', android: 'account-circle', web: 'fa fa-user-circle' },
        views: [ProfileView],
        fields: [
          {
            field: 'avatar',
            override: {
              field: 'userAvatar',
              label: 'Avatar',
              displayInList: false,
              display: { order: 1 },
            },
          },
          {
            field: 'appointmentSummary',
            override: {
              field: 'appointmentSummary',
              label: 'Appointment Summary',
              displayInList: false,
              display: { order: 3 },
            },
          },
          {
            field: 'earnings',
            override: {
              field: 'userEarnings',
              label: 'Earnings',
              displayInList: false,
              display: { order: 2 },
            },
          },
        ],
      },

    ],

    /* ===========================================================
       SUB NAVIGATION
    ============================================================ */
    subNavigation: [
      {
        name: 'Inventory',
        recordType: 'inventory',   // ⭐ ADDED
        displayName: 'Inventory',
        permissions: ['owner', 'admin', 'barber', 'stylist'],
        icon: { ios: 'cube.box.fill', android: 'truck', web: 'fa fa-box' },
        views: [InventoryList],

        fields: [
          {
            field: 'linkField',
            override: {
              field: 'product',
              label: 'Product',
              type: 'object',
              inputConfig: {
                recordType: 'products',
                searchField: 'productName',
              },
              display: { order: 1 },
            },
          },
          {
            field: 'name',
            override: {
              field: 'quantityInStock',
              label: 'Quantity In Stock',
              required: true,
            },
          },
          {
            field: 'name',
            override: {
              field: 'reorderLevel',
              label: 'Reorder Level',
              required: true,
            },
          },
          {
            field: 'name',
            override: {
              field: 'reorderQuantity',
              label: 'Reorder Quantity',
              required: true,
            },
          },
          {
            field: 'address',
            override: {
              type: 'object',
              input: 'object',
              field: 'location',
              label: 'Storage Location',
              required: true,
            },
          },
        ],
      },
    ],

    /* ===========================================================
       SETTINGS
    ============================================================ */
    settings: [shearSettings],

    /* ===========================================================
       DEFAULT ROUTE
    ============================================================ */
    defaultRoute: 'Contacts',
  },
];
