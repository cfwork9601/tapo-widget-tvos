import React, { useState, useEffect, memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useWidgetStore } from '../stores/widgetStore';
import TVFocusGuide from './TVFocusGuide';

interface ControlBtnProps {
  label: string;
  active?: boolean;
  hasTVPreferredFocus?: boolean;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export const ControlButton = memo(function ControlButton({
  label,
  active,
  hasTVPreferredFocus,
  onPress,
  variant = 'secondary',
}: ControlBtnProps) {
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
});

export const TopBar = memo(function TopBar({ onOpenPicker }: { onOpenPicker: () => void }) {
  const providers = useWidgetStore((state) => state.providers);
  const loading = useWidgetStore((state) => state.loading);
  const layoutMode = useWidgetStore((state) => state.layoutMode);
  const tilesPerRow = useWidgetStore((state) => state.tilesPerRow);
  const widgetOperationError = useWidgetStore((state) => state.widgetOperationError);
  const setLayoutMode = useWidgetStore((state) => state.setLayoutMode);
  const setTilesPerRow = useWidgetStore((state) => state.setTilesPerRow);

  const [currentTime, setCurrentTime] = useState<string>('');

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

  const tapoProvidersCount = providers.filter((p) => p.packageName === 'com.tplink.iot').length;

  return (
    <TVFocusGuide trapFocusUp={true} style={styles.topBarContainer}>
      <View style={styles.headerInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Tapo Widget Hub</Text>
          {currentTime ? <Text style={styles.clockText}>{currentTime}</Text> : null}
        </View>
        <Text style={styles.subtitle}>
          {loading
            ? 'Enumerating Installed Providers...'
            : `Device Providers: ${providers.length} total (${tapoProvidersCount} TP-Link)`}
        </Text>
        {widgetOperationError ? (
          <Text style={styles.operationError}>{widgetOperationError}</Text>
        ) : null}
      </View>

      <TVFocusGuide autoFocus={false} style={styles.settingsToolbar}>
        {/* Widget Action Buttons */}
        <View style={styles.toolbarSection}>
          <ControlButton
            label="+ Add Tapo Widget"
            variant="primary"
            hasTVPreferredFocus={true}
            onPress={onOpenPicker}
          />
        </View>

        {/* Layout Mode Selector (Grid vs Slider) */}
        <View style={styles.toolbarSection}>
          <Text style={styles.sectionLabel}>Mode:</Text>
          <View style={styles.toggleGroup}>
            <ControlButton
              label="⊞ Grid"
              active={layoutMode === 'grid'}
              onPress={() => setLayoutMode('grid')}
            />
            <ControlButton
              label="⇄ Slider"
              active={layoutMode === 'slide'}
              onPress={() => setLayoutMode('slide')}
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
              onPress={() => setTilesPerRow(2)}
            />
            <ControlButton
              label="3"
              active={tilesPerRow === 3}
              onPress={() => setTilesPerRow(3)}
            />
            <ControlButton
              label="4"
              active={tilesPerRow === 4}
              onPress={() => setTilesPerRow(4)}
            />
          </View>
        </View>
      </TVFocusGuide>
    </TVFocusGuide>
  );
});

const styles = StyleSheet.create({
  topBarContainer: {
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  clockText: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: '700',
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
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
    borderColor: '#89b4fa',
    borderWidth: 2.5,
    backgroundColor: '#0284c7',
    transform: [{ scale: 1.06 }],
    shadowColor: '#89b4fa',
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
});
