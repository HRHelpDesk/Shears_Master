// components/SmartWidgets/WidgetMap.ts

import SmartAppointmentsSummaryWidget from "../../components/BaseUI/SmartWidgets/SmartAppointmentsSummaryWidget";
import SmartAvatarInput from "../../components/BaseUI/SmartWidgets/SmartAvatarInput";
import SmartFullCircleGauge from "../../components/BaseUI/SmartWidgets/SmartSemiCircleGauge";
import SmartStatusWidget from "../../components/BaseUI/SmartWidgets/SmartStatusWidget";
import SmartCommentWidget from "../../components/BaseUI/SmartWidgets/SmartCommentWidget";
import SmartLivesScheduleWidget from "../../components/BaseUI/SmartWidgets/InfluencerApp/SmartLivesScheduleWidget";
import SmartDashboardWeeklySnapshot from "../../components/BaseUI/SmartWidgets/InfluencerApp/SmartDashboardWeeklySnapshot";
import SmartWelcomeMessage from "../../components/BaseUI/SmartWidgets/SmartWelcomeMessage";
import SmartPendingRequestsWidget from "../../components/BaseUI/SmartWidgets/InfluencerApp/SmartPendingRequestsWidget";

// import more widgets here...

export const WidgetMap = {
  avatar: SmartAvatarInput,
 earnings: SmartFullCircleGauge,
  appointmentSummary: SmartAppointmentsSummaryWidget,
  requestStatusWidget: SmartStatusWidget,
  comments: SmartCommentWidget,
  todaysLives: SmartLivesScheduleWidget,
  weeklySnapshot:SmartDashboardWeeklySnapshot,
  welcomeMessage: SmartWelcomeMessage,
  pendingRequests: SmartPendingRequestsWidget,
  // ... other widgets
};