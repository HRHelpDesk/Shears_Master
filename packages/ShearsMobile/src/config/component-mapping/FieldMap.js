
// import others as you build them

import DatePickerInput from "../../components/SmartInputs/DatePickerInput";
import TimePickerInput from "../../components/SmartInputs/TimePickerInput";
import SmartTimeTimeZone from "../../components/SmartInputs/SmartTimeTimeZone";

import DropdownInput from "../../components/SmartInputs/DropDownInput";
import MultiLineInput from "../../components/SmartInputs/MulitLineInput";
import PlainTextInput from "../../components/SmartInputs/PlainTextInput";
import DialogSelectInput from "../../components/SmartInputs/DialogSelectInput";
import SmartDialogLinkSelectInput from "../../components/SmartInputs/SmartDialogLinkSelectInput";
import SmartUserLinkSelect from "../../components/SmartInputs/SmartUserLinkSelect";

import PhoneTextInput from "../../components/SmartInputs/PhoneTextInput";
import SmartCurrencyInput from "../../components/SmartInputs/SmartCurrencyInput";
import SmartSwitchInput from "../../components/SmartInputs/SmartSwitchInput";
import PaymentButton from "../../components/SmartInputs/PaymentButton";
import SmartImageInput from "../../components/SmartInputs/SmartImageInput";
import SmartVideoInput from "../../components/SmartInputs/SmartVideoInput";
import SmartAutoUserInput from "../../components/SmartInputs/SmartAutoUserInput";
import SmartReadOnlyField from "../../components/SmartInputs/SmartReadOnlyField";

import {WidgetMap} from './WidgetMap'

export const FieldMap = {
  text: PlainTextInput,
  textarea: MultiLineInput, // could later map to a MultiLineInput
  select: DialogSelectInput,
  linkSelect: SmartDialogLinkSelectInput,
  userSelect: SmartUserLinkSelect,
  date: DatePickerInput, // replace with DatePickerInput
  number: PlainTextInput,
  time: TimePickerInput,
  timeTimeZone: SmartTimeTimeZone,

  phone: PhoneTextInput,
  paymentButton: PaymentButton,
  currency: SmartCurrencyInput,
  boolean: SmartSwitchInput,
  image:SmartImageInput,
  video:SmartVideoInput,
  autoUser: SmartAutoUserInput,
  readOnly: SmartReadOnlyField,

  ...WidgetMap
};
