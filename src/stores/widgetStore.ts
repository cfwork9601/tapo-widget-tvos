import { create } from 'zustand';
import { AppState, DeviceEventEmitter, Linking } from 'react-native';
import {
  getInstalledProviders,
  launchApp,
  getSetting,
  saveSetting,
  allocateAppWidgetId,
  deleteAppWidgetId,
  publishPreviewChannel,
  WidgetProviderInfo,
  configureWidget,
} from '../services/WidgetProviderService';

export type WidgetClickAction = 'widget_primary' | 'open_tapo_app' | 'none';

export interface ActiveWidget {
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

export interface WidgetActionOption {
  id: WidgetClickAction;
  label: string;
  description: string;
}

export const WIDGET_ACTION_OPTIONS: WidgetActionOption[] = [
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

export const isWidgetClickAction = (value: unknown): value is WidgetClickAction =>
  value === 'widget_primary' || value === 'open_tapo_app' || value === 'none';

export const getWidgetClickAction = (widget: ActiveWidget): WidgetClickAction =>
  isWidgetClickAction(widget.clickAction) ? widget.clickAction : 'widget_primary';

export const getWidgetClickActionOption = (widget: ActiveWidget): WidgetActionOption =>
  WIDGET_ACTION_OPTIONS.find((option) => option.id === getWidgetClickAction(widget)) ?? WIDGET_ACTION_OPTIONS[0];

let initialUrlHandled = false;

interface WidgetState {
  providers: WidgetProviderInfo[];
  activeWidgets: ActiveWidget[];
  layoutMode: 'grid' | 'slide';
  tilesPerRow: number;
  loading: boolean;
  widgetOperationError: string | null;
  selectedWidget: ActiveWidget | null;
  isActionSettingsOpen: boolean;
  isPickerOpen: boolean;
  isSettingsDrawerOpen: boolean;
  configureTokens: Record<string, number>;

  // Actions
  loadInitialData: () => Promise<void>;
  syncPreviewChannels: () => void;
  setLayoutMode: (mode: 'grid' | 'slide') => void;
  setTilesPerRow: (count: number) => void;
  setSelectedWidget: (widget: ActiveWidget | null) => void;
  setIsActionSettingsOpen: (open: boolean) => void;
  setIsPickerOpen: (open: boolean) => void;
  setIsSettingsDrawerOpen: (open: boolean) => void;
  handleCardPress: (item: ActiveWidget) => void;
  updateWidgetClickAction: (instanceId: string, clickAction: WidgetClickAction) => void;
  handleRetryBind: (instanceId: string) => Promise<void>;
  addWidget: (provider: WidgetProviderInfo) => Promise<void>;
  removeWidget: (instanceId: string) => void;
  handleDeviceNameDetected: (instanceId: string, detectedName: string) => void;
  triggerConfigure: (instanceId: string) => void;
  clearError: () => void;
  initEventListeners: () => () => void;
}

export const useWidgetStore = create<WidgetState>((set, get) => ({
  providers: [],
  activeWidgets: [],
  layoutMode: 'grid',
  tilesPerRow: 2,
  loading: true,
  widgetOperationError: null,
  selectedWidget: null,
  isActionSettingsOpen: false,
  isPickerOpen: false,
  isSettingsDrawerOpen: false,
  configureTokens: {},

  loadInitialData: async () => {
    try {
      set({ loading: true });
      const list = await getInstalledProviders();
      set({ providers: list });

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
              if ((item as any).customLabel) {
                delete (item as any).customLabel;
                updated = true;
              }
              if (
                item.className.toLowerCase().includes('camera') ||
                item.label.startsWith('Camera #') ||
                item.label === 'Front Yard Camera' ||
                item.label === 'Camera'
              ) {
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
                  set({
                    widgetOperationError:
                      'A saved widget could not be restored because Android did not provide a widget ID.',
                  });
                }
              }
            }
            loadedWidgets = capped.map((w: ActiveWidget) => ({ ...w, triggerClickToken: 0 }));
            if (updated || capped.length !== parsed.length) {
              saveSetting('active_widgets', JSON.stringify(loadedWidgets));
            }
          }
        } catch (e) {
          console.warn('Failed parsing active_widgets setting, resetting:', e);
        }
      }
      set({ activeWidgets: loadedWidgets.map((w) => ({ ...w, triggerClickToken: 0 })) });

      const savedMode = await getSetting('layout_mode');
      if (savedMode === 'grid' || savedMode === 'slide') {
        set({ layoutMode: savedMode });
      }

      const savedTiles = await getSetting('tiles_per_row');
      if (savedTiles) {
        const count = parseInt(savedTiles, 10);
        if (count >= 1 && count <= 6) {
          set({ tilesPerRow: count });
        }
      }
    } catch (err) {
      console.error('Failed to load settings or providers:', err);
    } finally {
      set({ loading: false });
    }
  },

  syncPreviewChannels: () => {
    const { activeWidgets } = get();
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
      appWidgetId: w.appWidgetId,
    }));

    publishPreviewChannel(payload).catch((e) =>
      console.warn('Background preview channel publication error:', e)
    );
  },

  setLayoutMode: (mode: 'grid' | 'slide') => {
    set({ layoutMode: mode });
    saveSetting('layout_mode', mode);
  },

  setTilesPerRow: (count: number) => {
    set({ tilesPerRow: count });
    saveSetting('tiles_per_row', count.toString());
  },

  setSelectedWidget: (widget: ActiveWidget | null) => {
    set({ selectedWidget: widget });
  },

  setIsActionSettingsOpen: (open: boolean) => {
    set({ isActionSettingsOpen: open });
  },

  setIsPickerOpen: (open: boolean) => {
    set({ isPickerOpen: open });
  },

  setIsSettingsDrawerOpen: (open: boolean) => {
    set({ isSettingsDrawerOpen: open });
  },

  handleCardPress: (item: ActiveWidget) => {
    const action = getWidgetClickAction(item);
    if (action === 'open_tapo_app') {
      launchApp(item.packageName);
    } else if (action === 'none') {
      // no-op
    } else {
      set((state) => ({
        activeWidgets: state.activeWidgets.map((w) =>
          w.instanceId === item.instanceId
            ? { ...w, triggerClickToken: (w.triggerClickToken || 0) + 1 }
            : w
        ),
      }));
    }
  },

  updateWidgetClickAction: (instanceId: string, clickAction: WidgetClickAction) => {
    const { activeWidgets } = get();
    const updated = activeWidgets.map((widget) =>
      widget.instanceId === instanceId ? { ...widget, clickAction } : widget
    );
    set({
      activeWidgets: updated,
      selectedWidget: updated.find((w) => w.instanceId === instanceId) ?? null,
      isActionSettingsOpen: false,
    });
    saveSetting('active_widgets', JSON.stringify(updated));
  },

  handleRetryBind: async (instanceId: string) => {
    set({ widgetOperationError: null });
    const { activeWidgets, selectedWidget } = get();
    const target = activeWidgets.find((w) => w.instanceId === instanceId);
    if (!target) return;

    if (target.appWidgetId && target.appWidgetId > 0) {
      await deleteAppWidgetId(target.appWidgetId);
    }

    const newId = await allocateAppWidgetId();
    if (newId <= 0) {
      set({ widgetOperationError: `Failed to re-allocate widget ID for ${target.label}.` });
      return;
    }

    const updated = activeWidgets.map((w) =>
      w.instanceId === instanceId ? { ...w, appWidgetId: newId } : w
    );
    set({
      activeWidgets: updated,
      selectedWidget: selectedWidget?.instanceId === instanceId ? (updated.find((w) => w.instanceId === instanceId) ?? null) : selectedWidget,
    });
    saveSetting('active_widgets', JSON.stringify(updated));
  },

  addWidget: async (provider: WidgetProviderInfo) => {
    set({ widgetOperationError: null });
    const { activeWidgets } = get();
    const shortClassName = provider.className.split('.').pop() || 'Widget';
    const instancePrefix = `tapo-${shortClassName.toLowerCase()}`;
    const displayLabel = provider.label || shortClassName;
    const count = activeWidgets.filter((w) => w.className === provider.className).length + 1;

    const allocatedId = await allocateAppWidgetId();
    if (allocatedId <= 0) {
      set({
        widgetOperationError: `Unable to add ${displayLabel}: Android did not provide a widget ID.`,
      });
      return;
    }

    const newWidget: ActiveWidget = {
      instanceId: `${instancePrefix}-${Date.now()}`,
      appWidgetId: allocatedId,
      packageName: provider.packageName,
      className: provider.className,
      label: `${displayLabel} #${count}`,
    };
    const updated = [...activeWidgets, newWidget];
    set({ activeWidgets: updated });
    saveSetting('active_widgets', JSON.stringify(updated));

    // Prompt Tapo's device selection screen for this widget ID
    try {
      await configureWidget(allocatedId, provider.packageName, provider.className);
    } catch (err) {
      console.warn('Configure widget error:', err);
    }
  },

  removeWidget: (instanceId: string) => {
    const { activeWidgets, selectedWidget } = get();
    const target = activeWidgets.find((w) => w.instanceId === instanceId);
    if (target?.appWidgetId) {
      deleteAppWidgetId(target.appWidgetId);
    }
    const updated = activeWidgets.filter((w) => w.instanceId !== instanceId);
    set({
      activeWidgets: updated,
      selectedWidget: selectedWidget?.instanceId === instanceId ? null : selectedWidget,
    });
    saveSetting('active_widgets', JSON.stringify(updated));
  },

  handleDeviceNameDetected: (instanceId: string, detectedName: string) => {
    if (!detectedName || !detectedName.trim()) return;
    const cleanName = detectedName.trim();
    const { activeWidgets } = get();
    const target = activeWidgets.find((w) => w.instanceId === instanceId);
    if (!target || target.label === cleanName) {
      return;
    }
    const updated = activeWidgets.map((w) =>
      w.instanceId === instanceId ? { ...w, label: cleanName } : w
    );
    set({ activeWidgets: updated });
    saveSetting('active_widgets', JSON.stringify(updated));
  },

  triggerConfigure: (instanceId: string) => {
    const { selectedWidget } = get();
    set((state) => ({
      configureTokens: {
        ...state.configureTokens,
        [instanceId]: (state.configureTokens[instanceId] || 0) + 1,
      },
    }));
    if (selectedWidget && selectedWidget.instanceId === instanceId && selectedWidget.appWidgetId) {
      configureWidget(
        selectedWidget.appWidgetId,
        selectedWidget.packageName,
        selectedWidget.className
      ).catch(() => {});
    }
  },

  clearError: () => {
    set({ widgetOperationError: null });
  },

  initEventListeners: () => {
    // 1. Listen for device name auto-detection from native helper
    const deviceNameSub = DeviceEventEmitter.addListener(
      'onWidgetDeviceNameDetected',
      (event: { instanceId?: string; appWidgetId?: number; deviceName?: string }) => {
        const { instanceId, appWidgetId, deviceName } = event;
        if (!deviceName || !deviceName.trim()) return;
        const cleanName = deviceName.trim();
        const { activeWidgets } = get();
        const target = activeWidgets.find(
          (w) =>
            (instanceId && w.instanceId === instanceId) ||
            (typeof appWidgetId === 'number' && appWidgetId > 0 && w.appWidgetId === appWidgetId)
        );
        if (!target || target.label === cleanName) return;
        const updated = activeWidgets.map((w) =>
          (instanceId && w.instanceId === instanceId) ||
          (typeof appWidgetId === 'number' && appWidgetId > 0 && w.appWidgetId === appWidgetId)
            ? { ...w, label: cleanName }
            : w
        );
        set({ activeWidgets: updated });
        saveSetting('active_widgets', JSON.stringify(updated));
      }
    );

    // 2. Listen for AppState changes to sync TV Preview Channels
    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        get().syncPreviewChannels();
      }
    });

    // 3. Process incoming deep links
    const processDeepLink = (url: string | null) => {
      if (!url) return;
      if (!url.startsWith('widget-hub://') && !url.includes('tapo-widget-hub://live')) {
        return;
      }
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
              searchTerm = decodeURIComponent(v || '').trim().toLowerCase();
              break;
            }
          }
        }

        if (!searchTerm) {
          const lastSegment = pathname.split('/').pop();
          if (
            lastSegment &&
            lastSegment !== 'live' &&
            lastSegment !== 'show' &&
            lastSegment !== 'camera'
          ) {
            searchTerm = decodeURIComponent(lastSegment).trim().toLowerCase();
          }
        }

        if (!searchTerm || searchTerm.length === 0) return;

        const { activeWidgets, handleCardPress } = get();
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

    if (!initialUrlHandled) {
      initialUrlHandled = true;
      Linking.getInitialURL().then(processDeepLink);
    }
    const linkingSub = Linking.addEventListener('url', (event) => processDeepLink(event.url));

    return () => {
      deviceNameSub.remove();
      appStateSub.remove();
      linkingSub.remove();
    };
  },
}));
