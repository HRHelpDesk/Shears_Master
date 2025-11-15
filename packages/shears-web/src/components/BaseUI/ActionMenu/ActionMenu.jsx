// // src/components/ActionMenu/ActionMenu.jsx
// import React from "react";
// import { View, StyleSheet } from "react-native";
// import { useTheme, Text } from "react-native-paper";

// import PhoneCallActionMenuItem from "./PhoneCallActionMenuItem";
// import TextMessageActionMenuItem from "./TextMessageActionMenuItem";
// import EmailActionMenuItem from "./EmailActionMenuItem";
// import MapsActionMenuItem from "./MapsActionMenuItem";

// // import EmailActionMenuItem ...
// // import MapsActionMenuItem ...

// /* ===================================================================
//    ✅ Extract Helpers — Recursively scan for actionable fields
// =================================================================== */
// const extractPhoneNumbers = (obj) => {
//   const phones = [];

//   const walk = (node) => {
//     if (!node || typeof node !== "object") return;

//     // ✅ Schema: { raw: { phone: [{ value }] } }
//     if (node?.raw?.phone && Array.isArray(node.raw.phone)) {
//       node.raw.phone.forEach((p) => phones.push(p.value));
//     }

//     // ✅ Schema: phone: "123"
//     if (typeof node.phone === "string") phones.push(node.phone);

//     // ✅ Schema: phone: [{label, value}]
//     if (Array.isArray(node.phone)) {
//       node.phone.forEach((p) => p?.value && phones.push(p.value));
//     }

//     // ✅ Deep scan everything
//     Object.values(node).forEach(walk);
//   };

//   walk(obj);
//   return phones;
// };

// const extractEmails = (obj) => {
//   const emails = [];

//   const walk = (node) => {
//     if (!node || typeof node !== "object") return;

//     // ✅ Schema 1: raw.email = [{ label, value }]
//     if (node?.raw?.email && Array.isArray(node.raw.email)) {
//       node.raw.email.forEach((e) => e?.value && emails.push(e.value));
//     }

//     // ✅ Schema 2: email = "string"
//     if (typeof node.email === "string") {
//       emails.push(node.email);
//     }

//     // ✅ Schema 3: email = [{ label, value }]
//     if (Array.isArray(node.email)) {
//       node.email.forEach((e) => e?.value && emails.push(e.value));
//     }

//     // ✅ Deep scan
//     Object.values(node).forEach(walk);
//   };

//   walk(obj);
//   return emails;
// };


// const extractAddresses = (obj) => {
//   const addresses = [];

//   const walk = (node) => {
//     if (!node || typeof node !== "object") return;

//     // ✅ Schema 1: raw.address (your inventory/services schema)
//     if (node?.raw?.address && Array.isArray(node.raw.address)) {
//       node.raw.address.forEach((a) => addresses.push(a));
//     }

//     // ✅ Schema 2: address: [{ street, city, ... }]
//     if (Array.isArray(node.address)) {
//       node.address.forEach((a) => addresses.push(a));
//     }

//     // ✅ Schema 3: address: "123 Fake St"
//     if (typeof node.address === "string") {
//       addresses.push(node.address);
//     }

//     // ✅ Continue deep scan
//     Object.values(node).forEach(walk);
//   };

//   walk(obj);
//   return addresses;
// };


// /* ===================================================================
//    ✅ MAIN ACTION MENU COMPONENT
// =================================================================== */
// export default function ActionMenu({ item }) {
//   const theme = useTheme();

//   const phones = extractPhoneNumbers(item);
//   const emails = extractEmails(item);
//   const addresses = extractAddresses(item);
// console.log('addresses', addresses)
//   const hasActions = phones.length || emails.length || addresses.length;

//   if (!hasActions) return null;

//   return (
//     <View style={[styles.container, { borderColor: theme.colors.outline }]}>
//       <Text
//         variant="labelLarge"
//         style={{
//           marginBottom: 8,
//           color: theme.colors.textSecondary,
//           opacity: 0.8,
//         }}
//       >
//         Actions
//       </Text>

//       <View style={styles.actionsRow}>
//         {/* ✅ PHONE CALL */}
//         {phones.map((p, idx) => (
//           <PhoneCallActionMenuItem key={`phone-${idx}`} phone={p} />
//         ))}

//         {/* ✅ TEXT MESSAGE */}
//         {phones.map((p, idx) => (
//           <TextMessageActionMenuItem key={`sms-${idx}`} phone={p} />
//         ))}

//         {/* ✅ EMAIL — (implement next) */}
//         {emails.map((e, idx) => (
//           <EmailActionMenuItem key={`email-${idx}`} email={e} />
//         ))}

//         {/* ✅ MAPS — (implement next) */}
//         {addresses.map((a, idx) => (
//           <MapsActionMenuItem key={`addr-${idx}`} address={a} />
//         ))}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     marginTop: 4,
//     marginBottom: 10,
//     padding: 10,
//     borderRadius: 10,
//     borderWidth: 1,
//   },
//   actionsRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     alignItems: "center",
//   },
// });
