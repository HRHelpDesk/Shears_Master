import { Users } from "../../view-schema/user-view";
import { AnnouncementsAdmin } from "./view-schema/Announcements";
import { SalesCouponsView } from "./view-schema/SalesCoupons";

export const InfluencerSettings = [
  
  /* ----------------------------------------------------------
     👥 USERS / INFLUENCER MANAGEMENT
  ---------------------------------------------------------- */
  {
    name: 'Users',
    displayName: 'Add Influencers',
    recordType: 'users',
    permissions: ['admin'], 
    icon: { ios: 'people', android: 'account-group', web: 'fa fa-users' },
    views: [Users],
    fields: [
      {
        field: 'firstName',
        label: 'First Name',
        type: 'string',
        input: 'text',
        required: true,
        validations: {
          minLength: 2,
          maxLength: 50,
        },
        display: { 
          placeholder: "Enter User's First Name", 
          order: 1 
        }
      },
      {
        field: 'lastName',
        label: 'Last Name',
        type: 'string',
        input: 'text',
        required: true,
        validations: {
          minLength: 2,
          maxLength: 50,
        },
        display: { 
          placeholder: "Enter User's Last Name", 
          order: 2 
        }
      },
      {
        field: 'email',
        label: 'Email Address',
        type: 'string',
        input: 'text',
        required: true,
        validations: {
          minLength: 2,
          maxLength: 100,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        display: { 
          placeholder: 'Enter Email Address', 
          order: 3 
        }
      },
      {
        field: 'socialHandle',
        label: 'Social Media Handle',
        type: 'string',
        input: 'text',
        required: true,
        validations: {
          minLength: 2,
          maxLength: 50,
        },
        display: { 
          placeholder: 'Enter Social Media Handle (e.g., @username)', 
          order: 4 
        }
      },
      {
        field: 'role',
        label: 'User Role',
        type: 'string',
        input: 'select',
        required: true,
        inputConfig: {
          options: ['admin', 'influencer']
        },
        display: { order: 5 }
      }
    ]
  },

  /* ----------------------------------------------------------
     📢 ANNOUNCEMENTS
  ---------------------------------------------------------- */
  {
    name: "Announcements",
    permissions: ["admin"],
    recordType: "announcements",
    displayName: "Add Announcements",
    icon: { ios: "megaphone.fill", android: "bullhorn", web: "fa fa-bullhorn" },
    views: [AnnouncementsAdmin],
    fields: [
  {
  field: "title",
  override: {
    field: "announcementName",
    label: "Title",
    displayInList:true,
  },
  input: "text",
},

    
 {
  field: "description",
  override: {
    field:'message',
    label: "Message",
  },
  input: "textarea",
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
  field: "image",
  override: {
    field: "announcementImage",
    label: "Announcement Images",
    displayInList:false,
  },
  input: "image",
},
  {
  field: "video",
  override: {
    field: "videoUrl",
    label: "Video URL",
  },
  input: "video",
}
    ]
  },

  /* ----------------------------------------------------------
     🏷️ SALES & COUPONS
  ---------------------------------------------------------- */
  {
    name: "SalesCoupons",
    permissions: ["admin"],
    recordType: "salescoupons",
    displayName: "Sales & Coupons",
    icon: { ios: "tag.fill", android: "tag", web: "fa fa-tags" },
    views: [SalesCouponsView],
    fields: [
      {
        field: "saleName",
        label: "Title",
        type: "string",
        input: "text",
        placeholder: "e.g., Flash Sale, Holiday Special",
        required: true,
        display: { order: 1 }
      },
      {
        field: "description",
        label: "Description",
        type: "string",
        input: "textarea",
        multiline: true,
        placeholder: "Describe the sale or promotion",
        required: false,
        display: { order: 2 }
      },
      {
        field: "code",
        label: "Coupon Code",
        type: "string",
        input: "text",
        placeholder: "Enter coupon or promo code",
        required: false,
        display: { order: 3 }
      },
      {
        field: "saleAmount",
        label: "Sale Amount (Currency)",
        type: "number",
        input: "currency",
        required: false,
        display: { order: 4 }
      },
      {
        field: "percentage",
        label: "Discount Percentage",
        type: "number",
        input: "number",
        placeholder: "0–100",
        required: false,
        validations: {
          min: 0,
          max: 100
        },
        display: { order: 5 }
      }
    ]
  }
];