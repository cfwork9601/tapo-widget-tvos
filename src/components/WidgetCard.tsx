import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable, requireNativeComponent, ViewStyle } from 'react-native';

interface AppWidgetNativeProps {
  appWidgetId?: number;
  packageName?: string;
  className?: string;
  clickToken?: number;
  style?: ViewStyle;
}

const NativeAppWidgetView = requireNativeComponent<AppWidgetNativeProps>('AppWidgetView');

export interface WidgetCardProps {
  id?: string;
  appWidgetId?: number;
  packageName: string;
  className: string;
  label?: string;
  width?: number;
  height?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  onRemove?: () => void;
  style?: ViewStyle;
}

export default function WidgetCard({
  appWidgetId,
  packageName,
  className,
  label,
  width = 540,
  height = 380,
  onPress,
  onLongPress,
  onRemove,
  style,
}: WidgetCardProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isRemoveFocused, setIsRemoveFocused] = useState<boolean>(false);
  const [clickToken, setClickToken] = useState<number>(0);

  const handleCardPress = () => {
    setClickToken((prev) => prev + 1);
    if (onPress) {
      onPress();
    }
  };

  return (
    <Pressable
      focusable={true}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={handleCardPress}
      onLongPress={onLongPress}
      style={[
        styles.card,
        { width, height },
        isFocused ? styles.cardFocused : null,
        style,
      ]}
    >
      <NativeAppWidgetView
        style={styles.widgetView}
        appWidgetId={appWidgetId}
        packageName={packageName}
        className={className}
        clickToken={clickToken}
      />
      {onRemove ? (
        <TouchableOpacity
          focusable={true}
          onFocus={() => setIsRemoveFocused(true)}
          onBlur={() => setIsRemoveFocused(false)}
          onPress={onRemove}
          style={[styles.removeBtn, isRemoveFocused ? styles.removeBtnFocused : null]}
          activeOpacity={0.7}
        >
          <Text style={[styles.removeBtnText, isRemoveFocused ? styles.removeBtnTextFocused : null]}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 0,
    margin: 6,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
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
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  removeBtnFocused: {
    backgroundColor: '#ef4444',
    borderColor: '#ffffff',
    transform: [{ scale: 1.15 }],
  },
  removeBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  removeBtnTextFocused: {
    color: '#ffffff',
  },
  widgetView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
