import { influencerUser } from "./influencer-user";
import { InfluencerSettings } from "./settings";

// Views
import { ProfileView } from "../../view-schema/profile-view";
import { influencerWhitelabels } from "./influencer-whitelabels";
import { AdminDashboardView, InfluencerDashboardView } from "../../view-schema/dashboard-view";
import { AnnouncementsInfluencer, MessageBoard } from "./view-schema/Announcements";
import { RequestsAdminView, RequestsInfluencerView } from "./view-schema/Requests";
import { NotificationsView } from "./view-schema/Notifications";
import { CalendarScreenAdmin, CalendarMonthView, CalendarMonthAdminView, CalendarScreen } from "./view-schema/Calendar";

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
    field: "dateRange",
    override:{
      field: "date",
    },
    label: "Date",
    type: "string",
    required: true,
    display: { order: 2 },
    
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
  products:{
    field: 'linkField',
    override: {
      field: 'products',
      label: 'List products you need flash sales for:',
      type: 'array',
      displayInList: false,
      inputConfig: {
        recordType: 'products',
        searchField: 'productName',
        showQuantity: false,
        useUserId: false,
      },
      display: { order: 1 },
    },
  },
  notes: {
    field: "notes",
    label: "Notes",
    type: "string",
    input: "textarea",
    multiline: true,
    display: { order: 6 }
  },
  isPrivate: {
    field: "isPrivate",
    label: "Make this calendar booking private (Only visible to your account and Admins)",
    type: "string",
    input: "boolean",
   displayInList: false,
    display: { order: 7 },
    inputConfig: {
      onLabel: 'Private',   // ✅ optional config for UI
      offLabel: 'Not Private',
    },
  },

 
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
        icon: { ios: "gauge", android: "gauge", web: "fa-solid fa-gauge" },
        views: [AdminDashboardView],
        fields: [
          {
            field: "welcomeMessage",
            label: "",
            type: "string",
            display: { order: 1 }
          },
       
        {
          field: "weeklySnapshot",
          label: "Upcoming Lives",
          type: "string",
          display: { order: 2 }
        },
        {
          field: "todaysLives",
          label: "Today's Lives",
          type: "string",
          display: { order: 1 }
        },
         {
          field: "pendingRequests",
          label: "Today's Lives",
          type: "string",
          display: { order: 1 }
        },
      ]
      },

      /* ----------------------------------------------------------
         🟪 INFLUENCER DASHBOARD
      ---------------------------------------------------------- */
      // {
      //   name: "InfluencerDashboard",
      //   permissions: ["influencer"],
      //   displayName: "Dashboard",
      //   recordType: "dashboard",
      //   icon: { ios: "house.fill", android: "home", web: "fa fa-home" },
      //   views: [InfluencerDashboardView],
      //   fields: []
      // },

      /* ----------------------------------------------------------
         🗓️ ADMIN CALENDAR
      ---------------------------------------------------------- */
      {
        name: "AdminCalendar",
        permissions: ["admin"],
        displayName: "Calendar",
        recordType: "calendar",
        icon: { ios: "calendar", android: "calendar-month", web: "fa fa-calendar" },
        views: [CalendarMonthAdminView, CalendarScreenAdmin ],
        fields: [
            {
          field: "influencerName",
          label: "Influencer",
          input: "autoUser",
          required: true,
          display: { order: 1 }
        },
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
            field: "timeZoneTime",
            label: "Time",
            type: "string",         
            required: true,
            arrayConfig: { minItems: 1 },
            display: { order: 2 }
          },
          {
          field: "platforms",
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
        {
    field: 'linkField',
    override: {
      field: 'products',
      label: 'Products you will be promoting:',
      type: 'array',
      displayInList: false,
      inputConfig: {
        recordType: 'products',
        searchField: 'productName',
        showQuantity: false,
        useUserId: false,
      },
      display: { order: 1 },
    },
  },
       {
    field: "flashSales",
    label: "Flash Sales Status",
    type: "string",
    input: "readOnlyBool",
   displayInList: false,
    display: { order: 7 },
    inputConfig: {
      onLabel: 'Flash Sales Provided',   // ✅ optional config for UI
      offLabel: 'Flash Sales Pending',
    },
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
         🗓️  CALENDAR
      ---------------------------------------------------------- */
      {
        name: "Calendar",
        permissions: ["influencer"],
        displayName: "Calendar",
        recordType: "calendar",
        icon: { ios: "calendar", android: "calendar-month", web: "fa fa-calendar" },
        views: [CalendarMonthView, CalendarScreen ],
        fields: [
            {
          field: "influencerName",
          label: "Influencer",
          input: "autoUser",
          required: true,
          display: { order: 1 }
        },
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
            field: "timeZoneTime",
            label: "Time",
            type: "string",         
            required: true,
            arrayConfig: { minItems: 1 },
            display: { order: 2 }
          },
          {
          field: "platforms",
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
            {
    field: 'linkField',
    override: {
      field: 'products',
      label: 'Products you will be promoting:',
      type: 'array',
      displayInList: false,
      inputConfig: {
        recordType: 'products',
        searchField: 'productName',
        showQuantity: false,
        useUserId: false,
      },
      display: { order: 1 },
    },
  },
  {
    field: "flashSales",
    label: "Flash Sales Status",
    type: "string",
    input: "readOnlyBool",
   displayInList: false,
    display: { order: 7 },
    inputConfig: {
      onLabel: 'Flash Sales Provided',   // ✅ optional config for UI
      offLabel: 'Flash Sales Pending',
    },
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
      field: "comments",
      label: "Comments",
      input: "array",
      arrayConfig: {
        object: [
          {
            field: "user",
            user: "User",
            input: "autoUser"
          },
          {
            field: "text",
            field: "Comment",
            field: "textarea"
          },
          {
            field: "date",
            field: "Date",
            field: "datetime"
          }
        ]
      },
      "displayInList": false
    },
          {
          field: "name",
          override: {
            field: "announcementName",
            label: "Title",
          },
          input: "text",
        },
             {
            field: "image",
            override: {
              field: "announcementImage",
              label: "Announcement Images",
            },
            input: "image",
          },
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
          field: "description",
          override: {
            field: "message",
             label: "Message",
          },
          input: "textarea",
        },
       
          {
          field: "video",
          override: {
            field: "videoUrl",
            label: "Video URL",
          },
          input: "video",
        },
     
       
        ]
      },

      /* ----------------------------------------------------------
         🟪 INFLUENCER REQUESTS
      ---------------------------------------------------------- */
      {
        name: "requests",
        permissions: ["influencer"],
        recordType: "requests",
        enableSearch: true,
        displayName: "My Requests",
        icon: { ios: "list.bullet.rectangle.portrait", android: "clipboard-list", web: "fa fa-calendar-plus" },
        views: [RequestsInfluencerView],
        fields: [
          requestFields.influencer,
          requestFields.date,
          requestFields.time,
          requestFields.duration,
          requestFields.platforms,
          requestFields.products,
          requestFields.isPrivate,
          requestFields.notes,
         
          {
            field: "status",
            override:{
              field:'status',
                 input: "readOnly",
                 displayInList:true,

            inputConfig: {
              defaultValue: "Pending"
            },
            required: false,
            },
            label: "Status",
            type: "string",
           
            displayInList: true,
            display: { order: 7 }
          },
         
        ]
      },

      /* ----------------------------------------------------------
         🟥 ADMIN REQUESTS
      ---------------------------------------------------------- */
      {
        name: "RequestsAdmin",
        permissions: ["admin"],
        enableSearch: true,
        recordType: "requests",
        displayName: "Requests",
        icon: { ios: "checkmark.seal", android: "check-decagram", web: "fa fa-check-circle" },
        views: [RequestsAdminView],
        fields: [
          requestFields.influencer,
          requestFields.date,
          requestFields.time,
          requestFields.duration,
          requestFields.platforms,
          requestFields.products,
           requestFields.isPrivate,
          requestFields.notes,
         
          {
            field: "status",
            override:{
              field:"status",
              input:"requestStatusWidget",
              displayInList: true,
              label: "Status",
               required: false,

            },
            type: "string",
            displayInList: true,
            display: { order: 3 },
            inputConfig: {
              options: ["Pending", "Approved", "Rejected", "Completed"],
              defaultValue: "Pending"
            }
          },
          
        ]
      },

      /* -------------------------------------------------------------------
   📋 MESSAGE BOARD FIELDS & NAVIGATION ENTRY
------------------------------------------------------------------- */

// Add this to your mainNavigation array (e.g. after announcements)

{
  name: "MessageBoard",
  permissions: ["admin","influencer"],   // admin posts, both can view & reply
  recordType: "messageboard",
  displayName: "Message Board",
  icon: { ios: "bubble.left.and.bubble.right.fill", android: "forum", web: "fa fa-comments" },
  views: [MessageBoard],             // 👈 you'll need to create this view schema
  fields: [
  {
      field: "comments",
      label: "Replies",
      input: "array",
      displayInList: false,
      display: { order: 7 },
      arrayConfig: {
        object: [
          {
            field: "user",
            label: "User",
            input: "autoUser"
          },
          {
            field: "text",
            label: "Comment",
            input: "textarea"
          },
          {
            field: "date",
            label: "Date",
            input: "datetime"
          }
        ]
      }
    },


    // ── Title ───────────────────────────────────────────────────
  

    // ── Category / Tag ──────────────────────────────────────────
    {
      field: "category",
      label: "Category",
      type: "string",
      input: "select",
      required: true,
      display: { order: 2 },
      override:{
        inputConfig: {
        options: ["General", "Announcements", "Tips & Tricks", "Product Updates", "Q&A"],
        defaultValue: "General"
      }
      }
     
    },

    // ── Body ────────────────────────────────────────────────────
    {
      field: "description",
      override: {
        field: "messageBody",
        label: "Message",
      },
      input: "textarea",
      required: true,
      display: { order: 3 }
    },

    // ── Image Attachment ─────────────────────────────────────────
    {
      field: "image",
      override: {
        field: "messageImage",
        label: "Image Attachment",
      },
      input: "image",
      displayInList: false,
      display: { order: 4 }
    },

    // ── Posted Date ──────────────────────────────────────────────
    {
      field: "autoDateTime",
      override: {
        field: "date",
        label: "Date Posted",
          required: false,
      },
    
      display: { order: 5 }
    },

    // ── Author (auto-filled) ─────────────────────────────────────
    {
      field: "postedBy",
      label: "Posted By",
      input: "autoUser",
      required: false,
      displayInList: true,
      display: { order: 6 }
    },

    // ── Threaded Replies ─────────────────────────────────────────
   

  ]
},

     

      /* ----------------------------------------------------------
         👤 PROFILE
      ---------------------------------------------------------- */
      // {
      //   name: "Profile",
      //   permissions: ["admin", "influencer"],
      //   displayName: "Profile",
      //   recordType: "profile",
      //   icon: { ios: "person.crop.circle", android: "account-circle", web: "fa fa-user-circle" },
      //   views: [ProfileView],
      //   fields: [
       
      //     {
      //       field: "todaysLives",
      //       label: "Today's Lives",
      //       type: "string",
      //       display: { order: 2 }
      //     }
      //   ]
      // }
    ],

    /* ----------------------------------------------------------
       ⚙️ SETTINGS
    ---------------------------------------------------------- */
    settings: [InfluencerSettings],

    /* ----------------------------------------------------------
       🧩 SUB NAVIGATION
    ---------------------------------------------------------- */
    subNavigation: [
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
            override:{
              field: "notificationName",
              label: "Title",
            },
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
    ],

    /* ----------------------------------------------------------
       🏠 DEFAULT ROUTE
    ---------------------------------------------------------- */
    defaultRoute: (user) => {
      return user.role === "admin" ? "AdminDashboard" : "Calendar";
    }
  }
];