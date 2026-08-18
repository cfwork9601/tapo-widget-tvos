import { useEffect } from 'react';
import { useWidgetStore } from '../stores/widgetStore';

const ReactNative = require('react-native');
const TVEventHandler = ReactNative.TVEventHandler;

export function useTVRemote() {
  const selectedWidget = useWidgetStore((state) => state.selectedWidget);
  const activeWidgets = useWidgetStore((state) => state.activeWidgets);
  const tilesPerRow = useWidgetStore((state) => state.tilesPerRow);
  const setTilesPerRow = useWidgetStore((state) => state.setTilesPerRow);
  const setSelectedWidget = useWidgetStore((state) => state.setSelectedWidget);
  const handleCardPress = useWidgetStore((state) => state.handleCardPress);

  useEffect(() => {
    if (!TVEventHandler) return;

    const handler = new TVEventHandler();
    try {
      handler.enable(null, (_cmp: any, evt: any) => {
        if (!evt || !evt.eventType) return;

        // 1. Menu button: open options modal for first/active widget if none selected
        if (evt.eventType === 'menu') {
          if (!selectedWidget && activeWidgets.length > 0) {
            setSelectedWidget(activeWidgets[0]);
          }
        }

        // 2. Play/Pause button: quick trigger live stream for first camera
        if (evt.eventType === 'playPause') {
          const camera =
            activeWidgets.find((w) =>
              (w.className || '').toLowerCase().includes('camera')
            ) || activeWidgets[0];
          if (camera) {
            handleCardPress(camera);
          }
        }

        // 3. FastForward / Rewind: cycle column density (2 -> 3 -> 4 -> 2)
        if (evt.eventType === 'fastForward') {
          const next = tilesPerRow === 4 ? 2 : tilesPerRow + 1;
          setTilesPerRow(next);
        } else if (evt.eventType === 'rewind') {
          const prev = tilesPerRow === 2 ? 4 : tilesPerRow - 1;
          setTilesPerRow(prev);
        }
      });
    } catch (e) {
      console.warn('TVEventHandler initialization error:', e);
    }

    return () => {
      try {
        handler.disable();
      } catch (_) {}
    };
  }, [
    selectedWidget,
    activeWidgets,
    tilesPerRow,
    setTilesPerRow,
    setSelectedWidget,
    handleCardPress,
  ]);
}

export default useTVRemote;
