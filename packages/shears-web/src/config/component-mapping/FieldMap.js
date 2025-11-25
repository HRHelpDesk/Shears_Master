import PaymentButton from "../../components/BaseUI/SmartInputs/PaymentButton";
import PhoneTextInput from "../../components/BaseUI/SmartInputs/PhoneTextInput";
import PlainTextInput from "../../components/BaseUI/SmartInputs/PlainTextInput";
import { SmartDateInput, SmartTimeInput } from "../../components/BaseUI/SmartInputs/SmartDateTimeInputs";
import SmartDialogLinkSelectInput from "../../components/BaseUI/SmartInputs/SmartDialogLinkSelectInput";
import SmartDialogSelect from "../../components/BaseUI/SmartInputs/SmartDialogSelect";
import SmartTextAreaInput from "../../components/BaseUI/SmartInputs/SmartTextAreaInput";
import SmartCurrencyInput from "../../components/BaseUI/SmartInputs/SmartCurrencyInput";
import SmartSwitchInput from "../../components/BaseUI/SmartInputs/SmartSwitchInput";
import SmartImageInput from "../../components/BaseUI/SmartInputs/SmartImageInput";

import { WidgetMap } from "./WidgetMap";

export const FieldMap = {
   text: PlainTextInput,
 textarea: SmartTextAreaInput, // could later map to a MultiLineInput
  select: SmartDialogSelect,
  linkSelect: SmartDialogLinkSelectInput,
  date: SmartDateInput, // replace with DatePickerInput
  phone:PhoneTextInput,
  paymentButton: PaymentButton,
  currency: SmartCurrencyInput,
  number: PlainTextInput,
  time: SmartTimeInput,
  boolean: SmartSwitchInput,
  image: SmartImageInput,
  ...WidgetMap

};
