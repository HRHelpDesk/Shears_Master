export const CalendarScreen = {
    parent:'Calendar',
    name: 'Calendar',
    displayName: 'Hourly View',
    modes:['read'],
    component: 'calendar/InfluencerApp/IACalendarHourlyView',
    mobileComponent: 'IACalendarHourlyView',
}

export const CalendarScreenAdmin = {
    parent:'Calendar',
    name: 'Calendar',
    displayName: 'Hourly View',
    modes:['read', 'edit','delete','add'],
    component: 'calendar/InfluencerApp/IACalendarHourlyView',
    mobileComponent: 'IACalendarHourlyView',
}


export const CalendarMonthView = {
    parent:'Calendar',
    name: 'CalendarMonth',
    displayName: 'Month View',
    modes:['read'],
    component: 'calendar/CalendarPage',
    mobileComponent: 'CalendarView',
}

export const CalendarMonthAdminView = {
    parent:'Calendar',
    name: 'CalendarMonth',
    displayName: 'Month View',
    modes:['read', 'edit','delete','add'],
    component: 'calendar/CalendarPage',
    mobileComponent: 'CalendarView',
}