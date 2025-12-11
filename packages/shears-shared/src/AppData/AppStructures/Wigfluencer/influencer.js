import { influencerUser } from "./influencer-user";
import { InfluencerSettings } from "./settings";

// Views
import { CalendarMonthView, CalendarToday } from "../../view-schema/calendar-view";
//import { InfluencerListView } from "../../view-schema/influencer-management-view";
//import { MessageBoardView } from "../../view-schema/message-board-view";
//import { NotificationCenterView } from "../../view-schema/notifications-view";
import { ProfileView } from "../../view-schema/profile-view";
import { influencerWhitelabels } from "./influencer-whitelabels";
import { AdminDashboardView, InfluencerDashboardView } from "../../view-schema/dashboard-view";
import { AnnouncementsInfluencer } from "./view-schema/Announcements";
import { RequestsAdminView, RequestsInfluencerView } from "./view-schema/Requests";
import { NotificationsView } from "./view-schema/Notifications";

// Main App Schema
export const InfluencerApp = [
{
  appName: "influencerapp",
  whiteLabels: influencerWhitelabels,
  defaultWhiteLabel: "influencerapp",
  user: influencerUser,

  /* -------------------------------------------------------------------
     📌 MAIN NAVIGATION (Role-Based Views)
  ------------------------------------------------------------------- */
  mainNavigation: [

    /* ----------------------------------------------------------
       🟦 ADMIN DASHBOARD
    ---------------------------------------------------------- */
    {
      name: "AdminDashboard",
      permissions: ["admin"],
      displayName: "Dashboard",
      recordType: "dashboard",
      icon: { ios: "rectangle.grid.2x2", android: "view-dashboard", web: "fa fa-th-large" },
      views: [AdminDashboardView],
      fields: [] // dashboard is data-only, no form fields
    },

    /* ----------------------------------------------------------
       🟪 INFLUENCER DASHBOARD
    ---------------------------------------------------------- */
    {
      name: "InfluencerDashboard",
      permissions: ["influencer"],
      displayName: "Dashboard",
      recordType: "dashboard",
      icon: { ios: "house.fill", android: "home", web: "fa fa-home" },
      views: [InfluencerDashboardView],
      fields: []
    },

    /* ----------------------------------------------------------
       🗓️ CALENDAR (Admin / Influencer split views)
    ---------------------------------------------------------- */
    {
      name: "Calendar",
      permissions: ["admin", "influencer"],
      displayName: "Calendar",
      recordType: "calendar",
      icon: { ios: "calendar", android: "calendar-month", web: "fa fa-calendar" },

      views: [
        CalendarMonthView,
        CalendarToday
        // CalendarAdminView,        // For admins: manage slots
        // CalendarSignupView,       // For influencers: sign up
        // CalendarMyScheduleView,   // For influencers: confirmed schedule
      ],

      /* Calendar Form Field Overrides */
      fields: [
        {
          field: "date",
          override: {
            label: "Date",
            type: "string",
            required: true,
            arrayConfig: { minItems: 1 },
            display: { order: 1 }
          }
        },
        {
          field: "time",
          override: {
            label: "Time Slot",
            type: "object",
            required: true,
            arrayConfig: { minItems: 1 },
            display: { order: 2 }
          }
        },
        {
          field: "linkField",
          override: {
            field: "assignedInfluencer",
            label: "Assigned Influencer",
            type: "object",
            inputConfig: {
              recordType: "users",
              searchField: "firstName",
              filter: { role: "influencer" }
            },
            display: { order: 3 }
          }
        },
        {
          field: "code",
          override: {
            field: "discountCode",
            label: "Discount Code",
            required: false,
            display: { order: 4 }
          }
        },
        {
          field: "notes",
          override: {
            label: "Internal Notes",
            display: { order: 5 }
          }
        }
      ]
    },


    /* ----------------------------------------------------------
       📢 BULLETIN BOARD
    ---------------------------------------------------------- */
    {
      name: "announcements",
      permissions: ["admin","influencer",],
      recordType: "announcements",
      displayName: "Announcements",
      icon: { ios: "megaphone.fill", android: "bullhorn", web: "fa fa-bullhorn" },
      views: [AnnouncementsInfluencer],
      fields: [
       {
          field: "name",
          override: {
            field: "annnouncementName",
            label: "Title",
            required: true,
            display: { order: 1 }
          }
        },
           {
          field: "userSelect",
          override: {
            field: "user",
            label: "User",
            required: true,
            display: { order: 1 }
          }
        },
        {
          field: "description",
          override: {
            label: "Message",
            multiline: true,
            required: true,
            display: { order: 2 }
          }
        },
        {
          field: 'image',
          override: {
            field: 'announcementImage',
            displayInList: false,
            label: 'Announcement Images',
            display: { order: 11 },
          },
        },
        {
          field: "video",
          override: {
            field: "videoUrl",
            label: "Video URL",
            display: { order: 3 }
          }
        }
       
      ]
    },

    /* ----------------------------------------------------------
   🟪 INFLUENCER — MY TIME SLOT REQUESTS (Unified View)
---------------------------------------------------------- */
{
  name: "requests",
  permissions: ["influencer"],
  recordType: "requests",
  displayName: "My Requests",
  icon: { ios: "list.bullet.rectangle.portrait", android: "clipboard-list", web: "fa fa-calendar-plus" },

  // You will implement this combined view
  views: [RequestsInfluencerView],

  fields: [
    {
  field: "currentUser",
  override: {
    field: "influencerName",       // attaches influencer user object
    label: "Influencer",
    input: "autoUser",
    required: true,
    display: { order: 1 }
  }
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
  field: "startTimeWithZone",
  label: "Preferred Time",
  input: "timeTimeZone",
  required: true,
  display: { order: 2 }
},

  
    {
  field: "category",
  override: {
    field: "socialMediaPlatforms",
    label: "Social Media Platform(s)",
    type: "array",
    input: "array",
    required: true,
    display: { order: 3 },

    arrayConfig: {
      minItems: 1,
      object: [
        {
          field: "platform",
          type: "string",
          label: "Platform",
          input: "select",
          inputConfig: {
            options: ["Instagram", "TikTok", "Facebook", "YouTube"],
          },
        },
      ],
    },
  },
},


       {
      field: 'duration',
      override: {
        type:'object',
        required: true,
        display: { order: 4 },
        arrayConfig: { minItems: 1 },
      },
    },
    {
      field: "notes",
      override: {
        label: "Notes",
        multiline: true,
        display: { order: 5 }
      }
    },
    {
  field: "status",
  override: {
    label: "Status",
    input: "readOnly",
    inputConfig: {
      defaultValue: "Pending"
    },
    display: { order: 6 }
  }
},
{
    field: "linkField",
    override: {
      field: "salesCoupons",
      label: "Sales and Coupons",
      type: "object",
      required: true,
      inputConfig: {
        recordType: "SalesCoupons",
        searchField: "title",
      },
      display: { order: 1 },
    },
  },


  ]
},

/* ----------------------------------------------------------
   🟥 ADMIN — APPROVE REQUESTS
---------------------------------------------------------- */
{
  name: "RequestsAdmin",
  permissions: ["admin"],
  recordType: "requests",
  displayName: "Requests",
  icon: { ios: "checkmark.seal", android: "check-decagram", web: "fa fa-check-circle" },
  views: [RequestsAdminView],
  fields: [
  {
  field: "currentUser",
  override: {
    field: "influencerName",       // attaches influencer user object
    label: "Influencer",
    input: "autoUser",
    required: true,
    display: { order: 1 }
  }
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
  field: "startTimeWithZone",
  label: "Preferred Time",
  input: "timeTimeZone",
  required: true,
  display: { order: 2 }
},

    {
  field: "category",
  override: {
    field: "socialMediaPlatforms",
    label: "Social Media Platform(s)",
    type: "array",
    input: "array",
    required: true,
    display: { order: 3 },

    arrayConfig: {
      minItems: 1,
      object: [
        {
          field: "platform",
          type: "string",
          label: "Platform",
          input: "select",
          inputConfig: {
            options: ["Instagram", "TikTok", "Facebook", "YouTube"],
          },
        },
      ],
    },
  },
},


       {
      field: 'duration',
      override: {
        type:'object',
        required: true,
        display: { order: 4 },
        arrayConfig: { minItems: 1 },
      },
    },
    {
      field: "notes",
      override: {
        label: "Notes",
        multiline: true,
        display: { order: 5 }
      }
    },
 {
    field: "linkField",
    override: {
      field: "salesCoupon",
      label: "Sales and Coupons",
      type: "object",
      required: true,
      inputConfig: {
        recordType: "SalesCoupons",
        searchField: "title",
      },
      display: { order: 1 },
    },
  },
{
  field: "status",
  override: {
    label: "Status",
    input: "requestStatusWidget",            
    display: { order: 5 },
    inputConfig: {
      options: [
        "Pending",
        "Approved",
        "Rejected",
        "Completed"
      ],
      defaultValue: "Pending"
    }
  }
}

]
},

    

    /* ----------------------------------------------------------
       💬 MESSAGE BOARD
    ---------------------------------------------------------- */
    // {
    //   name: "MessageBoard",
    //   permissions: ["admin", "influencer"],
    //   displayName: "Messages",
    //   icon: { ios: "bubble.left.and.bubble.right.fill", android: "message-text", web: "fa fa-comments" },
    //   views: [],
    //   fields: [
    //     {
    //       field: "message",
    //       override: {
    //         label: "Message",
    //         required: true,
    //         multiline: true,
    //         display: { order: 1 }
    //       }
    //     }
    //   ]
    // },

    /* ----------------------------------------------------------
       🔔 NOTIFICATION CENTER (Admin only)
    ---------------------------------------------------------- */
    {
      name: "Notifications",
      permissions: ["admin", "influencer"],
      recordType: "notifications",
      displayName: "Notifications",
      icon: { ios: "bell.badge.fill", android: "bell-ring", web: "fa fa-bell" },
      views: [NotificationsView],
      fields: [
        {
          field: "name",
          override: {
            field:"title",
            label: "Title",
            input: "string",
            display: { order: 1 }
          }
        },
        {
          field: "note",
          override: {
            field:"message",
            input:"description",
            label: "Message",
            multiline: true,
            display: { order: 2 }
          }
        }
      ]
    },

    /* ----------------------------------------------------------
       👤 PROFILE (Admin + Influencer)
    ---------------------------------------------------------- */
    {
      name: "Profile",
      permissions: ["admin", "influencer"],
      displayName: "Profile",
      recordType: "profile",
      icon: { ios: "person.crop.circle", android: "account-circle", web: "fa fa-user-circle" },
      views: [ProfileView],
      fields: [
        {
          field: "avatar",
          override: {
            label: "Profile Image",
            displayInList: false,
            inputConfig: { maxPhotos: 1 },
            display: { order: 1 }
          }
        },
        {
          field: "preferences",
          override: {
            label: "Notification Preferences",
            display: { order: 2 }
          }
        }
      ]
    },
  ],

  /* ----------------------------------------------------------
     ⚙️ SETTINGS SECTION (Admin only)
  ---------------------------------------------------------- */
  settings: [InfluencerSettings],

  /* ----------------------------------------------------------
     🧩 SUB NAVIGATION
  ---------------------------------------------------------- */
  subNavigation: [],

  defaultRoute: (user) => {
  return user.role === "admin" ? "AdminDashboard" : "InfluencerDashboard";
},
}
];
