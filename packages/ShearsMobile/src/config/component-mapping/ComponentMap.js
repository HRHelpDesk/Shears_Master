// src/components/ComponentMap.js
import ListView from '../../components/BaseUI/ListView'
import ListViewReadOnly from '../../components/BaseUI/ReadOnly/ListViewReadOnly'
import AdminListView from '../../components/BaseUI/SmartLists/AdminListView'
import AnnouncementListView from '../../components/BaseUI/SmartLists/AnnouncementListView'

import CardListView from '../../components/BaseUI/SmartLists/CardListView'

import CalendarView from '../../components/Calendar/CalendarView';
import CalendarListView from '../../components/Calendar/CalendarListView';
import CalendarHourlyView from '../../components/Calendar/CalendarHourlyView';

import IACalendarHourlyView from '../../components/Calendar/InfluencerApp/IACalendarHourlyView';


import ProfileView from '../../components/Profile/ProfileView';
import PaymentSetup from '../../components/Stripe/PaymentSetup';

import StripeCheckout from '../../components/Stripe/StripeCheckout';
import QuickPayScreen from '../../components/QuickPay/QuickPayScreen'
import UserListView from '../../components/User/UserListView'
import BasicLayoutPage from '../../components/BaseUI/BasicLayoutPage'
import TransactionsListView from '../../components//Payment/TransactionsListView'

const COMPONENTS = {
  ListView,
  CalendarView,
  IACalendarHourlyView,
  ProfileView,
  CalendarListView,
  PaymentSetup,
  StripeCheckout,
  QuickPayScreen,
  UserListView,
  BasicLayoutPage,
  TransactionsListView,
  CalendarHourlyView,
  ListViewReadOnly,
  AdminListView,
  CardListView,
  AnnouncementListView,
};

export default COMPONENTS;
