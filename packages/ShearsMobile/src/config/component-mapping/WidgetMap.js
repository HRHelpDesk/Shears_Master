// components/SmartWidgets/WidgetMap.ts
import SmartAvatarInput from "../../components/SmartWidgets/SmartAvatarInput";
import SmartSemiCircleGauge from "../../components/SmartWidgets/SmartSemiCircleGauge";
import SmartAppointmentsSummaryWidget from "../../components/SmartWidgets/SmartAppointmentsSummaryWidget";
import SmartStatusWidget from "../../components/SmartWidgets/SmartStatusWidget";
import SmartLivesSchedulerWidget from "../../components/SmartWidgets/InfluencerApp/SmartLivesScheduleWidget";
import SmartDashboardWeeklySnapshot from "../../components/SmartWidgets/InfluencerApp/SmartDashboardWeeklySnapshot";
import SmartPendingRequestsWidget from "../../components/SmartWidgets/InfluencerApp/SmartPendingRequestsWidget";
import SmartWelcomeMessage from "../../components/SmartWidgets/SmartWelcomeMessage";


// import more widgets here...

export const WidgetMap = {
  avatar: SmartAvatarInput,
  earnings: SmartSemiCircleGauge,
  appointmentSummary: SmartAppointmentsSummaryWidget,
    requestStatusWidget: SmartStatusWidget,
    todaysLives: SmartLivesSchedulerWidget,
    weeklySnapshot:SmartDashboardWeeklySnapshot,
    welcomeMessage: SmartWelcomeMessage,
    pendingRequests: SmartPendingRequestsWidget,
  // ... other widgets
};