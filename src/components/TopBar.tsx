import React, { useState, useEffect, memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useWidgetStore } from '../stores/widgetStore';
import TVFocusGuide from './TVFocusGuide';

export const TopBar = memo(function TopBar({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isSettingsFocused, setIsSettingsFocused] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TVFocusGuide trapFocusUp={true} style={styles.topBarContainer}>
      {/* Left: App Title & Status */}
      <View style={styles.leftSection}>
        <Text style={styles.titleIcon}>🏠</Text>
        <Text style={styles.title}>Tapo Hub</Text>
      </View>

      {/* Center: Digital Clock */}
      <View style={styles.centerSection}>
        {currentTime ? <Text style={styles.clockText}>{currentTime}</Text> : null}
      </View>

      {/* Right: Settings Drawer Trigger */}
      <View style={styles.rightSection}>
        <Pressable
          focusable={true}
          onFocus={() => setIsSettingsFocused(true)}
          onBlur={() => setIsSettingsFocused(false)}
          onPress={onOpenSettings}
          style={[
            styles.settingsBtn,
            isSettingsFocused ? styles.settingsBtnFocused : null,
          ]}
        >
          <Text style={styles.settingsBtnIcon}>⚙</Text>
          <Text
            style={[
              styles.settingsBtnText,
              isSettingsFocused ? styles.settingsBtnTextFocused : null,
            ]}
          >
            Settings
          </Text>
        </Pressable>
      </View>
    </TVFocusGuide>
  );
});

const styles = StyleSheet.create({
  topBarContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    fontSize: 20,
  },
  title: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockText: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#475569',
  },
  settingsBtnFocused: {
    borderColor: '#89b4fa',
    borderWidth: 2,
    backgroundColor: '#0284c7',
    transform: [{ scale: 1.06 }],
    shadowColor: '#89b4fa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  settingsBtnIcon: {
    fontSize: 14,
    color: '#ffffff',
  },
  settingsBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  settingsBtnTextFocused: {
    color: '#ffffff',
  },
});
