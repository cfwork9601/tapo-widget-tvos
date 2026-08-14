import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  requireNativeComponent,
  ViewStyle,
} from 'react-native';

const AppWidgetView = requireNativeComponent<any>('AppWidgetView');

export interface ActiveWidget {
  instanceId: string;
  appWidgetId?: number;
  packageName: string;
  className: string;
  label: string;
  customLabel?: string;
  clickAction: 'widget_primary' | 'open_tapo_app' | 'none';
}

interface WidgetMediaCardProps {
  widget: ActiveWidget;
  width: number;
  height: number;
  hideTitle?: boolean;
  hasTVPreferredFocus?: boolean;
  onPress: (widget: ActiveWidget) => void;
  onLongPress: (widget: ActiveWidget) => void;
}

export const WidgetMediaCard: React.FC<WidgetMediaCardProps> = React.memo(({
  widget,
  width,
  height,
  hideTitle = false,
  hasTVPreferredFocus = false,
  onPress,
  onLongPress,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [clickToken, setClickToken] = useState(0);
  const longPressTimeoutRef = useRef<any>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);

  const displayName = widget.customLabel || widget.label || 'Tapo Device';
  const isCamera = widget.className.toLowerCase().includes('camera');

  const handlePress = useCallback(() => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }
    if (widget.clickAction === 'widget_primary') {
      setClickToken((prev) => prev + 1);
    }
    onPress(widget);
  }, [widget, onPress]);

  const handleKeyDown = useCallback(
    (e: any) => {
      const keyCode = e.nativeEvent?.keyCode;
      const key = e.nativeEvent?.key;

      if (keyCode === 23 || keyCode === 66 || key === 'Enter' || key === 'Select') {
        if (!longPressTimeoutRef.current && !isLongPressTriggeredRef.current) {
          longPressTimeoutRef.current = setTimeout(() => {
            isLongPressTriggeredRef.current = true;
            onLongPress(widget);
            longPressTimeoutRef.current = null;
          }, 450);
        }
      }
    },
    [widget, onLongPress]
  );

  const handleKeyUp = useCallback(
    (e: any) => {
      const keyCode = e.nativeEvent?.keyCode;
      const key = e.nativeEvent?.key;

      if (keyCode === 23 || keyCode === 66 || key === 'Enter' || key === 'Select') {
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }
      }
    },
    []
  );

  return (
    <Pressable
      hasTVPreferredFocus={hasTVPreferredFocus}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }
        isLongPressTriggeredRef.current = false;
      }}
      onPress={handlePress}
      // @ts-ignore TV remote key event handlers
      onKeyDown={handleKeyDown}
      // @ts-ignore
      onKeyUp={handleKeyUp}
      style={({ pressed }) => [
        styles.cardContainer,
        { width, height },
        isFocused && styles.cardFocused,
        pressed && styles.cardPressed,
      ]}
    >
      {/* 1. Native Live Widget RemoteViews */}
      <View style={styles.widgetViewport}>
        {widget.appWidgetId && widget.appWidgetId > 0 ? (
          <AppWidgetView
            style={styles.nativeWidget}
            appWidgetId={widget.appWidgetId}
            packageName={widget.packageName}
            className={widget.className}
            clickToken={clickToken}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>{isCamera ? '📹' : '🔌'}</Text>
            <Text style={styles.placeholderText}>{displayName}</Text>
            <Text style={styles.placeholderSubtext}>Unbound Widget</Text>
          </View>
        )}
      </View>

      {/* 2. Cinematic Bottom Gradient Title Overlay */}
      {!hideTitle && (
        <View style={styles.bottomOverlay}>
          <View style={styles.titleRow}>
            {isCamera && <View style={styles.liveIndicator} />}
            <Text style={styles.titleText} numberOfLines={1} ellipsizeMode="tail">
              {displayName}
            </Text>
          </View>
          <Text style={styles.subtitleText} numberOfLines={1}>
            {isCamera ? '1080p HD • Tap for Live' : 'Smart Control'}
          </Text>
        </View>
      )}

      {/* 3. Focused Highlight Ring */}
      {isFocused && <View style={styles.focusRing} />}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 18,
    backgroundColor: '#121620',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 20,
    justifyContent: 'space-between',
    elevation: 4,
  },
  cardFocused: {
    transform: [{ scale: 1.04 }],
    borderColor: '#38bdf8',
    borderWidth: 3.5,
    elevation: 12,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  widgetViewport: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0c0f17',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativeWidget: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholderSubtext: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 14, 23, 0.82)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
  },
  subtitleText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  focusRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    pointerEvents: 'none',
  },
});
