// src/components/ComponentMap.js
import { CalendarList } from 'shears-shared/src/AppData/view-schema/calendar-view';
import ListView from '../../components/BaseUI/ListView'
import CalendarView from '../../components/Calendar/CalendarView';
import CalendarListView from '../../components/Calendar/CalendarListView';
import ProfileView from '../../components/Profile/ProfileView';
import PaymentSetup from '../../components/Stripe/PaymentSetup';

import StripeCheckout from '../../components/Stripe/StripeCheckout';
import QuickPayScreen from '../../components/QuickPay/QuickPayScreen'
import UserListView from '../../components/User/UserListView'
import BasicLayoutPage from '../../components/BaseUI/BasicLayoutPage'

const COMPONENTS = {
  ListView,
  CalendarView,
  ProfileView,
  CalendarListView,
  PaymentSetup,
  StripeCheckout,
  QuickPayScreen,
  UserListView,
  BasicLayoutPage
};

export default COMPONENTS;
