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
import SmartVideoInputWeb from "../../components/BaseUI/SmartInputs/SmartVideoInput";
import SmartUserLinkSelect from "../../components/BaseUI/SmartInputs/SmartUserLinkSelect";
import SmartAutoUserInput from "../../components/BaseUI/SmartInputs/SmartAutoUserInput";
import SmartReadOnlyField from "../../components/BaseUI/SmartInputs/SmartReadOnlyField";
import SmartTimeTimeZone from "../../components/BaseUI/SmartInputs/SmartTimeTimeZone";

export const FieldMap = {
   text: PlainTextInput,
 textarea: SmartTextAreaInput, // could later map to a MultiLineInput
  select: SmartDialogSelect,
  linkSelect: SmartDialogLinkSelectInput,
  userSelect: SmartUserLinkSelect,
  date: SmartDateInput, // replace with DatePickerInput
  phone:PhoneTextInput,
  paymentButton: PaymentButton,
  currency: SmartCurrencyInput,
  number: PlainTextInput,
  time: SmartTimeInput,
  boolean: SmartSwitchInput,
  image: SmartImageInput,
  video: SmartVideoInputWeb,
  autoUser: SmartAutoUserInput,
  readOnly: SmartReadOnlyField,
  timeTimeZone: SmartTimeTimeZone,
  ...WidgetMap

};
