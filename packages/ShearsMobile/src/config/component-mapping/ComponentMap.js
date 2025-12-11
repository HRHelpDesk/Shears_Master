// src/components/ComponentMap.js
import ListView from '../../components/BaseUI/ListView'
import ListViewReadOnly from '../../components/BaseUI/ReadOnly/ListViewReadOnly'
import AdminListView from '../../components/BaseUI/SmartLists/AdminListView'

import CalendarView from '../../components/Calendar/CalendarView';
import CalendarListView from '../../components/Calendar/CalendarListView';
import CalendarHourlyView from '../../components/Calendar/CalendarHourlyView';

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
  AdminListView
};

export default COMPONENTS;
