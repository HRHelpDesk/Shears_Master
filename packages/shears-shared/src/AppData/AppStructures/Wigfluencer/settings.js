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
        field: 'singleEmail',
        override:{
          field: 'email',
        },
        label: 'Email Address',
        type: 'string',
        input: 'email',
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
  field: "name",
  override: {
    field: "announcementName",
    label: "Title",
    displayInList:true,
    required: true,
  },
  input: "text",
},

    
 {
  field: "description",
  override: {
    field:'message',
    label: "Message",
    required: true,
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

  
];