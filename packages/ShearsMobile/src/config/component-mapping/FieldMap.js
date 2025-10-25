
// import others as you build them

import DatePickerInput from "../../components/SmartInputs/DatePickerInput";
import DropdownInput from "../../components/SmartInputs/DropDownInput";
import MultiLineInput from "../../components/SmartInputs/MulitLineInput";
import PlainTextInput from "../../components/SmartInputs/PlainTextInput";


export const FieldMap = {
  text: PlainTextInput,
  textarea: MultiLineInput, // could later map to a MultiLineInput
  select: DropdownInput,
  date: DatePickerInput, // replace with DatePickerInput
  number: PlainTextInput,
};
