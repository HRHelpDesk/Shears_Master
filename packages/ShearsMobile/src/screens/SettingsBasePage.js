// src/components/BaseUI/SettingsBasePage.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { useTheme, Divider } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';
import PageHeader from '../components/UI/PageHeader';
import COMPONENTS from '../config/component-mapping/ComponentMap';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { getRecords } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from '../context/AuthContext';

const FallbackComponent = () => (
  <View style={styles.fallback}>
    <Text style={{ fontSize: 16, color: '#888', textAlign: 'center' }}>
      ⚠️ Component not found. Check your mapping.
    </Text>
  </View>
);

export default function SettingsBasePage({ route }) {
  const theme = useTheme();
  const isFocused = useIsFocused();
  const { token, user } = useContext(AuthContext);

  const { item, appConfig } = route.params || {};
  const name = item?.name;
  const displayName = item?.displayName || name;
  const views = item?.views || [];

  // Map available views (just like BasePage)
  const activeViews = views.map((view) => {
    const Component = COMPONENTS[view.mobileComponent];
    if (!Component) {
      console.warn(`⚠️ Missing component: ${view.mobileComponent}. Using fallback.`);
    }
    return { ...view, component: Component || FallbackComponent };
  });

  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeView = activeViews[activeTab] || null;
  const fieldsFromConfig = item?.fields || [];
  const mappedFields = mapFields(fieldsFromConfig);
console.log("SettingsBasePage mappedFields:", mappedFields);
  const fetchRecords = useCallback(
    async (isRefresh = false) => {
      if (!token || !user?.subscriberId || !name) return;

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const response = await getRecords({
          recordType: name.toLowerCase(),
          token,
          subscriberId: user.subscriberId,
          userId: user.userId,
        });

        setData(response || []);
        setError(null);
      } catch (err) {
        console.error('Failed to load records:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [token, user, name]
  );

  useEffect(() => {
    if (isFocused) fetchRecords(false);
  }, [isFocused, fetchRecords]);

  const dynamicProps = {
    name,
    fields: mappedFields,
    data,
    appConfig,
    refreshing,
    onRefresh: () => fetchRecords(true),
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.fallback, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurface }}>⚠️ {error}</Text>
      </View>
    );
  }

  const ActiveComponent = activeViews[activeTab]?.component || FallbackComponent;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <PageHeader title={displayName} appConfig={appConfig} settings={[]} />
      <Divider />

      {activeViews.length > 1 ? (
        <TabBar
          views={activeViews}
          dynamicProps={dynamicProps}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      ) : (
        <ActiveComponent {...dynamicProps} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
});
