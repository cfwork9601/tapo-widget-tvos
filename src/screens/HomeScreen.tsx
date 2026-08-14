import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { WidgetMediaCard, ActiveWidget } from '../components/WidgetMediaCard';
import { WidgetRowSettingsModal, RowConfig } from '../components/WidgetRowSettingsModal';
import TapoProviderPickerModal from '../components/TapoProviderPickerModal';
import {
  getInstalledProviders,
  launchApp,
  getSetting,
  saveSetting,
  allocateAppWidgetId,
  deleteAppWidgetId,
  publishPreviewChannel,
  WidgetProviderInfo,
} from '../services/WidgetProviderService';

const DEFAULT_ROW_CONFIG: RowConfig = {
  rowTitle: 'Tapo Smart Home',
  showRowTitle: true,
  cardsPerRow: 3,
  hideTitles: false,
};

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const [providers, setProviders] = useState<WidgetProviderInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeWidgets, setActiveWidgets] = useState<ActiveWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<ActiveWidget | null>(null);
  const [isRowSettingsOpen, setIsRowSettingsOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [rowConfig, setRowConfig] = useState<RowConfig>(DEFAULT_ROW_CONFIG);
  const [widgetOperationError, setWidgetOperationError] = useState<string | null>(null);

  // 16:9 Widescreen Media Card Dimensions
  const horizontalPadding = 50;
  const cardGap = 20;
  const availableWidth = Math.max(screenWidth - horizontalPadding * 2, 700);
  const cardWidth = Math.floor(
    (availableWidth - (rowConfig.cardsPerRow - 1) * cardGap) / rowConfig.cardsPerRow
  );
  const cardHeight = Math.floor((cardWidth * 9) / 16);

  // Load Settings & Saved Widgets on Mount
  useEffect(() => {
    async function loadData() {
      try {
        const list = await getInstalledProviders();
        setProviders(list);

        // Load Saved Widgets
        const savedWidgets = await getSetting('active_widgets');
        let loadedWidgets: ActiveWidget[] = [];
        if (savedWidgets) {
          try {
            const parsed = JSON.parse(savedWidgets);
            if (Array.isArray(parsed) && parsed.length > 0) {
              let updated = false;
              for (const item of parsed) {
                if (!item.clickAction) {
                  item.clickAction = 'widget_primary';
                  updated = true;
                }
                if (!item.appWidgetId || item.appWidgetId <= 0) {
                  const allocatedId = await allocateAppWidgetId();
                  if (allocatedId > 0) {
                    item.appWidgetId = allocatedId;
                    updated = true;
                  } else {
                    delete item.appWidgetId;
                    updated = true;
                    setWidgetOperationError(
                      'A saved widget could not be restored because Android did not provide an ID.'
                    );
                  }
                }
              }
              loadedWidgets = parsed;
              if (updated) {
                saveSetting('active_widgets', JSON.stringify(parsed));
              }
            }
          } catch (e) {
            console.warn('Failed parsing active_widgets:', e);
          }
        }
        setActiveWidgets(loadedWidgets);

        // Load Row Settings
        const savedRowConfig = await getSetting('row_config');
        if (savedRowConfig) {
          try {
            const parsedConfig = JSON.parse(savedRowConfig);
            setRowConfig((prev) => ({ ...prev, ...parsedConfig }));
          } catch (e) {
            console.warn('Failed parsing row_config:', e);
          }
        }
      } catch (err) {
        console.error('Failed loading settings or providers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync to System TV Preview Channels whenever active widgets change
  const handlePublishTvChannel = useCallback(async () => {
    if (activeWidgets.length === 0) return;
    const cameraWidgets = activeWidgets.filter((w) =>
      w.className.toLowerCase().includes('camera')
    );
    const targetWidgets = cameraWidgets.length > 0 ? cameraWidgets : activeWidgets;

    const items = targetWidgets.map((w) => ({
      id: w.instanceId,
      name: w.customLabel || w.label,
      description: w.className.toLowerCase().includes('camera')
        ? '1080p HD Live Stream'
        : 'Smart Home Control',
    }));

    try {
      const channelId = await publishPreviewChannel(items);
      console.log('Synced to Android TV Preview Channel ID:', channelId);
    } catch (e) {
      console.warn('Error publishing preview channel:', e);
    }
  }, [activeWidgets]);

  useEffect(() => {
    if (activeWidgets.length > 0) {
      handlePublishTvChannel();
    }
  }, [activeWidgets, handlePublishTvChannel]);

  // Deep Link Intent Processing
  useEffect(() => {
    const processDeepLink = (url: string | null) => {
      if (!url) return;
      try {
        const queryIndex = url.indexOf('?');
        let queryParams = '';
        if (queryIndex !== -1) {
          queryParams = url.substring(queryIndex + 1);
        }
        const params = new URLSearchParams(queryParams);
        const cameraName = params.get('name')?.toLowerCase();
        if (cameraName) {
          const match = activeWidgets.find(
            (w) =>
              (w.customLabel && w.customLabel.toLowerCase().includes(cameraName)) ||
              w.label.toLowerCase().includes(cameraName)
          );
          if (match && match.packageName) {
            launchApp(match.packageName);
          }
        }
      } catch (err) {
        console.warn('Error processing deep link:', err);
      }
    };

    Linking.getInitialURL().then(processDeepLink);
    const sub = Linking.addEventListener('url', (e) => processDeepLink(e.url));
    return () => sub.remove();
  }, [activeWidgets]);

  // Widget Actions
  const persistWidgets = useCallback((widgets: ActiveWidget[]) => {
    setActiveWidgets(widgets);
    saveSetting('active_widgets', JSON.stringify(widgets));
  }, []);

  const persistRowConfig = useCallback((config: RowConfig) => {
    setRowConfig(config);
    saveSetting('row_config', JSON.stringify(config));
  }, []);

  const handleAddWidget = useCallback(
    async (provider: WidgetProviderInfo) => {
      const allocatedId = await allocateAppWidgetId();
      const newWidget: ActiveWidget = {
        instanceId: `widget_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        appWidgetId: allocatedId > 0 ? allocatedId : undefined,
        packageName: provider.packageName,
        className: provider.className,
        label: provider.label,
        clickAction: 'widget_primary',
      };
      const updated = [...activeWidgets, newWidget];
      persistWidgets(updated);
      setIsPickerOpen(false);
    },
    [activeWidgets, persistWidgets]
  );

  const handleCardPress = useCallback((widget: ActiveWidget) => {
    if (widget.clickAction === 'open_tapo_app') {
      launchApp(widget.packageName);
    }
  }, []);

  const handleCardLongPress = useCallback((widget: ActiveWidget) => {
    setSelectedWidget(widget);
    setIsRowSettingsOpen(true);
  }, []);

  const handleUpdateWidget = useCallback(
    (updatedWidget: ActiveWidget) => {
      const updated = activeWidgets.map((w) =>
        w.instanceId === updatedWidget.instanceId ? updatedWidget : w
      );
      persistWidgets(updated);
      setSelectedWidget(updatedWidget);
    },
    [activeWidgets, persistWidgets]
  );

  const handleDeleteWidget = useCallback(
    (instanceId: string) => {
      const target = activeWidgets.find((w) => w.instanceId === instanceId);
      if (target?.appWidgetId) {
        deleteAppWidgetId(target.appWidgetId);
      }
      const updated = activeWidgets.filter((w) => w.instanceId !== instanceId);
      persistWidgets(updated);
      if (selectedWidget?.instanceId === instanceId) {
        setSelectedWidget(null);
      }
    },
    [activeWidgets, selectedWidget, persistWidgets]
  );

  const tapoProvidersCount = useMemo(
    () => providers.filter((p) => p.packageName === 'com.tplink.iot').length,
    [providers]
  );

  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Header & App Title */}
        <View style={styles.topHeader}>
          <View style={styles.headerInfo}>
            <Text style={styles.appTitle}>Tapo Widget Hub</Text>
            <Text style={styles.appSubtitle}>
              {loading
                ? 'Enumerating Installed Providers...'
                : `${tapoProvidersCount} TP-Link Tapo Widget Providers Available`}
            </Text>
            {widgetOperationError ? (
              <Text style={styles.operationError}>{widgetOperationError}</Text>
            ) : null}
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.headerActions}>
            <Pressable
              style={({ focused }: any) => [styles.headerButton, focused && styles.headerButtonFocused]}
              hasTVPreferredFocus={activeWidgets.length === 0}
              onPress={() => setIsPickerOpen(true)}
            >
              <Text style={styles.headerButtonText}>+ Add Tapo Widget</Text>
            </Pressable>

            <Pressable
              style={({ focused }: any) => [
                styles.headerIconButton,
                focused && styles.headerButtonFocused,
              ]}
              onPress={() => {
                setSelectedWidget(activeWidgets[0] || null);
                setIsRowSettingsOpen(true);
              }}
            >
              <Text style={styles.headerIconText}>⚙ Row Options</Text>
            </Pressable>
          </View>
        </View>

        {/* Cinematic 16:9 Media Row Section */}
        <View style={styles.mediaRowSection}>
          {rowConfig.showRowTitle && (
            <View style={styles.rowTitleContainer}>
              <Text style={styles.rowTitleText}>{rowConfig.rowTitle || 'Tapo Smart Home'}</Text>
              <Text style={styles.rowCountBadge}>{activeWidgets.length} Cards</Text>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 40 }} />
          ) : (
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaRowScroll}
            >
              {activeWidgets.map((item, idx) => (
                <WidgetMediaCard
                  key={item.instanceId}
                  widget={item}
                  width={cardWidth}
                  height={cardHeight}
                  hideTitle={rowConfig.hideTitles}
                  hasTVPreferredFocus={idx === 0}
                  onPress={handleCardPress}
                  onLongPress={handleCardLongPress}
                />
              ))}

              {/* Inline Add Card at end of Media Row */}
              <Pressable
                style={({ focused }: any) => [
                  styles.addCardContainer,
                  { width: cardWidth, height: cardHeight },
                  focused && styles.addCardFocused,
                ]}
                onPress={() => setIsPickerOpen(true)}
              >
                <View style={styles.addIconCircle}>
                  <Text style={styles.addIconText}>+</Text>
                </View>
                <Text style={styles.addCardTitle}>Add Tapo Widget</Text>
                <Text style={styles.addCardSubtitle}>Camera, Plug, Bulb, Switch</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Monet-Style Slide-Out Side-Sheet Drawer */}
      <WidgetRowSettingsModal
        visible={isRowSettingsOpen}
        selectedWidget={selectedWidget}
        rowConfig={rowConfig}
        onUpdateRowConfig={persistRowConfig}
        onUpdateWidget={handleUpdateWidget}
        onDeleteWidget={handleDeleteWidget}
        onPublishTvChannel={handlePublishTvChannel}
        onClose={() => {
          setIsRowSettingsOpen(false);
          setSelectedWidget(null);
        }}
      />

      {/* Tapo Provider Picker Modal */}
      <TapoProviderPickerModal
        visible={isPickerOpen}
        providers={providers}
        onSelectProvider={handleAddWidget}
        onClose={() => setIsPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#080b11',
  },
  container: {
    paddingHorizontal: 40,
    paddingTop: 32,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 36,
  },
  headerInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  operationError: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  headerIconButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  headerButtonFocused: {
    borderColor: '#38bdf8',
    transform: [{ scale: 1.05 }],
  },
  headerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerIconText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  mediaRowSection: {
    marginTop: 10,
  },
  rowTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  rowTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: 0.3,
  },
  rowCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mediaRowScroll: {
    paddingVertical: 12,
    paddingRight: 40,
    alignItems: 'center',
  },
  addCardContainer: {
    borderRadius: 18,
    backgroundColor: 'rgba(18, 22, 32, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginRight: 20,
  },
  addCardFocused: {
    borderColor: '#38bdf8',
    borderStyle: 'solid',
    borderWidth: 3,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    transform: [{ scale: 1.04 }],
  },
  addIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  addIconText: {
    fontSize: 24,
    color: '#38bdf8',
    fontWeight: '700',
    lineHeight: 28,
  },
  addCardTitle: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
  addCardSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
});
