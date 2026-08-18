import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useWidgetStore } from '../stores/widgetStore';
import { TopBar } from '../components/TopBar';
import { WidgetGrid } from '../components/WidgetGrid';
import { WidgetActionModal } from '../components/WidgetActionModal';
import { SettingsDrawer } from '../components/SettingsDrawer';
import TapoProviderPickerModal from '../components/TapoProviderPickerModal';
import { WidgetProviderInfo } from '../services/WidgetProviderService';
import { useTVRemote } from '../hooks/useTVRemote';

export default function HomeScreen() {
  useTVRemote();

  const loadInitialData = useWidgetStore((state) => state.loadInitialData);
  const initEventListeners = useWidgetStore((state) => state.initEventListeners);
  const isPickerOpen = useWidgetStore((state) => state.isPickerOpen);
  const setIsPickerOpen = useWidgetStore((state) => state.setIsPickerOpen);
  const setIsSettingsDrawerOpen = useWidgetStore((state) => state.setIsSettingsDrawerOpen);
  const providers = useWidgetStore((state) => state.providers);
  const addWidget = useWidgetStore((state) => state.addWidget);

  useEffect(() => {
    loadInitialData();
    const cleanup = initEventListeners();
    return cleanup;
  }, [loadInitialData, initEventListeners]);

  const handleSelectProvider = useCallback(
    (provider: WidgetProviderInfo) => {
      setIsPickerOpen(false);
      addWidget(provider);
    },
    [addWidget, setIsPickerOpen]
  );

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        contentContainerStyle={styles.container}
        nestedScrollEnabled={false}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
      >
        {/* Minimalist TV Top Header Bar (Clock & Settings Trigger) */}
        <TopBar onOpenSettings={() => setIsSettingsDrawerOpen(true)} />

        {/* Dynamic Widget Grid / Slider Area */}
        <View style={styles.gridWrapper}>
          <WidgetGrid />
        </View>
      </ScrollView>

      {/* Slide-Over Settings Drawer Modal */}
      <SettingsDrawer onOpenPicker={() => setIsPickerOpen(true)} />

      {/* Widget Action & Option Modal */}
      <WidgetActionModal />

      {/* Tapo Provider Picker Modal */}
      <TapoProviderPickerModal
        visible={isPickerOpen}
        providers={providers}
        onSelectProvider={handleSelectProvider}
        onClose={() => setIsPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  gridWrapper: {
    width: '100%',
    flex: 1,
  },
});
