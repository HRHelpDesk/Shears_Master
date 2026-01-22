export const RequestsInfluencerView = {
  name: 'RequestsInfluencer',
  displayName: 'My Requests',
  component: 'BaseUI/ListView',
  mobileComponent: 'ListView',
  modes:['read','delete', 'add'],
  actionsMenu: ['autofill'],
  sortBy:'date',
  display: 3
};


export const RequestsAdminView = {
  name: 'RequestsAdmin',
  displayName: 'Requests',
  sortBy:'date',
  component: 'BaseUI/SmartLists/AdminListView',
  mobileComponent: 'AdminListView',
  modes:['read','edit','delete','add'],

  display: 3
};
