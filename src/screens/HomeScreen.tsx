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
} from 'react-native';
import WidgetCard from '../components/WidgetCard';
import {
  getInstalledProviders,
  launchApp,
  getSetting,
  saveSetting,
  allocateAppWidgetId,
  deleteAppWidgetId,
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

const isWidgetClickAction = (value: unknown): value is WidgetClickAction =>
  value === 'widget_primary' || value === 'open_tapo_app' || value === 'none';

const getWidgetClickAction = (widget: ActiveWidget): WidgetClickAction =>
  isWidgetClickAction(widget.clickAction) ? widget.clickAction : 'widget_primary';

const getWidgetClickActionOption = (widget: ActiveWidget): WidgetActionOption =>
  WIDGET_ACTION_OPTIONS.find((option) => option.id === getWidgetClickAction(widget)) ?? WIDGET_ACTION_OPTIONS[0];

const TAPO_CAMERA = {
  packageName: 'com.tplink.iot',
  className: 'com.tplink.libwidgetui.camerawidget.CameraWidgetProvider',
  label: 'Tapo Camera',
};

const TAPO_PLUG = {
  packageName: 'com.tplink.iot',
  className: 'com.tplink.libwidgetui.plugwidget.WidgetOnOffProvider',
  label: 'Tapo Smart Plug',
};

const DEFAULT_WIDGETS: ActiveWidget[] = [];

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
  const [activeWidgets, setActiveWidgets] = useState<ActiveWidget[]>([]);
  const [widgetOperationError, setWidgetOperationError] = useState<string | null>(null);

  // Dynamic layout calculations based on tilesPerRow setting
  const containerPadding = 40; // 20px padding left + 20px right
  const availableWidth = Math.max(screenWidth - containerPadding, 600);
  const tileMargin = 16; // 8px left + 8px right
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
              for (const item of capped) {
                if (!isWidgetClickAction(item.clickAction)) {
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
    if (getWidgetClickAction(item) === 'open_tapo_app') {
      launchApp(item.packageName);
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

  const addWidget = async (
    provider: { packageName: string; className: string; label: string },
    instancePrefix: string,
    labelPrefix: string
  ) => {
    setWidgetOperationError(null);
    const count = activeWidgets.filter((w) => w.className === provider.className).length + 1;
    const allocatedId = await allocateAppWidgetId();
    if (allocatedId <= 0) {
      setWidgetOperationError(`Unable to add ${provider.label}: Android did not provide a widget ID.`);
      return;
    }

    const newWidget: ActiveWidget = {
      instanceId: `${instancePrefix}-${Date.now()}`,
      appWidgetId: allocatedId,
      packageName: provider.packageName,
      className: provider.className,
      label: `${labelPrefix} #${count}`,
    };
    persistWidgets([...activeWidgets, newWidget]);
  };

  const addCameraWidget = () => addWidget(TAPO_CAMERA, 'tapo-camera', 'Tapo Camera');

  const addPlugWidget = () => addWidget(TAPO_PLUG, 'tapo-plug', 'Tapo Plug');

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
            <Text style={styles.title}>tapo-widget Smart Dashboard</Text>
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
                label="+ Add Camera"
                variant="primary"
                hasTVPreferredFocus={true}
                onPress={addCameraWidget}
              />
              <ControlButton
                label="+ Add Plug"
                variant="secondary"
                onPress={addPlugWidget}
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
              <Text style={styles.emptySubtext}>Use "+ Add Camera" above to place a widget card.</Text>
            </View>
          ) : layoutMode === 'grid' ? (
            /* Grid View Row */
            <View style={styles.gridContainer}>
              {activeWidgets.map((item) => (
                <WidgetCard
                  key={item.instanceId}
                  appWidgetId={item.appWidgetId}
                  label={item.label}
                  packageName={item.packageName}
                  className={item.className}
                  width={cardWidth}
                  height={cardHeight}
                  triggerWidgetClick={getWidgetClickAction(item) === 'widget_primary'}
                  onPress={() => handleCardPress(item)}
                  onLongPress={() => handleCardLongPress(item)}
                  onRemove={() => removeWidget(item.instanceId)}
                />
              ))}
            </View>
          ) : (
            /* Horizontal Slider Carousel Row */
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.slideContainer}
            >
              {activeWidgets.map((item) => (
                <WidgetCard
                  key={item.instanceId}
                  appWidgetId={item.appWidgetId}
                  label={item.label}
                  packageName={item.packageName}
                  className={item.className}
                  width={cardWidth}
                  height={cardHeight}
                  triggerWidgetClick={getWidgetClickAction(item) === 'widget_primary'}
                  onPress={() => handleCardPress(item)}
                  onLongPress={() => handleCardLongPress(item)}
                  onRemove={() => removeWidget(item.instanceId)}
                />
              ))}
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
            <Text style={styles.modalTitle}>{selectedWidget?.label || 'Widget Options'}</Text>
            <Text style={styles.modalSubtext}>{selectedWidget?.packageName}</Text>

            {isActionSettingsOpen ? (
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
              <>
                <TouchableOpacity
                  focusable={true}
                  hasTVPreferredFocus={true}
                  style={styles.modalOptionBtn}
                  onPress={() => setIsActionSettingsOpen(true)}
                >
                  <Text style={styles.modalOptionText}>⚙ Click Action: {selectedWidget ? getWidgetClickActionOption(selectedWidget).label : ''}</Text>
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
                  <Text style={styles.modalOptionText}>Open Tapo App Now</Text>
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
    width: 380,
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
