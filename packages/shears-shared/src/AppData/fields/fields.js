import { ProductFields } from './product-fields.js';
import { AddressFields } from './types/contact/address.js';
import { CommunicationFields } from './types/contact/communication.js';
import { ProductCoreFields } from './types/product/core.js';
import { ProductSupplierFields } from './types/product/supplier.js';
import { ServiceCoreFields } from './types/service/core.js';
import { BoolFields } from './types/shared/bool-fields.js';
import { CurrencyFields } from './types/shared/currency-fields.js';
import { TimeDateFields } from './types/shared/date-time.js';
import { DialogFields } from './types/shared/dialog-fields.js';
import { SharedTextareaFields } from './types/shared/extended-text.js';
import { SharedLinkField } from './types/shared/link.js';
import { SharedNameFields } from './types/shared/name.js';
import { PaymentFields } from './types/shared/payment-fields.js';
import { PhotoFields } from './types/shared/image-fields.js';
import { ChartFields } from './types/shared/chart-fields.js';

export const Fields = [
 ...SharedNameFields,
 ...TimeDateFields,
 ...SharedTextareaFields,
 ...SharedLinkField,
 ...DialogFields,
 ...CurrencyFields,
 ...AddressFields,
 ...CommunicationFields,
 ...ProductCoreFields,
 ...ProductSupplierFields,
 ...ServiceCoreFields,
  ...PaymentFields, 
  ...BoolFields,
  ...PhotoFields,
  ...ChartFields
 
];