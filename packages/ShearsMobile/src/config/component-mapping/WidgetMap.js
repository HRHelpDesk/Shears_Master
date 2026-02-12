// components/SmartWidgets/WidgetMap.ts
import SmartAvatarInput from "../../components/SmartWidgets/SmartAvatarInput";
import SmartSemiCircleGauge from "../../components/SmartWidgets/SmartSemiCircleGauge";
import SmartAppointmentsSummaryWidget from "../../components/SmartWidgets/SmartAppointmentsSummaryWidget";
import SmartStatusWidget from "../../components/SmartWidgets/SmartStatusWidget";
import SmartLivesSchedulerWidget from "../../components/SmartWidgets/InfluencerApp/SmartLivesScheduleWidget";

// import more widgets here...

export const WidgetMap = {
  avatar: SmartAvatarInput,
  earnings: SmartSemiCircleGauge,
  appointmentSummary: SmartAppointmentsSummaryWidget,
    requestStatusWidget: SmartStatusWidget,
    todaysLives: SmartLivesSchedulerWidget,

  // ... other widgets
};