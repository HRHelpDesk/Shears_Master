import { influencerUser } from "./influencer-user";
import { InfluencerSettings } from "./settings";

// Views
import { CalendarMonthView, CalendarToday } from "../../view-schema/calendar-view";
import { ProfileView } from "../../view-schema/profile-view";
import { influencerWhitelabels } from "./influencer-whitelabels";
import { AdminDashboardView, InfluencerDashboardView } from "../../view-schema/dashboard-view";
import { AnnouncementsInfluencer } from "./view-schema/Announcements";
import { RequestsAdminView, RequestsInfluencerView } from "./view-schema/Requests";
import { NotificationsView } from "./view-schema/Notifications";

/* -------------------------------------------------------------------
   📋 SHARED FIELD DEFINITIONS
------------------------------------------------------------------- */
const requestFields = {
  influencer: {
    field: "influencerName",
    label: "Influencer",
    input: "autoUser",
    required: true,
    display: { order: 1 }
  },
  date: {
    field: "date",
    label: "Date",
    type: "string",
    required: true,
    display: { order: 2 },
    arrayConfig: { minItems: 1 }
  },
  time: {
    field: "startTimeWithZone",
    label: "Preferred Time",
    input: "timeTimeZone",
    required: true,
    display: { order: 3 }
  },
  platforms: {
    field: "socialMediaPlatforms",
    label: "Social Media Platform(s)",
    type: "array",
    input: "array",
    required: true,
    display: { order: 4 },
    arrayConfig: {
      minItems: 1,
      object: [
        {
          field: "platform",
          type: "string",
          label: "Platform",
          input: "select",
          inputConfig: {
            options: ["Instagram", "TikTok", "Facebook", "YouTube"]
          }
        }
      ]
    }
  },
  duration: {
    field: "duration",
    label: "Duration",
    type: "object",
    required: true,
    display: { order: 5 },
    arrayConfig: { minItems: 1 }
  },
  notes: {
    field: "notes",
    label: "Notes",
    type: "string",
    input: "textarea",
    multiline: true,
    display: { order: 6 }
  },
  salesCoupon: {
    field: "salesCoupon",
    label: "Sales and Coupons",
    type: "object",
    required: true,
    input: "linkSelect",
    inputConfig: {
      recordType: "SalesCoupons",
      searchField: "title"
    },
    display: { order: 7 }
  }
};

/* -------------------------------------------------------------------
   📱 MAIN APP SCHEMA
------------------------------------------------------------------- */
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
        fields: []
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
         🗓️ CALENDAR
      ---------------------------------------------------------- */
      {
        name: "Calendar",
        permissions: ["admin", "influencer"],
        displayName: "Calendar",
        recordType: "calendar",
        icon: { ios: "calendar", android: "calendar-month", web: "fa fa-calendar" },
        views: [CalendarMonthView, CalendarToday],
        fields: [
          {
            field: "date",
            label: "Date",
            type: "string",
            input: "date",
            required: true,
            arrayConfig: { minItems: 1 },
            display: { order: 1 }
          },
          {
            field: "time",
            label: "Time Slot",
            type: "object",
            input: "time",
            required: true,
            arrayConfig: { minItems: 1 },
            display: { order: 2 }
          },
          {
            field: "assignedInfluencer",
            label: "Assigned Influencer",
            type: "object",
            input: "linkSelect",
            inputConfig: {
              recordType: "users",
              searchField: "firstName",
              filter: { role: "influencer" }
            },
            display: { order: 3 }
          },
          {
            field: "discountCode",
            label: "Discount Code",
            type: "string",
            input: "text",
            required: false,
            display: { order: 4 }
          },
          {
            field: "notes",
            label: "Internal Notes",
            type: "string",
            input: "textarea",
            multiline: true,
            display: { order: 5 }
          }
        ]
      },

      /* ----------------------------------------------------------
         📢 ANNOUNCEMENTS
      ---------------------------------------------------------- */
      {
        name: "announcements",
        permissions: ["admin", "influencer"],
        recordType: "announcements",
        displayName: "Announcements",
        icon: { ios: "megaphone.fill", android: "bullhorn", web: "fa fa-bullhorn" },
        views: [AnnouncementsInfluencer],
        fields: [
          {
            field: "announcementName",
            label: "Title",
            type: "string",
            input: "text",
            required: true,
            display: { order: 1 }
          },
          {
            field: "user",
            label: "User",
            type: "object",
            input: "userSelect",
            required: true,
            display: { order: 2 }
          },
          {
            field: "description",
            label: "Message",
            type: "string",
            input: "textarea",
            multiline: true,
            required: true,
            display: { order: 3 }
          },
          {
            field: "announcementImage",
            label: "Announcement Images",
            type: "string",
            input: "image",
            displayInList: false,
            display: { order: 4 }
          },
          {
            field: "videoUrl",
            label: "Video URL",
            type: "string",
            input: "video",
            display: { order: 5 }
          }
        ]
      },

      /* ----------------------------------------------------------
         🟪 INFLUENCER REQUESTS
      ---------------------------------------------------------- */
      {
        name: "requests",
        permissions: ["influencer"],
        recordType: "requests",
        displayName: "My Requests",
        icon: { ios: "list.bullet.rectangle.portrait", android: "clipboard-list", web: "fa fa-calendar-plus" },
        views: [RequestsInfluencerView],
        fields: [
          requestFields.influencer,
          requestFields.date,
          requestFields.time,
          requestFields.platforms,
          requestFields.duration,
          requestFields.notes,
          {
            field: "status",
            label: "Status",
            type: "string",
            input: "readOnly",
            inputConfig: {
              defaultValue: "Pending"
            },
            display: { order: 7 }
          },
          requestFields.salesCoupon
        ]
      },

      /* ----------------------------------------------------------
         🟥 ADMIN REQUESTS
      ---------------------------------------------------------- */
      {
        name: "RequestsAdmin",
        permissions: ["admin"],
        recordType: "requests",
        displayName: "Requests",
        icon: { ios: "checkmark.seal", android: "check-decagram", web: "fa fa-check-circle" },
        views: [RequestsAdminView],
        fields: [
          requestFields.influencer,
          requestFields.date,
          requestFields.time,
          requestFields.platforms,
          requestFields.duration,
          requestFields.notes,
          requestFields.salesCoupon,
          {
            field: "status",
            label: "Status",
            type: "string",
            input: "requestStatusWidget",
            display: { order: 8 },
            inputConfig: {
              options: ["Pending", "Approved", "Rejected", "Completed"],
              defaultValue: "Pending"
            }
          }
        ]
      },

      /* ----------------------------------------------------------
         🔔 NOTIFICATIONS
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
            field: "title",
            label: "Title",
            type: "string",
            input: "text",
            display: { order: 1 }
          },
          {
            field: "message",
            label: "Message",
            type: "string",
            input: "textarea",
            multiline: true,
            display: { order: 2 }
          }
        ]
      },

      /* ----------------------------------------------------------
         👤 PROFILE
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
            label: "Profile Image",
            type: "string",
            input: "image",
            displayInList: false,
            inputConfig: { maxPhotos: 1 },
            display: { order: 1 }
          },
          {
            field: "preferences",
            label: "Notification Preferences",
            type: "object",
            display: { order: 2 }
          }
        ]
      }
    ],

    /* ----------------------------------------------------------
       ⚙️ SETTINGS
    ---------------------------------------------------------- */
    settings: [InfluencerSettings],

    /* ----------------------------------------------------------
       🧩 SUB NAVIGATION
    ---------------------------------------------------------- */
    subNavigation: [],

    /* ----------------------------------------------------------
       🏠 DEFAULT ROUTE
    ---------------------------------------------------------- */
    defaultRoute: (user) => {
      return user.role === "admin" ? "AdminDashboard" : "InfluencerDashboard";
    }
  }
];