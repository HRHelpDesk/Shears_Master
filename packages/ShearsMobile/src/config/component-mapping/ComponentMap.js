// src/components/ComponentMap.js
import { CalendarList } from 'shears-shared/src/AppData/view-schema/calendar-view';
import ListView from '../../components/BaseUI/ListView'
import CalendarView from '../../components/Calendar/CalendarView';
import CalendarListView from '../../components/Calendar/CalendarListView';
import ProfileView from '../../components/SmartViews/ProfileView';
import PaymentSetup from '../../components/Stripe/PaymentSetup';

import StripeCheckout from '../../components/Stripe/StripeCheckout';
import QuickPayScreen from '../../components/QuickPay/QuickPayScreen'
const COMPONENTS = {
  ListView,
  CalendarView,
  ProfileView,
  CalendarListView,
  PaymentSetup,
  StripeCheckout,
  QuickPayScreen
};

export default COMPONENTS;
