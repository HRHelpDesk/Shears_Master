import { firstLineSettings } from "./settings";
import { CalendarList, CalendarMonthView, CalendarToday } from "../../view-schema/calendar-view";
import { JobsList, JobsKanban } from "./views/jobs-view";
import { ProfileView } from "../../view-schema/profile-view";
import { firstLineUser } from "./firstLine-user";
import { firstLineWhitelabels } from "./firstLine-whitelabels";

export const FirstLine = [
  {
    appName: 'firstline',
    whiteLabels: firstLineWhitelabels,
    displayName: '1st Line Services',
    defaultWhiteLabel: 'firstline',
    user: firstLineUser,

    /* ===========================================================
       MAIN NAVIGATION
    ============================================================ */
    mainNavigation: [

      /* ----------------------------------------------------------
         JOBS
      ---------------------------------------------------------- */
      {
        name: 'Jobs',
        recordType: 'jobs',
        permissions: ['owner', 'admin', 'driver'],
        displayName: 'Jobs',
        icon: { 
          ios: 'briefcase.fill', 
          android: 'briefcase', 
          web: 'fa fa-truck-loading' 
        },

        views: [JobsList, JobsKanban],

        fields: [
          {
            field: 'name',
            override: {
              field: 'jobName',
              label: 'Job Name',
              required: true,
              display: { placeholder: 'Enter job name', order: 1 },
              validations: { minLength: 2, maxLength: 100 },
            },
          },
          {
            field: 'linkField',
            override: {
              field: 'assignedDriver',
              label: 'Assigned Driver',
              type: 'object',
              required: false,
              inputConfig: {
                recordType: 'drivers',
                searchField: 'firstName',
              },
              display: { order: 2 },
            },
          },
          {
            field: 'address',
            override: {
              field: 'originAddress',
              label: 'From (Origin)',
              type: 'object',
              input: 'object',
              required: true,
              display: { order: 3 },
            },
          },
          {
            field: 'address',
            override: {
              field: 'destinationAddress',
              label: 'To (Destination)',
              type: 'object',
              input: 'object',
              required: true,
              display: { order: 4 },
            },
          },
          {
            field: 'name',
            override: {
              field: 'cargoDescription',
              label: 'What are you hauling?',
              required: true,
              display: { placeholder: 'Describe the cargo', order: 5 },
              validations: { minLength: 2, maxLength: 200 },
            },
          },
          {
            field: 'name',
            override: {
              field: 'weight',
              label: 'Cargo Weight (lbs)',
              required: false,
              display: { placeholder: 'Enter weight in pounds', order: 6 },
            },
          },
          {
            field: 'date',
            override: {
              field: 'pickupDate',
              label: 'Pickup Date',
              type: 'string',
              required: true,
              displayInList: true,
              display: { order: 7 },
            },
          },
          {
            field: 'time',
            override: {
              field: 'pickupTime',
              label: 'Pickup Time',
              type: 'object',
              required: false,
              display: { order: 8 },
            },
          },
          {
            field: 'date',
            override: {
              field: 'deliveryDate',
              label: 'Expected Delivery Date',
              type: 'string',
              required: false,
              displayInList: true,
              display: { order: 9 },
            },
          },
          {
            field: 'time',
            override: {
              field: 'deliveryTime',
              label: 'Expected Delivery Time',
              type: 'object',
              required: false,
              display: { order: 10 },
            },
          },
          {
            field: 'category',
            override: {
              field: 'jobStatus',
              label: 'Job Status',
              inputConfig: {
                options: ['Pending', 'Assigned', 'In Transit', 'Delivered', 'Cancelled'],
                defaultValue: 'Pending',
              },
              display: { order: 11 },
            },
          },
          {
            field: 'isActive',
            override: {
              field: 'active',
              label: 'Active Job',
              type: 'boolean',
              defaultValue: true,
              display: { order: 12 },
            },
          },
          {
            field: 'image',
            override: {
              field: 'jobImages',
              displayInList: false,
              label: 'Job Images',
              display: { order: 13 },
              inputConfig: {
                maxSizeMB: 10,
                accept: "image/png,image/jpeg",
                maxPhotos: 5,
              }
            },
          },
          {
            field: 'notes',
            override: {
              field: 'jobNotes',
              label: 'Job Notes',
              display: { order: 14 },
            },
          },
          {
            field: 'price',
            override: {
              field: 'paymentAmount',
              label: 'Payment Amount',
              required: false,
              inputConfig: { prefix: '$', step: 0.01 },
              display: { order: 15 },
            },
          },
          {
            field: 'category',
            override: {
              field: 'paymentStatus',
              label: 'Payment Status',
              inputConfig: {
                options: ['Unpaid', 'Partial', 'Paid'],
                defaultValue: 'Unpaid',
              },
              display: { order: 16 },
            },
          },
        ],
      },

      /* ----------------------------------------------------------
         CALENDAR
      ---------------------------------------------------------- */
      {
        name: 'Calendar',
        recordType: 'jobs',  // Calendar displays jobs by date
        permissions: ['owner', 'admin', 'driver'],
        displayName: 'Calendar',
        icon: { 
          ios: 'calendar', 
          android: 'calendar-today', 
          web: 'fa fa-calendar-alt' 
        },

        views: [CalendarMonthView, CalendarList, CalendarToday],

        fields: [
          {
            field: 'linkField',
            override: {
              field: 'job',
              label: 'Job',
              type: 'object',
              inputConfig: {
                recordType: 'jobs',
                searchField: 'jobName',
              },
              display: { order: 1 },
            },
          },
          {
            field: 'date',
            override: {
              type: 'string',
              required: true,
              display: { order: 2 },
              arrayConfig: { minItems: 1 },
            },
          },
          {
            field: 'notes',
            override: {
              field: 'calendarNotes',
              label: 'Calendar Notes',
              display: { order: 3 },
            },
          },
        ],
      },

      /* ----------------------------------------------------------
         PROFILE (NO RECORDTYPE — uses user object)
      ---------------------------------------------------------- */
      {
        name: 'Profile',
        recordType: 'user',
        displayName: 'Profile',
        icon: { 
          ios: 'person.crop.circle', 
          android: 'account-circle', 
          web: 'fa fa-user-circle' 
        },
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
              field: 'jobSummary',
              label: 'Job Summary',
              displayInList: false,
              display: { order: 2 },
            },
          },
          {
            field: 'earnings',
            override: {
              field: 'userEarnings',
              label: 'Earnings',
              displayInList: false,
              display: { order: 3 },
            },
          },
        ],
      },

    ],

    /* ===========================================================
       SUB NAVIGATION
    ============================================================ */
    subNavigation: [
      // Reserved for future expansion
      // Could include: Maintenance, Reports, Documents, etc.
    ],

    /* ===========================================================
       SETTINGS
    ============================================================ */
    settings: [firstLineSettings],

    /* ===========================================================
       DEFAULT ROUTE
    ============================================================ */
    defaultRoute: (user) => {
      // Drivers default to Jobs, admins default to Jobs
      return user.role === 'driver' ? 'Jobs' : 'Jobs';
    },
  },
];
