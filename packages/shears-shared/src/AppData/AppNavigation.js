// app-data.js
import { CalendarList, CalendarMonthView, CalendarRoute } from './view-schema/calendar-view.js';
import { ContactView } from './view-schema/contacts-view.js';
import { ServicesList } from './view-schema/services-view.js';
import { shearWhitelabels } from './whitelabels/shear.js';
import { splashWhitelabels } from './whitelabels/splash.js';

export const AppData = [
  {
    appName: 'shear',
    whiteLabels: shearWhitelabels,
    defaultWhiteLabel: 'shear',
    mainNavigation: [
      

      {
        name: 'Calendar',
        displayName: 'Schedule',
        icon: { ios: 'calendar', android: 'calendar-today', web: 'fa fa-calendar-alt' },
        fields: [],
        views: [CalendarMonthView, CalendarList],
      },
      {
        name: 'Contacts',
        displayName: 'Clients',
        icon: { ios: 'person.2.fill', android: 'contacts', web: 'fa fa-address-book' },
        fields: [
          { field: 'firstName' },
          { field: 'lastName' },
          {
            field: 'email',
            override: {
              required: true, // Require at least one email
              display: { order: 4 },
              arrayConfig: { minItems: 1 }, // Enforce at least one email
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
            field: 'address',
            override: {
              required: true, // Require at least one phone number
              display: { order: 5 },
              arrayConfig: { minItems: 0 }, // Enforce at least one phone
            },
          },
        ],
        views: [ContactView],
      },
      {
        name: 'Transactions',
        displayName: 'Transactions',
        icon: { ios: 'dollarsign.circle', android: 'currency-usd', web: 'fa fa-dollar-sign' },
        views: [],
        fields: [],
      },
      {
        name: 'Profile',
        displayName: 'Profile',
        icon: { ios: 'person.crop.circle', android: 'account-circle', web: 'fa fa-user-circle' },
        views: [],
        fields: [],
      },
      {
  name: 'Services',
  displayName: 'Services',
  icon: { ios: 'scissors', android: 'content-cut', web: 'fa fa-cut' },
  views: [ServicesList],
  fields: [
    {
      field: 'serviceName',
      override: {
        required: true,
        display: { order: 1 },
      },
    },
    {
      field: 'description',
      override: {
        required: false,
        display: { order: 2 },
      },
    },
    {
      field: 'price',
      override: {
        required: true,
        display: { order: 3 },
      },
    },
    {
      field: 'duration',
      override: {
        required: true,
        display: { order: 4 },
        arrayConfig: { minItems: 1 },
      },
    },
    {
      field: 'category',
      override: {
        required: true,
        display: { order: 5 },
      },
    },
  ],
},
    ],
    defaultRoute: 'Contacts',
    subNavigation: ['checklist', 'profile', 'settings', 'help'],
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
    subNavigation: ['routes', 'checklist', 'profile', 'settings', 'help'],
  },
];