import { ProfileView } from "../../view-schema/profile-view";
import { Users } from "../../view-schema/user-view";
import { AnnouncementsAdmin } from "./view-schema/Announcements";
import { ProductsView } from "./view-schema/Products";
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
            field: 'socialMediaHandles',
            override: {
              required: true,
              display: { order: 4 },
              arrayConfig: { minItems: 1 },
            },
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
     📢 Edit Profile
  ---------------------------------------------------------- */

  {
    name: 'edit-profile',
    displayName: 'Edit Profile',
    recordType: 'users',
    permissions: ['influencer','admin'], 
    icon: { ios: 'person.crop.circle', android: 'account-circle', web: 'fa fa-user-circle' },
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
            field: 'socialMediaHandles',
            override: {
              required: true,
              display: { order: 4 },
              arrayConfig: { minItems: 1 },
            },
          },
      // {
      //   field: 'role',
      //   label: 'User Role',
      //   type: 'string',
      //   input: 'select',
      //   required: true,
      //   inputConfig: {
      //     options: ['admin', 'influencer']
      //   },
      //   display: { order: 5 }
      // }
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
          field: "links",
          label: "Links",
          type: "array",
          input: "array",
          required: false,
          display: { order: 4 },
          arrayConfig: {
            minItems: 1,
            object: [
              {
                field: "link",
                type: "object",
                label: "Link",
                input: "hyperlink",
               
              }
            ]
          }
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
     📦 PRODUCTS
  ---------------------------------------------------------- */
  {
    name: "Products",
    permissions: ["admin"],
    recordType: "products",
    displayName: "Products",
    icon: { ios: "cube.box.fill", android: "package-variant", web: "fa fa-box" },
    views: [ProductsView],
    fields: [
      {
        field: "name",
        override: {
          field: "productName",
          label: "Product Name",
          displayInList: true,
          required: true,
        },
        input: "text",
        type: "string",
        validations: {
          minLength: 2,
          maxLength: 100,
        },
        display: { 
          placeholder: "Enter Product Name", 
          order: 1 
        }
      },
        {
        field: "image",
        override: {
          field: "productImage",
          label: "Product Image",
          displayInList: false,
        },
        input: "image",
        display: { 
          order: 4 
        }
      },
      {
        field: "description",
        label: "Description",
        type: "string",
        input: "textarea",
        required: true,
        validations: {
          minLength: 10,
          maxLength: 500,
        },
        display: { 
          placeholder: "Enter Product Description", 
          order: 2 
        }
      },
      {
        field: "isActive",
        label: "Active",
        type: "boolean",
        input: "checkbox",
        required: false,
        display: { 
          order: 3 
        }
      },
    
    ]
  },

  
];