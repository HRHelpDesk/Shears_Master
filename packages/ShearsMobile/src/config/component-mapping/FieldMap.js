
// import others as you build them

import DatePickerInput from "../../components/SmartInputs/DatePickerInput";
import TimePickerInput from "../../components/SmartInputs/TimePickerInput";

import DropdownInput from "../../components/SmartInputs/DropDownInput";
import MultiLineInput from "../../components/SmartInputs/MulitLineInput";
import PlainTextInput from "../../components/SmartInputs/PlainTextInput";
import DialogSelectInput from "../../components/SmartInputs/DialogSelectInput";
import SmartDialogLinkSelectInput from "../../components/SmartInputs/SmartDialogLinkSelectInput";
import PhoneTextInput from "../../components/SmartInputs/PhoneTextInput";
import SmartCurrencyInput from "../../components/SmartInputs/SmartCurrencyInput";
import SmartSwitchInput from "../../components/SmartInputs/SmartSwitchInput";
import PaymentButton from "../../components/SmartInputs/PaymentButton";
import SmartImageInput from "../../components/SmartInputs/SmartImageInput";
import SmartAvatarInput from "../../components/SmartWidgets/SmartAvatarInput";
import SmartSemiCircleGauge from "../../components/SmartWidgets/SmartSemiCircleGauge";

export const FieldMap = {
  text: PlainTextInput,
  textarea: MultiLineInput, // could later map to a MultiLineInput
  select: DialogSelectInput,
  linkSelect: SmartDialogLinkSelectInput,
  date: DatePickerInput, // replace with DatePickerInput
  number: PlainTextInput,
  time: TimePickerInput,
  phone: PhoneTextInput,
  paymentButton: PaymentButton,
  currency: SmartCurrencyInput,
  boolean: SmartSwitchInput,
  image:SmartImageInput,
  avatar: SmartAvatarInput,
  earnings:SmartSemiCircleGauge
};
