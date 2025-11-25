// shears-shared/src/utils/buildTransaction.js

import { currencyToNumber } from "../utils/stringHelpers.js";
import { v4 as uuid } from "uuid";

export function buildTransactionFromAppointment(appointment, paymentUpdate) {
  if (!appointment?.fieldsData) {
    throw new Error("Invalid appointment object");
  }

  const fd = appointment.fieldsData;

  /* -------------------------------------------------------------
     1) CLIENT
  ------------------------------------------------------------- */
  const client =
    fd.contact?._id
      ? {
          _id: fd.contact._id,
          name:
            fd.contact.raw?.firstName +
            " " +
            (fd.contact.raw?.lastName || ""),
          raw: fd.contact.raw,
        }
      : null;

  /* -------------------------------------------------------------
     2) LINE ITEMS (services + products)
  ------------------------------------------------------------- */
  const serviceItems = [];

  // Services → add as line items
  if (Array.isArray(fd.service)) {
    fd.service.forEach((svc) => {
      serviceItems.push({
        description: svc.raw?.serviceName || svc.name || "Service",
        qty: svc.quantity ?? 1,
        price: currencyToNumber(svc.raw?.price || "0"),
      });
    });
  }

  // Products → add as line items
  if (Array.isArray(fd.product)) {
    fd.product.forEach((prd) => {
      serviceItems.push({
        description: prd.raw?.productName || prd.name || "Product",
        qty: prd.quantity ?? 1,
        price: currencyToNumber(prd.raw?.price || "0"),
      });
    });
  }

  /* -------------------------------------------------------------
     3) TOTAL AMOUNT
  ------------------------------------------------------------- */
  const totalAmount = currencyToNumber(fd.payment?.amount || "0");

  /* -------------------------------------------------------------
     4) PAYMENT TYPE AND RECEIPT
     paymentUpdate = {
       method: "cash" | "credit" | "venmo" | "cashapp",
       status: "Paid",
       sendReceipt: true/false
     }
  ------------------------------------------------------------- */
  const paymentType = paymentUpdate?.method
    ? paymentUpdate.method.replace(/^\w/, (c) => c.toUpperCase())
    : "Cash";

  const receiptString = paymentUpdate?.sendReceipt ? "Yes" : "No";

  /* -------------------------------------------------------------
     5) PAYMENT NAME
     Your AppData says:
       Quick Pay | Product | Service
     Since Calendar = appointment, we default to Service
  ------------------------------------------------------------- */
  const paymentName = "Service";

  /* -------------------------------------------------------------
     6) TRANSACTION OBJECT
  ------------------------------------------------------------- */
  return {
    paymentName,
    transactionId: uuid(),
    client,
    paymentType,
    totalAmount,
    transactionDate: new Date().toISOString().split("T")[0],
    sendReceipt: receiptString,
    notes: fd.appointmentNotes || fd.clientNotes || "",
    serviceItems,
  };
}
