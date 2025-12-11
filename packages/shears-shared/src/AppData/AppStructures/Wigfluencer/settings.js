//import { SlotRulesView } from "../../view-schema/slot-rules-view";

import { Users } from "../../view-schema/user-view";
import { AnnouncementsAdmin } from "./view-schema/Announcements";
import { SalesCouponsView } from "./view-schema/SalesCoupons";

export const InfluencerSettings = [
 
  {
    name: 'Users',
    displayName: 'Add Influencers',
    recordType: 'users',
    permissions: ['admin'], 
    icon: { ios: 'people', android: 'account-group', web: 'fa fa-users' },
    views: [Users],
    fields: [
        {
      field: 'name', // refers to base field in SharedNameFields
      override: {
        field: 'firstName', // ← This changes the actual output key
        label: 'First Name',
        display: { placeholder: "Enter User's First Name", order: 1 },
        required: true,
        validations: {
          minLength: 2,
          maxLength: 50,
        },
      },
    },
    
    {
      field: 'name', // refers to base field in SharedNameFields
      override: {
        field: 'lastName', // ← This changes the actual output key
        label: 'Last Name',
        display: { placeholder: "Enter User's Last Name", order: 1 },
        required: true,
        validations: {
          minLength: 2,
          maxLength: 50,
        },
      },
    },
  
       {
      field: 'name', // refers to base field in SharedNameFields
      override: {
        field: 'email', // ← This changes the actual output key
        label: 'Email Address',
        display: { placeholder: 'Enter the Brand Name', order: 1 },
        required: true,
        validations: {
          minLength: 2,
          maxLength: 50,
        },
      },
    },
        {
      field: 'name', // refers to base field in SharedNameFields
      override: {
        field: 'socialHandle', // ← This changes the actual output key
        label: 'Social Media Handle',
        display: { placeholder: 'Enter Social Media Handle', order: 1 },
        required: true,
        validations: {
          minLength: 2,
          maxLength: 50,
        },
      },
    },
    {
        field: 'category',
        override: {
          field:'role',
          label: 'User Role',
          inputConfig: {
  
            options: ['admin', 'influencer'],
          },
          display: { order: 3 },
        },
      },
    ],
  },

  {
      name: "Announcements",
      permissions: ["admin"],
      recordType: "announcements",
      displayName: "Add Announcements",
      icon: { ios: "megaphone.fill", android: "bullhorn", web: "fa fa-bullhorn" },
      views: [AnnouncementsAdmin],
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
            input: "userSelect",
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
            type: "string",
            input: "video",
            label: "Video URL",
            display: { order: 3 }
          }
        }
      ]
    },
    {
  name: "SalesCoupons",
  permissions: ["admin"],
  recordType: "salescoupons",
  displayName: "Sales & Coupons",
  icon: { ios: "tag.fill", android: "tag", web: "fa fa-tags" },
  views: [SalesCouponsView], // You can attach a dedicated view later
  fields: [
    {
      field: "name",
      override: {
        field: "saleName",
        label: "Title",
        placeholder: "e.g., Flash Sale, Holiday Special",
        required: true,
        display: { order: 1 },
      },
    },

    {
      field: "description",
      override: {
        label: "Description",
        multiline: true,
        placeholder: "Describe the sale or promotion",
        required: false,
        display: { order: 2 },
      },
    },

    {
      field: "name",
      override: {
        field: "code",
        label: "Coupon Code",
        placeholder: "Enter coupon or promo code",
        required: false,
        display: { order: 3 },
      },
    },

    {
      field: "price",
      override: {
        field: "saleAmount",
        label: "Sale Amount (Currency)",
        input: "currency",
        required: false,
        display: { order: 4 },
      },
    },

    {
      field: "number",
      override: {
        field: "percentage",
        label: "Discount Percentage",
        input: "number",
        placeholder: "0–100",
        required: false,
        validations: {
          min: 0,
          max: 100,
        },
        display: { order: 5 },
      },
    },
  ],
},


];
