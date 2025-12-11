//Current month data 
export const CalendarMonthView = {
    parent:'Calendar',
    name: 'Calendar',
    displayName: 'Calendar',
    component: 'calendar/CalendarPage',
    mobileComponent: 'CalendarView',
}

//Anything in the next 30 days
export const CalendarList = {
    parent:'Calendar',
    name: 'CalendarList',
    displayName: 'Upcoming',
    component: 'calendar/CalendarListView',
    mobileComponent: 'CalendarListView',
    
}

//Today's data
export const CalendarToday = {
    parent:'Calendar',
    name: 'CalendarToday',
    displayName: 'Today',
    component: 'calendar/CalendarHourlyView',
    mobileComponent: 'CalendarHourlyView',
}

