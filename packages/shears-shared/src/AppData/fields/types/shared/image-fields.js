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
  displayInList: true,
  input: "avatar",
  inputConfig: {
    maxSizeMB: 5,
    accept: "image/png,image/jpeg",
  },
  display: { order: 3 },
}
]