import React, { useState, useRef, memo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  requireNativeComponent,
  ViewStyle,
} from 'react-native';

interface AppWidgetNativeProps {
  appWidgetId?: number;
  packageName?: string;
  className?: string;
  clickToken?: number;
  configureToken?: number;
  snapshotId?: string;
  onDeviceNameDetected?: (event: { nativeEvent: { deviceName: string; appWidgetId: number } }) => void;
  style?: ViewStyle;
}

const NATIVE_VIEW_NAME = 'AppWidgetView';
const NativeAppWidgetView =
  (globalThis as any).__AppWidgetViewComponent ||
  ((globalThis as any).__AppWidgetViewComponent = requireNativeComponent<AppWidgetNativeProps>(NATIVE_VIEW_NAME));

export interface WidgetCardProps {
  id?: string;
  appWidgetId?: number;
  packageName: string;
  className: string;
  label?: string;
  width?: number;
  height?: number;
  isInstalled?: boolean;
  triggerWidgetClick?: boolean;
  triggerClickToken?: number;
  triggerConfigureToken?: number;
  hasTVPreferredFocus?: boolean;
  nextFocusUp?: number;
  nextFocusDown?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
  onDeviceNameDetected?: (name: string) => void;
  onPress?: () => void;
  onLongPress?: () => void;
  onOptions?: () => void;
  onRemove?: () => void;
  onRetryBind?: () => void;
  onOpenApp?: () => void;
  style?: ViewStyle;
}

export const WidgetCard = memo(function WidgetCard({
  id,
  appWidgetId,
  packageName,
  className,
  label,
  width = 540,
  height = 380,
  isInstalled = true,
  triggerWidgetClick = true,
  triggerClickToken,
  triggerConfigureToken,
  hasTVPreferredFocus,
  nextFocusUp,
  nextFocusDown,
  nextFocusLeft,
  nextFocusRight,
  onDeviceNameDetected,
  onPress,
  onLongPress,
  onOptions,
  onRemove,
  onRetryBind,
  onOpenApp,
  style,
}: WidgetCardProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [clickToken, setClickToken] = useState<number>(0);
  const [configureToken, setConfigureToken] = useState<number>(0);

  const prevClickTokenRef = useRef<number | undefined>(triggerClickToken);
  const prevConfigureTokenRef = useRef<number | undefined>(triggerConfigureToken);
  const isMountedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isMountedRef.current) {
      prevClickTokenRef.current = triggerClickToken;
      return;
    }
    if (
      typeof triggerClickToken === 'number' &&
      triggerClickToken > 0 &&
      triggerClickToken !== prevClickTokenRef.current
    ) {
      prevClickTokenRef.current = triggerClickToken;
      setClickToken((prev) => prev + 1);
    }
  }, [triggerClickToken]);

  useEffect(() => {
    if (!isMountedRef.current) {
      prevConfigureTokenRef.current = triggerConfigureToken;
      isMountedRef.current = true;
      return;
    }
    if (
      typeof triggerConfigureToken === 'number' &&
      triggerConfigureToken > 0 &&
      triggerConfigureToken !== prevConfigureTokenRef.current
    ) {
      prevConfigureTokenRef.current = triggerConfigureToken;
      setConfigureToken((prev) => prev + 1);
    }
  }, [triggerConfigureToken]);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressHandledRef = useRef<boolean>(false);

  const displayTitle = label || packageName;
  const hasValidId = typeof appWidgetId === 'number' && appWidgetId > 0;

  const handleCardPress = useCallback(() => {
    if (isInstalled && hasValidId && triggerWidgetClick) {
      setClickToken((prev) => prev + 1);
    }
    if (onPress) {
      onPress();
    }
  }, [isInstalled, hasValidId, triggerWidgetClick, onPress]);

  const startLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) return;
    isLongPressHandledRef.current = false;
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        isLongPressHandledRef.current = true;
        onLongPress();
      }, 400);
    }
  }, [onLongPress]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleKeyPress = useCallback((e: any) => {
    const key = e.nativeEvent?.key;
    const keyCode = e.nativeEvent?.keyCode;

    // 1. Remote Menu Button (Key 82) -> Open Widget Options
    if (key === 'Menu' || key === 'ContextMenu' || keyCode === 82) {
      if (onOptions) {
        onOptions();
      } else if (onLongPress) {
        onLongPress();
      }
      return;
    }

    // 2. Remote Play/Pause Button (Keys 85, 126, 127) -> Launch Camera Live Stream
    if (
      key === 'MediaPlayPause' ||
      key === 'MediaPlay' ||
      key === 'MediaPause' ||
      keyCode === 85 ||
      keyCode === 126 ||
      keyCode === 127
    ) {
      handleCardPress();
      return;
    }

    // 3. Remote Select/OK Button (Keys 23, 66) -> Standard Click / Long Press Timer
    if (
      key === 'Select' ||
      key === 'Enter' ||
      key === 'space' ||
      key === '23' ||
      key === '66' ||
      keyCode === 23 ||
      keyCode === 66
    ) {
      startLongPressTimer();
    }
  }, [onOptions, onLongPress, handleCardPress, startLongPressTimer]);

  const handlePress = useCallback(() => {
    if (isLongPressHandledRef.current) {
      isLongPressHandledRef.current = false;
      return;
    }
    handleCardPress();
  }, [handleCardPress]);

  // State 1: Provider application is not installed on device
  if (!isInstalled) {
    return (
      <Pressable
        focusable={true}
        hasTVPreferredFocus={hasTVPreferredFocus}
        nextFocusUp={nextFocusUp}
        nextFocusDown={nextFocusDown}
        nextFocusLeft={nextFocusLeft}
        nextFocusRight={nextFocusRight}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPressIn={startLongPressTimer}
        onPressOut={clearLongPressTimer}
        {...({ onKeyPress: handleKeyPress } as any)}
        onPress={handlePress}
        onLongPress={onLongPress}
        delayLongPress={400}
        style={[
          styles.card,
          styles.errorCard,
          { width, height },
          isFocused ? styles.cardFocused : null,
          style,
        ]}
      >
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Provider Unavailable</Text>
          <Text style={styles.errorSubtitle} numberOfLines={2}>
            {displayTitle}
          </Text>
          <Text style={styles.errorDetail} numberOfLines={2}>
            App package {packageName} is missing on this TV.
          </Text>

          <View style={styles.errorActionRow}>
            {onOpenApp ? (
              <TouchableOpacity
                focusable={false}
                onPress={onOpenApp}
                style={styles.errorActionBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.errorActionText}>Open App</Text>
              </TouchableOpacity>
            ) : null}

            {onRemove ? (
              <TouchableOpacity
                focusable={false}
                onPress={onRemove}
                style={[styles.errorActionBtn, styles.errorActionBtnDanger]}
                activeOpacity={0.8}
              >
                <Text style={styles.errorActionText}>Delete</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }

  // State 2: Widget binding or ID allocation failed
  if (!hasValidId) {
    return (
      <Pressable
        focusable={true}
        hasTVPreferredFocus={hasTVPreferredFocus}
        nextFocusUp={nextFocusUp}
        nextFocusDown={nextFocusDown}
        nextFocusLeft={nextFocusLeft}
        nextFocusRight={nextFocusRight}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPressIn={startLongPressTimer}
        onPressOut={clearLongPressTimer}
        {...({ onKeyPress: handleKeyPress } as any)}
        onPress={handlePress}
        onLongPress={onLongPress}
        delayLongPress={400}
        style={[
          styles.card,
          styles.errorCard,
          { width, height },
          isFocused ? styles.cardFocused : null,
          style,
        ]}
      >
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>🔌</Text>
          <Text style={styles.errorTitle}>Binding Failed</Text>
          <Text style={styles.errorSubtitle} numberOfLines={2}>
            {displayTitle}
          </Text>
          <Text style={styles.errorDetail}>
            Android appWidget ID was not allocated or binding was denied.
          </Text>

          <View style={styles.errorActionRow}>
            {onRetryBind ? (
              <TouchableOpacity
                focusable={false}
                onPress={onRetryBind}
                style={styles.errorActionBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.errorActionText}>Retry Bind</Text>
              </TouchableOpacity>
            ) : null}

            {onRemove ? (
              <TouchableOpacity
                focusable={false}
                onPress={onRemove}
                style={[styles.errorActionBtn, styles.errorActionBtnDanger]}
                activeOpacity={0.8}
              >
                <Text style={styles.errorActionText}>Delete</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }

  // State 3: Normal rendering active native AppWidget view as unified single-focus card
  return (
    <Pressable
      focusable={true}
      hasTVPreferredFocus={hasTVPreferredFocus}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPressIn={startLongPressTimer}
      onPressOut={clearLongPressTimer}
      {...({ onKeyPress: handleKeyPress } as any)}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={[
        styles.card,
        { width, height },
        isFocused ? styles.cardFocused : null,
        style,
      ]}
    >
      {/* Top Header Control Bar */}
      <View style={[styles.cardHeaderBar, isFocused ? styles.cardHeaderBarFocused : null]}>
        <View style={styles.cardHeaderTitleBox}>
          <Text
            style={[styles.cardHeaderTitleText, isFocused ? styles.cardHeaderTitleTextFocused : null]}
            numberOfLines={1}
          >
            {displayTitle}
          </Text>
        </View>

        <View style={styles.headerBtnRow}>
          {onOptions ? (
            <TouchableOpacity
              focusable={false}
              onPress={onOptions}
              style={styles.headerBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.headerBtnText}>⚙</Text>
            </TouchableOpacity>
          ) : null}

          {onRemove ? (
            <TouchableOpacity
              focusable={false}
              onPress={onRemove}
              style={styles.headerBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.headerBtnText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Main Native Widget View Container */}
      <View style={styles.cardBody} pointerEvents="auto">
        <NativeAppWidgetView
          style={styles.widgetView}
          appWidgetId={appWidgetId}
          packageName={packageName}
          className={className}
          clickToken={clickToken}
          configureToken={configureToken}
          snapshotId={id}
          onDeviceNameDetected={(e: any) => {
            const detected = e.nativeEvent?.deviceName;
            if (detected && onDeviceNameDetected) {
              onDeviceNameDetected(detected);
            }
          }}
        />
      </View>
    </Pressable>
  );
});

export default WidgetCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 0,
    margin: 8,
    borderWidth: 2,
    borderColor: '#1e293b',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    flexDirection: 'column',
    transform: [{ scale: 1.0 }],
  },
  /* OrionTV High-Contrast Focus Pop */
  cardFocused: {
    borderColor: '#89b4fa',
    borderWidth: 3,
    backgroundColor: '#1e1e2e',
    transform: [{ scale: 1.06 }],
    shadowColor: '#89b4fa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 12,
  },
  cardHeaderBar: {
    height: 38,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    zIndex: 20,
  },
  cardHeaderBarFocused: {
    backgroundColor: '#0284c7',
    borderBottomColor: '#89b4fa',
    borderBottomWidth: 1.5,
  },
  cardHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  cardHeaderTitleText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  cardHeaderTitleTextFocused: {
    color: '#ffffff',
    fontWeight: '800',
  },
  headerBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    backgroundColor: '#334155',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  headerBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },

  cardBody: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  widgetView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  /* ERROR & FALLBACK CARD STYLES */
  errorCard: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorDetail: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  errorActionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  errorActionBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  errorActionBtnDanger: {
    backgroundColor: '#7f1d1d',
  },
  errorActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
