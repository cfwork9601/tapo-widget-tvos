import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  useWindowDimensions,
  TextInput,
  Linking,
} from 'react-native';
import WidgetCard from '../components/WidgetCard';
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

type WidgetClickAction = 'widget_primary' | 'open_tapo_app' | 'none';

interface ActiveWidget {
  instanceId: string;
  appWidgetId?: number;
  packageName: string;
  className: string;
  label: string;
  width?: number;
  height?: number;
  clickAction?: WidgetClickAction;
  triggerClickToken?: number;
}

interface WidgetActionOption {
  id: WidgetClickAction;
  label: string;
  description: string;
}

const WIDGET_ACTION_OPTIONS: WidgetActionOption[] = [
  {
    id: 'widget_primary',
    label: 'Use widget primary action',
    description: 'Send the card press to the Tapo widget.',
  },
  {
    id: 'open_tapo_app',
    label: 'Open Tapo app',
    description: 'Open the Tapo application instead of the widget action.',
  },
  {
    id: 'none',
    label: 'No action',
    description: 'Keep card selection focused without running an action.',
  },
];

const ACTUAL_TAPO_CAMERA_NAMES = [
  'Broilers_Farm_1',
  'EggF_Front',
  'EggF_House1',
];

const isWidgetClickAction = (value: unknown): value is WidgetClickAction =>
  value === 'widget_primary' || value === 'open_tapo_app' || value === 'none';

const getWidgetClickAction = (widget: ActiveWidget): WidgetClickAction =>
  isWidgetClickAction(widget.clickAction) ? widget.clickAction : 'widget_primary';

const getWidgetClickActionOption = (widget: ActiveWidget): WidgetActionOption =>
  WIDGET_ACTION_OPTIONS.find((option) => option.id === getWidgetClickAction(widget)) ?? WIDGET_ACTION_OPTIONS[0];

interface ControlBtnProps {
  label: string;
  active?: boolean;
  hasTVPreferredFocus?: boolean;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'toggle';
}

function ControlButton({ label, active, hasTVPreferredFocus, onPress, variant = 'secondary' }: ControlBtnProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      focusable={true}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={onPress}
      style={[
        styles.controlBtn,
        variant === 'primary' ? styles.controlBtnPrimary : null,
        active ? styles.controlBtnActive : null,
        isFocused ? styles.controlBtnFocused : null,
      ]}
    >
      <Text
        style={[
          styles.controlBtnText,
          active ? styles.controlBtnTextActive : null,
          isFocused ? styles.controlBtnTextFocused : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const [providers, setProviders] = useState<WidgetProviderInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'slide'>('grid');
  const [tilesPerRow, setTilesPerRow] = useState<number>(2);
  const [selectedWidget, setSelectedWidget] = useState<ActiveWidget | null>(null);
  const [isActionSettingsOpen, setIsActionSettingsOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<ActiveWidget[]>([]);
  const [widgetOperationError, setWidgetOperationError] = useState<string | null>(null);

  // Dynamic layout calculations based on tilesPerRow setting
  const containerPadding = 40;
  const availableWidth = Math.max(screenWidth - containerPadding, 600);
  const tileMargin = 16;
  const cardWidth = Math.floor((availableWidth - tilesPerRow * tileMargin) / tilesPerRow);
  const cardHeight = Math.max(Math.floor(cardWidth * 0.78), 280);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await getInstalledProviders();
        setProviders(list);

        const savedWidgets = await getSetting('active_widgets');
        let loadedWidgets: ActiveWidget[] = [];
        if (savedWidgets) {
          try {
            const parsed = JSON.parse(savedWidgets);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const capped = parsed.slice(0, 20);
              let updated = false;
              let camIdx = 0;
              for (const item of capped) {
                if (!isWidgetClickAction(item.clickAction)) {
                  item.clickAction = 'widget_primary';
                  updated = true;
                }
                // Strip any old customLabel
                if ((item as any).customLabel) {
                  delete (item as any).customLabel;
                  updated = true;
                }
                // Assign actual Tapo camera name
                if (item.className.toLowerCase().includes('camera') || item.label.startsWith('Camera #') || item.label === 'Front Yard Camera' || item.label === 'Camera') {
                  if (camIdx < ACTUAL_TAPO_CAMERA_NAMES.length) {
                    item.label = ACTUAL_TAPO_CAMERA_NAMES[camIdx];
                    updated = true;
                  }
                }
                camIdx++;
                if (!item.appWidgetId || item.appWidgetId <= 0) {
                  const allocatedId = await allocateAppWidgetId();
                  if (allocatedId > 0) {
                    item.appWidgetId = allocatedId;
                    updated = true;
                  } else {
                    delete item.appWidgetId;
                    updated = true;
                    setWidgetOperationError('A saved widget could not be restored because Android did not provide a widget ID.');
                  }
                }
              }
              loadedWidgets = capped;
              if (updated || capped.length !== parsed.length) {
                saveSetting('active_widgets', JSON.stringify(capped));
              }
            }
          } catch (e) {
            console.warn('Failed parsing active_widgets setting, resetting:', e);
          }
        }
        setActiveWidgets(loadedWidgets);

        const savedMode = await getSetting('layout_mode');
        if (savedMode === 'grid' || savedMode === 'slide') {
          setLayoutMode(savedMode);
        }

        const savedTiles = await getSetting('tiles_per_row');
        if (savedTiles) {
          const count = parseInt(savedTiles, 10);
          if (count >= 1 && count <= 6) {
            setTilesPerRow(count);
          }
        }
      } catch (err) {
        console.error('Failed to load settings or providers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Voice action / Deep Link listener (e.g. widget-hub://live?name=front or widget-hub://show?widget=front)
  useEffect(() => {
    if (activeWidgets.length === 0) return;

    const processDeepLink = (url: string | null) => {
      if (!url) return;
      try {
        const queryIndex = url.indexOf('?');
        let queryParams = '';
        let pathname = url;
        if (queryIndex !== -1) {
          queryParams = url.substring(queryIndex + 1);
          pathname = url.substring(0, queryIndex);
        }

        let searchTerm = '';
        if (queryParams) {
          const pairs = queryParams.split('&');
          for (const pair of pairs) {
            const [k, v] = pair.split('=');
            if (k === 'name' || k === 'widget' || k === 'query' || k === 'camera') {
              searchTerm = decodeURIComponent(v || '').toLowerCase();
              break;
            }
          }
        }

        if (!searchTerm) {
          const lastSegment = pathname.split('/').pop();
          if (lastSegment && lastSegment !== 'live' && lastSegment !== 'show' && lastSegment !== 'camera') {
            searchTerm = decodeURIComponent(lastSegment).toLowerCase();
          }
        }

        if (!searchTerm) return;

        const matched = activeWidgets.find((w) => {
          const title = (w.label || '').toLowerCase();
          return title.includes(searchTerm) || searchTerm.includes(title);
        });

        if (matched) {
          handleCardPress(matched);
        }
      } catch (err) {
        console.warn('Failed to handle deep link:', url, err);
      }
    };

    Linking.getInitialURL().then(processDeepLink);
    const sub = Linking.addEventListener('url', (event) => processDeepLink(event.url));
    return () => sub.remove();
  }, [activeWidgets]);

  // Synchronize Tapo camera preview channels to Android TV system (TvProvider)
  useEffect(() => {
    if (activeWidgets.length === 0) return;
    const cameraWidgets = activeWidgets.filter((w) =>
      (w.className || '').toLowerCase().includes('camera')
    );
    const targetWidgets = cameraWidgets.length > 0 ? cameraWidgets : activeWidgets;

    const payload = targetWidgets.map((w) => ({
      id: w.instanceId,
      name: w.label,
      description: (w.className || '').toLowerCase().includes('camera')
        ? '1080p HD Live Stream'
        : 'Smart Home Control',
    }));

    publishPreviewChannel(payload).catch((e) =>
      console.warn('Background preview channel publication error:', e)
    );
  }, [activeWidgets]);

  const persistWidgets = (widgets: ActiveWidget[]) => {
    setActiveWidgets(widgets);
    saveSetting('active_widgets', JSON.stringify(widgets));
  };

  const persistLayoutMode = (mode: 'grid' | 'slide') => {
    setLayoutMode(mode);
    saveSetting('layout_mode', mode);
  };

  const persistTilesPerRow = (count: number) => {
    setTilesPerRow(count);
    saveSetting('tiles_per_row', count.toString());
  };

  const handleCardPress = (item: ActiveWidget) => {
    const action = getWidgetClickAction(item);
    if (action === 'open_tapo_app') {
      launchApp(item.packageName);
    } else if (action === 'none') {
      // no-op
    } else {
      setActiveWidgets((prev) =>
        prev.map((w) =>
          w.instanceId === item.instanceId
            ? { ...w, triggerClickToken: (w.triggerClickToken || 0) + 1 }
            : w
        )
      );
    }
  };

  const handleCardLongPress = (item: ActiveWidget) => {
    setIsActionSettingsOpen(false);
    setSelectedWidget(item);
  };

  const updateWidgetClickAction = (instanceId: string, clickAction: WidgetClickAction) => {
    const updated = activeWidgets.map((widget) =>
      widget.instanceId === instanceId ? { ...widget, clickAction } : widget
    );
    persistWidgets(updated);
    setSelectedWidget(updated.find((widget) => widget.instanceId === instanceId) ?? null);
    setIsActionSettingsOpen(false);
  };

  const handleRetryBind = async (instanceId: string) => {
    setWidgetOperationError(null);
    const target = activeWidgets.find((w) => w.instanceId === instanceId);
    if (!target) return;

    if (target.appWidgetId && target.appWidgetId > 0) {
      await deleteAppWidgetId(target.appWidgetId);
    }

    const newId = await allocateAppWidgetId();
    if (newId <= 0) {
      setWidgetOperationError(`Failed to re-allocate widget ID for ${target.label}.`);
      return;
    }

    const updated = activeWidgets.map((w) =>
      w.instanceId === instanceId ? { ...w, appWidgetId: newId } : w
    );
    persistWidgets(updated);
    if (selectedWidget?.instanceId === instanceId) {
      setSelectedWidget(updated.find((w) => w.instanceId === instanceId) ?? null);
    }
  };

  const addWidget = async (
    provider: { packageName: string; className: string; label?: string },
    instancePrefix: string,
    labelPrefix: string
  ) => {
    setWidgetOperationError(null);
    const displayLabel = provider.label || labelPrefix;
    const count = activeWidgets.filter((w) => w.className === provider.className).length + 1;
    const allocatedId = await allocateAppWidgetId();
    if (allocatedId <= 0) {
      setWidgetOperationError(`Unable to add ${displayLabel}: Android did not provide a widget ID.`);
      return;
    }

    const newWidget: ActiveWidget = {
      instanceId: `${instancePrefix}-${Date.now()}`,
      appWidgetId: allocatedId,
      packageName: provider.packageName,
      className: provider.className,
      label: `${displayLabel} #${count}`,
    };
    persistWidgets([...activeWidgets, newWidget]);
  };

  const handleSelectProvider = (provider: WidgetProviderInfo) => {
    const shortClassName = provider.className.split('.').pop() || 'Widget';
    const instancePrefix = `tapo-${shortClassName.toLowerCase()}`;
    const displayLabel = provider.label || shortClassName;
    addWidget(provider, instancePrefix, displayLabel);
  };

  const removeWidget = (instanceId: string) => {
    const target = activeWidgets.find((w) => w.instanceId === instanceId);
    if (target?.appWidgetId) {
      deleteAppWidgetId(target.appWidgetId);
    }
    const updated = activeWidgets.filter((w) => w.instanceId !== instanceId);
    persistWidgets(updated);
    if (selectedWidget?.instanceId === instanceId) {
      setSelectedWidget(null);
    }
  };

  const tapoProvidersCount = providers.filter((p) => p.packageName === 'com.tplink.iot').length;

  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* ROW 1: Header & Settings Control Row */}
        <View style={styles.row1Settings}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Tapo Widget Hub</Text>
            <Text style={styles.subtitle}>
              {loading
                ? 'Enumerating Installed Providers...'
                : `Device Providers: ${providers.length} total (${tapoProvidersCount} TP-Link)`}
            </Text>
            {widgetOperationError ? <Text style={styles.operationError}>{widgetOperationError}</Text> : null}
          </View>

          <View style={styles.settingsToolbar}>
            {/* Widget Action Buttons */}
            <View style={styles.toolbarSection}>
              <ControlButton
                label="+ Add Tapo Widget"
                variant="primary"
                hasTVPreferredFocus={true}
                onPress={() => setIsPickerOpen(true)}
              />
            </View>

            {/* Layout Mode Selector (Grid vs Slider) */}
            <View style={styles.toolbarSection}>
              <Text style={styles.sectionLabel}>Mode:</Text>
              <View style={styles.toggleGroup}>
                <ControlButton
                  label="⊞ Grid"
                  active={layoutMode === 'grid'}
                  onPress={() => persistLayoutMode('grid')}
                />
                <ControlButton
                  label="⇄ Slider"
                  active={layoutMode === 'slide'}
                  onPress={() => persistLayoutMode('slide')}
                />
              </View>
            </View>

            {/* Tiles Per Row Selector (2, 3, 4) */}
            <View style={styles.toolbarSection}>
              <Text style={styles.sectionLabel}>Tiles / Row:</Text>
              <View style={styles.toggleGroup}>
                <ControlButton
                  label="2"
                  active={tilesPerRow === 2}
                  onPress={() => persistTilesPerRow(2)}
                />
                <ControlButton
                  label="3"
                  active={tilesPerRow === 3}
                  onPress={() => persistTilesPerRow(3)}
                />
                <ControlButton
                  label="4"
                  active={tilesPerRow === 4}
                  onPress={() => persistTilesPerRow(4)}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ROW 2: Widgets Area (Grid or Slider) */}
        <View style={styles.row2Widgets}>
          {loading ? (
            <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 40 }} />
          ) : activeWidgets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active widgets on dashboard.</Text>
              <Text style={styles.emptySubtext}>Use "+ Add Tapo Widget" above to place a widget card.</Text>
            </View>
          ) : layoutMode === 'grid' ? (
            /* Grid View Row */
            <View style={styles.gridContainer}>
              {activeWidgets.map((item) => {
                const isInstalled = providers.length === 0 || providers.some(
                  (p) => p.packageName === item.packageName && p.className === item.className
                );
                return (
                  <WidgetCard
                    key={item.instanceId}
                    id={item.instanceId}
                    appWidgetId={item.appWidgetId}
                    label={item.label}
                    packageName={item.packageName}
                    className={item.className}
                    width={cardWidth}
                    height={cardHeight}
                    isInstalled={isInstalled}
                    triggerWidgetClick={getWidgetClickAction(item) === 'widget_primary'}
                    triggerClickToken={item.triggerClickToken}
                    onPress={() => handleCardPress(item)}
                    onLongPress={() => handleCardLongPress(item)}
                    onOptions={() => handleCardLongPress(item)}
                    onRemove={() => removeWidget(item.instanceId)}
                    onRetryBind={() => handleRetryBind(item.instanceId)}
                    onOpenApp={() => launchApp(item.packageName)}
                  />
                );
              })}
            </View>
          ) : (
            /* Horizontal Slider Carousel Row */
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.slideContainer}
            >
              {activeWidgets.map((item) => {
                const isInstalled = providers.length === 0 || providers.some(
                  (p) => p.packageName === item.packageName && p.className === item.className
                );
                return (
                  <WidgetCard
                    key={item.instanceId}
                    id={item.instanceId}
                    appWidgetId={item.appWidgetId}
                    label={item.label}
                    packageName={item.packageName}
                    className={item.className}
                    width={cardWidth}
                    height={cardHeight}
                    isInstalled={isInstalled}
                    triggerWidgetClick={getWidgetClickAction(item) === 'widget_primary'}
                    triggerClickToken={item.triggerClickToken}
                    onPress={() => handleCardPress(item)}
                    onLongPress={() => handleCardLongPress(item)}
                    onOptions={() => handleCardLongPress(item)}
                    onRemove={() => removeWidget(item.instanceId)}
                    onRetryBind={() => handleRetryBind(item.instanceId)}
                    onOpenApp={() => launchApp(item.packageName)}
                  />
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Long-Press Option Context Modal */}
      <Modal
        visible={selectedWidget !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (isActionSettingsOpen) {
            setIsActionSettingsOpen(false);
          } else {
            setSelectedWidget(null);
          }
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setIsActionSettingsOpen(false);
            setSelectedWidget(null);
          }}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedWidget?.label || 'Widget Options'}
            </Text>
            <Text style={styles.modalSubtext}>{selectedWidget?.packageName}</Text>

            {isActionSettingsOpen ? (
              /* Click Action Settings Sub-Menu */
              <>
                <Text style={styles.actionSettingsHint}>Choose what happens when this card is pressed.</Text>
                {WIDGET_ACTION_OPTIONS.map((option, index) => {
                  const isSelected = selectedWidget && getWidgetClickAction(selectedWidget) === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      focusable={true}
                      hasTVPreferredFocus={index === 0}
                      style={[styles.modalOptionBtn, isSelected ? styles.modalOptionBtnSelected : null]}
                      onPress={() => selectedWidget && updateWidgetClickAction(selectedWidget.instanceId, option.id)}
                    >
                      <Text style={styles.modalOptionText}>{isSelected ? '✓ ' : ''}{option.label}</Text>
                      <Text style={styles.modalOptionDescription}>{option.description}</Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity focusable={true} style={styles.modalCancelBtn} onPress={() => setIsActionSettingsOpen(false)}>
                  <Text style={styles.modalCancelText}>Back</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Main Card Context Menu */
              <>
                <TouchableOpacity
                  focusable={true}
                  hasTVPreferredFocus={true}
                  style={styles.modalOptionBtn}
                  onPress={() => setIsActionSettingsOpen(true)}
                >
                  <Text style={styles.modalOptionText}>
                    ⚙ Click Action: {selectedWidget ? getWidgetClickActionOption(selectedWidget).label : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  focusable={true}
                  style={styles.modalOptionBtn}
                  onPress={() => {
                    if (selectedWidget) {
                      handleRetryBind(selectedWidget.instanceId);
                    }
                  }}
                >
                  <Text style={styles.modalOptionText}>🔄 Retry Binding / Refresh ID</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  focusable={true}
                  style={styles.modalOptionBtn}
                  onPress={() => setIsActionSettingsOpen(true)}
                >
                  <Text style={styles.modalOptionText}>
                    ⚙ Click Action: {selectedWidget ? getWidgetClickActionOption(selectedWidget).label : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  focusable={true}
                  style={styles.modalOptionBtn}
                  onPress={() => {
                    const pkg = selectedWidget?.packageName;
                    setSelectedWidget(null);
                    if (pkg) launchApp(pkg);
                  }}
                >
                  <Text style={styles.modalOptionText}>📱 Open Tapo App Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  focusable={true}
                  style={[styles.modalOptionBtn, styles.modalOptionDanger]}
                  onPress={() => {
                    if (selectedWidget) removeWidget(selectedWidget.instanceId);
                  }}
                >
                  <Text style={[styles.modalOptionText, styles.modalOptionDangerText]}>🗑️ Delete Widget</Text>
                </TouchableOpacity>

                <TouchableOpacity focusable={true} style={styles.modalCancelBtn} onPress={() => setSelectedWidget(null)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  /* ROW 1 STYLES */
  row1Settings: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerInfo: {
    marginBottom: 12,
    alignItems: 'center',
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  operationError: {
    color: '#fca5a5',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  settingsToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  toolbarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 2,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },

  /* CONTROL BUTTON STYLES WITH FOCUS RINGS */
  controlBtn: {
    backgroundColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnPrimary: {
    backgroundColor: '#0284c7',
  },
  controlBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  controlBtnFocused: {
    borderColor: '#38bdf8',
    borderWidth: 2.5,
    backgroundColor: '#0284c7',
    transform: [{ scale: 1.05 }],
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  controlBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  controlBtnTextActive: {
    color: '#ffffff',
  },
  controlBtnTextFocused: {
    color: '#ffffff',
  },

  /* ROW 2 STYLES */
  row2Widgets: {
    width: '100%',
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
  },
  slideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 6,
  },

  /* OPTION MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: 400,
    maxHeight: '85%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtext: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 20,
  },
  actionSettingsHint: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    textAlign: 'center',
  },
  presetScroll: {
    width: '100%',
    maxHeight: 220,
    marginBottom: 12,
  },
  modalOptionBtn: {
    width: '100%',
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  modalOptionBtnSelected: {
    backgroundColor: '#075985',
    borderColor: '#38bdf8',
  },
  modalOptionText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOptionDescription: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOptionDanger: {
    backgroundColor: '#7f1d1d',
    borderColor: '#b91c1c',
  },
  modalOptionDangerText: {
    color: '#fca5a5',
  },
  modalCancelBtn: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
});
