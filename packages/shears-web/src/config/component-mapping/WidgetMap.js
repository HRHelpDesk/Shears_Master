// components/SmartWidgets/WidgetMap.ts

import SmartAppointmentsSummaryWidget from "../../components/BaseUI/SmartWidgets/SmartAppointmentsSummaryWidget";
import SmartAvatarInput from "../../components/BaseUI/SmartWidgets/SmartAvatarInput";
import SmartFullCircleGauge from "../../components/BaseUI/SmartWidgets/SmartSemiCircleGauge";
import SmartStatusWidget from "../../components/BaseUI/SmartWidgets/SmartStatusWidget";
// import more widgets here...

export const WidgetMap = {
  avatar: SmartAvatarInput,
 earnings: SmartFullCircleGauge,
  appointmentSummary: SmartAppointmentsSummaryWidget,
  requestStatusWidget: SmartStatusWidget,
  // ... other widgets
};