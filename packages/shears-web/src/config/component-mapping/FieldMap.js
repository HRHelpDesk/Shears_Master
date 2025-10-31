import PlainTextInput from "../../components/BaseUI/SmartInputs/PlainTextInput";
import { SmartDateInput, SmartTimeInput } from "../../components/BaseUI/SmartInputs/SmartDateTimeInputs";
import SmartDialogLinkSelectInput from "../../components/BaseUI/SmartInputs/SmartDialogLinkSelectInput";
import SmartDialogSelect from "../../components/BaseUI/SmartInputs/SmartDialogSelect";
import SmartTextAreaInput from "../../components/BaseUI/SmartInputs/SmartTextAreaInput";

export const FieldMap = {
   text: PlainTextInput,
 textarea: SmartTextAreaInput, // could later map to a MultiLineInput
  select: SmartDialogSelect,
  linkSelect: SmartDialogLinkSelectInput,
  date: SmartDateInput, // replace with DatePickerInput
//   number: PlainTextInput,
  time: SmartTimeInput,
};
