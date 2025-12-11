export const PhotoFields = [

    {
  field: "image",
  type: "array",
  label: "Image",
  displayInList: true,
  input: "image",
  inputConfig: {
    maxSizeMB: 5,
    accept: "image/png,image/jpeg",
  },
  display: { order: 3 },
},
   {
  field: "avatar",
  type: "string",
  label: "Avatar",
  displayInList: false,
  input: "avatar",
  inputConfig: {
    maxSizeMB: 5,
    accept: "image/png,image/jpeg",
  },
  display: { order: 3 },
},
  {
    field: "video",
    type: "video",
    label: "Video",
    displayInList: false,
    input: "video", // ✔ now correct
    inputConfig: {
      maxSizeMB: 5,
      accept: "video/mp4,video/webm",
    },
    display: { order: 3 },
  }
]