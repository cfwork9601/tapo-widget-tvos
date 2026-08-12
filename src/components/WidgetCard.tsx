import React, { useState } from 'react';
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
  customLabel?: string;
  width?: number;
  height?: number;
  isInstalled?: boolean;
  triggerWidgetClick?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onOptions?: () => void;
  onRemove?: () => void;
  onRetryBind?: () => void;
  onOpenApp?: () => void;
  style?: ViewStyle;
}

export default function WidgetCard({
  appWidgetId,
  packageName,
  className,
  label,
  customLabel,
  width = 540,
  height = 380,
  isInstalled = true,
  triggerWidgetClick = true,
  onPress,
  onLongPress,
  onOptions,
  onRemove,
  onRetryBind,
  onOpenApp,
  style,
}: WidgetCardProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isRemoveFocused, setIsRemoveFocused] = useState<boolean>(false);
  const [isOptionsFocused, setIsOptionsFocused] = useState<boolean>(false);
  const [isRetryFocused, setIsRetryFocused] = useState<boolean>(false);
  const [isOpenAppFocused, setIsOpenAppFocused] = useState<boolean>(false);
  const [clickToken, setClickToken] = useState<number>(0);

  const displayTitle = customLabel || label || packageName;
  const hasValidId = typeof appWidgetId === 'number' && appWidgetId > 0;

  const handleCardPress = () => {
    if (isInstalled && hasValidId && triggerWidgetClick) {
      setClickToken((prev) => prev + 1);
    }
    if (onPress) {
      onPress();
    }
  };

  // State 1: Provider application is not installed on device
  if (!isInstalled) {
    return (
      <Pressable
        focusable={true}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPress={onPress}
        onLongPress={onLongPress}
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
                focusable={true}
                onFocus={() => setIsOpenAppFocused(true)}
                onBlur={() => setIsOpenAppFocused(false)}
                onPress={onOpenApp}
                style={[
                  styles.errorActionBtn,
                  isOpenAppFocused ? styles.errorActionBtnFocused : null,
                ]}
              >
                <Text style={styles.errorActionText}>Open App</Text>
              </TouchableOpacity>
            ) : null}

            {onRemove ? (
              <TouchableOpacity
                focusable={true}
                onFocus={() => setIsRemoveFocused(true)}
                onBlur={() => setIsRemoveFocused(false)}
                onPress={onRemove}
                style={[
                  styles.errorActionBtn,
                  styles.errorActionBtnDanger,
                  isRemoveFocused ? styles.errorActionBtnDangerFocused : null,
                ]}
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
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPress={onPress}
        onLongPress={onLongPress}
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
                focusable={true}
                onFocus={() => setIsRetryFocused(true)}
                onBlur={() => setIsRetryFocused(false)}
                onPress={onRetryBind}
                style={[
                  styles.errorActionBtn,
                  isRetryFocused ? styles.errorActionBtnFocused : null,
                ]}
              >
                <Text style={styles.errorActionText}>Retry Bind</Text>
              </TouchableOpacity>
            ) : null}

            {onRemove ? (
              <TouchableOpacity
                focusable={true}
                onFocus={() => setIsRemoveFocused(true)}
                onBlur={() => setIsRemoveFocused(false)}
                onPress={onRemove}
                style={[
                  styles.errorActionBtn,
                  styles.errorActionBtnDanger,
                  isRemoveFocused ? styles.errorActionBtnDangerFocused : null,
                ]}
              >
                <Text style={styles.errorActionText}>Delete</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }

  // State 3: Normal rendering active native AppWidget view with dedicated header controls
  return (
    <View
      style={[
        styles.card,
        { width, height },
        isFocused ? styles.cardFocused : null,
        style,
      ]}
    >
      {/* Top Header Control Bar */}
      <View style={styles.cardHeaderBar}>
        <View style={styles.cardHeaderTitleBox}>
          {customLabel ? <Text style={styles.customBadge}>CUSTOM</Text> : null}
          <Text style={styles.cardHeaderTitleText} numberOfLines={1}>
            {displayTitle}
          </Text>
        </View>

        <View style={styles.headerBtnRow}>
          {onOptions ? (
            <TouchableOpacity
              focusable={true}
              onFocus={() => setIsOptionsFocused(true)}
              onBlur={() => setIsOptionsFocused(false)}
              onPress={onOptions}
              style={[styles.headerBtn, isOptionsFocused ? styles.headerBtnFocused : null]}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerBtnText, isOptionsFocused ? styles.headerBtnTextFocused : null]}>⚙</Text>
            </TouchableOpacity>
          ) : null}

          {onRemove ? (
            <TouchableOpacity
              focusable={true}
              onFocus={() => setIsRemoveFocused(true)}
              onBlur={() => setIsRemoveFocused(false)}
              onPress={onRemove}
              style={[styles.headerBtn, isRemoveFocused ? styles.removeBtnFocused : null]}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerBtnText, isRemoveFocused ? styles.removeBtnTextFocused : null]}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Main Native Widget View Container */}
      <Pressable
        focusable={true}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPress={handleCardPress}
        onLongPress={onLongPress}
        style={styles.cardBody}
      >
        <NativeAppWidgetView
          style={styles.widgetView}
          appWidgetId={appWidgetId}
          packageName={packageName}
          className={className}
          clickToken={clickToken}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 0,
    margin: 6,
    borderWidth: 2,
    borderColor: '#1e293b',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    flexDirection: 'column',
  },
  cardFocused: {
    borderColor: '#38bdf8',
    borderWidth: 3,
    backgroundColor: '#0f172a',
    transform: [{ scale: 1.02 }],
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeaderBar: {
    height: 36,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    zIndex: 20,
  },
  cardHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  customBadge: {
    color: '#0f172a',
    backgroundColor: '#38bdf8',
    fontSize: 9,
    fontWeight: '900',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  cardHeaderTitleText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
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
  headerBtnFocused: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
    transform: [{ scale: 1.15 }],
  },
  removeBtnFocused: {
    backgroundColor: '#ef4444',
    borderColor: '#ffffff',
    transform: [{ scale: 1.15 }],
  },
  headerBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  headerBtnTextFocused: {
    color: '#ffffff',
  },
  removeBtnTextFocused: {
    color: '#ffffff',
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
  errorActionBtnFocused: {
    borderColor: '#38bdf8',
    backgroundColor: '#0369a1',
    transform: [{ scale: 1.05 }],
  },
  errorActionBtnDanger: {
    backgroundColor: '#7f1d1d',
  },
  errorActionBtnDangerFocused: {
    borderColor: '#fca5a5',
    backgroundColor: '#991b1b',
    transform: [{ scale: 1.05 }],
  },
  errorActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
