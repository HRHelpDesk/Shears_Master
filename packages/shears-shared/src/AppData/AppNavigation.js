// app-data.js
import { CalendarList, CalendarMonthView, CalendarRoute } from './view-schema/calendar-view.js';
import { ContactView } from './view-schema/contacts-view.js';
import { ProfileView } from './view-schema/profile-view.js';
import { InventoryList } from './view-schema/inventory-view.js';
import { ServicesList } from './view-schema/services-view.js';
import { shearWhitelabels } from './whitelabels/shear.js';
import { splashWhitelabels } from './whitelabels/splash.js';
import { shearSettings } from './settings.js';
import { StripeCheckout, StripeTerminal } from './view-schema/stripe-setup-view.js';
export const AppData = [
  {
    appName: 'shear',
    whiteLabels: shearWhitelabels,
    defaultWhiteLabel: 'shear',
    mainNavigation: [
      

      {
        name: 'Calendar',
        permissions: ['owner', 'admin', 'barber', 'stylist'], 
        displayName: 'Appoinments',
        icon: { ios: 'calendar', android: 'calendar-today', web: 'fa fa-calendar-alt' },
        fields: [
              {
                field: 'linkField', // reference the generic base field
                override: {
                  field: 'contact',        // actual key in the formValues
                  label: 'Client',         // custom label for this usage
                  type: 'object', // optional explicit
                  inputConfig: {
                    recordType: 'contacts', // optional override
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
                  type: 'array', // optional explicit

                  inputConfig: {
                    recordType: 'services',
                    searchField: 'serviceName',
                  },
                  display: { order: 2 },
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
               
                  type:'string',
                  required: true,
                  display: { order: 4 },
                  arrayConfig: { minItems: 1 },
                },
              },
               {
                field: 'duration',
                override: {
                  required: true,
                 
                  type:'object',
                  display: { order: 3 },
                  arrayConfig: { minItems: 1 },
                },
              },
              
              {
                field: 'time',
                override: {
                  required: true,
              
                  type:'object',
                  display: { order: 5 },
                  arrayConfig: { minItems: 1 },
                },
              },
              {
                field: 'notes', // reference the generic notes field
                override: {
                  field: 'appointmentNotes',
                  label: 'Appointment Notes',
                  display: { order: 6 },
                },
              },
              // Client Notes
              {
                field: 'notes', // reference the same generic notes field
                override: {
                  field: 'clientNotes',
                  label: 'Client Notes',
                  display: { order: 7 },
                },
              },

            ],

        views: [CalendarMonthView, CalendarList],
      },
      {
        name: 'Contacts',
        permissions: ['owner', 'admin', 'barber', 'stylist'], 
        actions:['phone'],
        displayName: 'Clients',
        icon: { ios: 'person.2.fill', android: 'contacts', web: 'fa fa-address-book' },
        fields: [
          {
              field: 'name', // refers to base field in SharedNameFields
              override: {
                field: 'firstName', // ← This changes the actual output key
                label: 'First Name',
                display: { placeholder: 'Enter first name', order: 1 },
                required: true,
                validations: {
                  minLength: 2,
                  maxLength: 50,
                },
              },
            },
            {
              field: 'name', // same base field!
              override: {
                field: 'lastName', // ← This becomes the real field name
                label: 'Last Name',
                display: { placeholder: 'Enter last name', order: 2 },
                required: true,
                validations: {
                  minLength: 2,
                  maxLength: 50,
                },
              },
            },
            {
            field: 'phone',
            override: {
              required: true, // Require at least one phone number
              display: { order: 3 },
              arrayConfig: { minItems: 1 }, // Enforce at least one phone
            },
          },
          {
            field: 'email',
            override: {
              required: true, // Require at least one email
              display: { order: 4 },
              arrayConfig: { minItems: 1 }, // Enforce at least one email
            },
          },
          
         {
        field: 'address',
        override: {
          type: 'array',                 // ✅ Add this
          input: 'array',                // ✅ Optional but recommended
          required: true,
          
          display: { order: 5 },
          arrayConfig: {
            minItems: 1,
          },
        },
      },

        ],
        views: [ContactView],
      },
      {
        name: 'Transactions',
        permissions: ['owner', 'admin', 'barber', 'stylist'], 
        displayName: 'Transactions',
        icon: { ios: 'dollarsign.circle', android: 'currency-usd', web: 'fa fa-dollar-sign' },
        views: [StripeCheckout, StripeTerminal],
        fields: [],
      },
      {
        name: 'Profile',
        displayName: 'Profile',
        icon: { ios: 'person.crop.circle', android: 'account-circle', web: 'fa fa-user-circle' },

        views: [ProfileView],
        fields: [
              {
      field: 'avatar',
      override: {
        field: 'userAvatar',
        displayInList: false,
        label: 'Avatar',
        display: { order: 11 },
      },
    },
    {
      field: 'earnings',
      override: {
        field: 'userEarnings',
        displayInList: false,
        label: 'Earnings',
        display: { order: 11 },
      },
    },
        ],
      },
      
    ],
    defaultRoute: 'Contacts',
    subNavigation: [{
        name: 'Inventory',
        displayName: 'Inventory',
        permissions: ['owner', 'admin', 'barber', 'stylist'], 
        icon: { ios: 'cube.box.fill', android: 'truck', web: 'fa fa-box' },
        views: [InventoryList],
        fields: [{
                field: 'linkField', // reference the generic base field
                override: {
                  field: 'product',        // actual key in the formValues
                  label: 'Product',         // custom label for this usage
                  type: 'object', // optional explicit
                  inputConfig: {
                    recordType: 'products', // optional override
                    searchField: 'productName',
                  },
                  display: { order: 1 },
                },
              },
               {
              field: 'name', // refers to base field in SharedNameFields
              override: {
                field: 'quantityInStock', // ← This changes the actual output key
                label: 'Quantity In Stock',
                required: true,
                
              },
              
            },
               {
              field: 'name', // refers to base field in SharedNameFields
              override: {
               field: 'reorderLevel', 
                label: 'Reorder Level',
                required: true,
                
              },
            },
            {
              field: 'name', // refers to base field in SharedNameFields
              override: {
              field: 'reorderQuantity',
               label: 'Reorder Quantity',
                required: true,
                
              },
            },
             {
              field: 'address', // refers to base field in SharedNameFields
              override: {
                type:'object',
                input:'object',
                field: 'location',
              label: 'Storage Location',
                required: true,
                
              },
            },
            ],
      }],
    settings: [shearSettings],
  },
  {
    appName: 'splash',
    whiteLabels: splashWhitelabels,
    defaultWhiteLabel: 'splash',
    mainNavigation: [
      {
        name: 'Dashboard',
        displayName: 'Dashboard',
        icon: { ios: 'speedometer', android: 'dashboard', web: 'fa fa-tachometer-alt' },
        views: [],
        fields: [],
      },
      {
        name: 'Calendar',
        displayName: 'Calendar',
        icon: { ios: 'calendar', android: 'calendar-today', web: 'fa fa-calendar-alt' },
        fields: [],
        views: [CalendarMonthView, CalendarList, CalendarRoute],
      },
      {
        name: 'Contacts',
        displayName: 'Contacts',
        icon: { ios: 'person.2.fill', android: 'contacts', web: 'fa fa-address-book' },
        fields: [
          { field: 'firstName' },
          { field: 'lastName' },
          {
            field: 'email',
            override: {
              label: 'Contact Emails', // Customize label for splash
              display: { order: 3 },
            },
          },
          {
            field: 'phone',
            override: {
              display: { order: 4 },
              arrayConfig: {
                object: [
                  { field: 'label', inputConfig: { options: ['Mobile', 'Office', 'Other'] } }, // Different label options
                  { field: 'value' }, // Inherit default phoneNumber input
                ],
              },
            },
          },
        ],
        views: [], // No views for splash Contacts
      },
      {
        name: 'Quotes',
        displayName: 'Quotes',
        icon: { ios: 'document', android: 'attach-money', web: 'fa fa-dollar-sign' },
        fields: [],
        views: [],
      },
    ],
    defaultRoute: 'Dashboard',

    subNavigation: [],
  },
];