export const AnnouncementsAdmin = {
       name: 'Announcements',
    displayName: 'Announcements',
    component: 'BaseUI/SmartLists/AdminListView',
    mobileComponent:'AdminListView',
    display:3
}

export const AnnouncementsInfluencer = {
       name: 'Announcements',
    displayName: 'Announcements',
    component: 'BaseUI/SmartLists/AnnouncementListView',
    mobileComponent:'AnnouncementListView',
    display:3
}

export const MessageBoard = {
       name: 'message-board',
    displayName: 'Message',
    modes:['read', 'add'],
    component: 'BaseUI/SmartViews/InfluencerApp/MessageBoardView',
    mobileComponent:'MessageBoardView',
    display:3
}