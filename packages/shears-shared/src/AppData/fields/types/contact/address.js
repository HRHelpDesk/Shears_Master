export const AddressFields = [
  {
    field: "address",
    type: "object",                   // ✅ switched from array → object
    label: "Address",
    input: "object",                  // ✅ follows same pattern as time/duration
    columns: 3,                       // ✅ allow row/column layout
    display: { order: 5 },
    displayInList:false,
    objectConfig: [
      {
        field: "label",
        type: "string",
        label: "Label",
        input: "select",
        inputConfig: {
          options: ["Home", "Work", "Billing", "Shipping", "Other"],
        },
        layout: { row: 1, span: 1 },
      },
      {
        field: "street",
        type: "string",
        label: "Street",
        input: "text",
        layout: { row: 2, span: 3 },
      },
      {
        field: "city",
        type: "string",
        label: "City",
        input: "text",
        layout: { row: 3, span: 1 },
      },
      {
        field: "state",
        type: "string",
        label: "State",
        input: "select",
        inputConfig: {
          options: [
            "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
            "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
            "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
            "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
            "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
          ],
        },
        layout: { row: 3, span: 1 },
      },
      {
        field: "zip",
        type: "string",
        label: "ZIP Code",
        input: "zipCode",
        inputConfig: { mask: "#####-####" },
        layout: { row: 3, span: 1 },
      },
    ],
  },
];
