import React, { useState, useEffect, memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  BackHandler,
} from 'react-native';
import { useWidgetStore } from '../stores/widgetStore';
import TVFocusGuide from './TVFocusGuide';

interface DrawerOptionProps {
  label: string;
  description?: string;
  isSelected?: boolean;
  hasTVPreferredFocus?: boolean;
  variant?: 'default' | 'primary' | 'danger';
  onPress: () => void;
}

const DrawerOptionButton = memo(function DrawerOptionButton({
  label,
  description,
  isSelected,
  hasTVPreferredFocus,
  variant = 'default',
  onPress,
}: DrawerOptionProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      focusable={true}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={onPress}
      style={[
        styles.optionBtn,
        variant === 'primary' ? styles.optionBtnPrimary : null,
        isSelected ? styles.optionBtnSelected : null,
        isFocused ? styles.optionBtnFocused : null,
      ]}
    >
      <View style={styles.optionContent}>
        <Text
          style={[
            styles.optionText,
            isSelected ? styles.optionTextSelected : null,
            isFocused ? styles.optionTextFocused : null,
          ]}
        >
          {label}
        </Text>
        {description ? (
          <Text
            style={[
              styles.optionDesc,
              isFocused ? styles.optionDescFocused : null,
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

export const SettingsDrawer = memo(function SettingsDrawer({
  onOpenPicker,
}: {
  onOpenPicker: () => void;
}) {
  const isOpen = useWidgetStore((state) => state.isSettingsDrawerOpen);
  const setIsOpen = useWidgetStore((state) => state.setIsSettingsDrawerOpen);
  const layoutMode = useWidgetStore((state) => state.layoutMode);
  const tilesPerRow = useWidgetStore((state) => state.tilesPerRow);
  const providers = useWidgetStore((state) => state.providers);
  const activeWidgets = useWidgetStore((state) => state.activeWidgets);
  const setLayoutMode = useWidgetStore((state) => state.setLayoutMode);
  const setTilesPerRow = useWidgetStore((state) => state.setTilesPerRow);

  const [isCloseFocused, setIsCloseFocused] = useState(false);

  // Handle hardware BACK button to close drawer without exiting app
  useEffect(() => {
    if (!isOpen) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setIsOpen(false);
      return true; // prevent default back navigation
    });

    return () => backHandler.remove();
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const tapoCount = providers.filter((p) => p.packageName === 'com.tplink.iot').length;

  return (
    <View style={styles.absoluteOverlayContainer} pointerEvents="box-none">
      {/* Outside click area */}
      <Pressable
        style={styles.outsideOverlay}
        onPress={() => setIsOpen(false)}
        pointerEvents="auto"
      />

      {/* Slide-over Drawer Panel */}
      <TVFocusGuide
        autoFocus={true}
        trapFocusLeft={true}
        trapFocusRight={true}
        style={styles.drawerContainer}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View>
              <Text style={styles.drawerTitle}>⚙ Settings</Text>
              <Text style={styles.drawerSubtitle}>Tapo Widget Hub Configuration</Text>
            </View>
            <Pressable
              focusable={true}
              onFocus={() => setIsCloseFocused(true)}
              onBlur={() => setIsCloseFocused(false)}
              onPress={() => setIsOpen(false)}
              style={[
                styles.closeBtn,
                isCloseFocused ? styles.closeBtnFocused : null,
              ]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* SECTION 1: Widget Management */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>🧩 Widget Management</Text>
            <DrawerOptionButton
              label="+ Add New Tapo Widget"
              description="Browse installed TP-Link Tapo camera, plug, and bulb widgets"
              variant="primary"
              hasTVPreferredFocus={true}
              onPress={() => {
                setIsOpen(false);
                onOpenPicker();
              }}
            />
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>
                Active: {activeWidgets.length} card{activeWidgets.length === 1 ? '' : 's'} | Inventory: {providers.length} total ({tapoCount} Tapo)
              </Text>
            </View>
          </View>

          {/* SECTION 2: Layout Style */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>📐 Layout Style</Text>
            <DrawerOptionButton
              label={`⊞ Grid Mode ${layoutMode === 'grid' ? '✓' : ''}`}
              description="Display active widgets in a multi-column wrapping grid"
              isSelected={layoutMode === 'grid'}
              onPress={() => setLayoutMode('grid')}
            />
            <DrawerOptionButton
              label={`⇄ Slider Carousel ${layoutMode === 'slide' ? '✓' : ''}`}
              description="Display active widgets in a horizontal scrolling rail"
              isSelected={layoutMode === 'slide'}
              onPress={() => setLayoutMode('slide')}
            />
          </View>

          {/* SECTION 3: Grid Columns Density */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>🔲 Grid Columns (Tiles / Row)</Text>
            <DrawerOptionButton
              label={`2 Columns — Large Cards ${tilesPerRow === 2 ? '✓' : ''}`}
              description="Best for 1080p screens and primary camera monitoring"
              isSelected={tilesPerRow === 2}
              onPress={() => setTilesPerRow(2)}
            />
            <DrawerOptionButton
              label={`3 Columns — Balanced ${tilesPerRow === 3 ? '✓' : ''}`}
              description="Optimal layout for 3 to 6 camera systems"
              isSelected={tilesPerRow === 3}
              onPress={() => setTilesPerRow(3)}
            />
            <DrawerOptionButton
              label={`4 Columns — Compact ${tilesPerRow === 4 ? '✓' : ''}`}
              description="Maximum card density for 4K large TV displays"
              isSelected={tilesPerRow === 4}
              onPress={() => setTilesPerRow(4)}
            />
          </View>

          {/* SECTION 4: TV Display & System Info */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>📺 System & TV Display</Text>
            <View style={styles.systemInfoBox}>
              <Text style={styles.systemInfoLine}>Role: Android TV HOME Launcher</Text>
              <Text style={styles.systemInfoLine}>Package: com.widgetlauncher</Text>
              <Text style={styles.systemInfoLine}>Safe Margin: 6% Overscan Protected</Text>
              <Text style={styles.systemInfoLine}>Framework: react-native-tvos / OrionTV</Text>
            </View>
          </View>
        </ScrollView>
      </TVFocusGuide>
    </View>
  );
});

const styles = StyleSheet.create({
  absoluteOverlayContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 9999,
  },
  outsideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // gentle backdrop that keeps live camera streams visible
  },
  drawerContainer: {
    width: 460,
    height: '100%',
    backgroundColor: '#1e293b',
    borderLeftWidth: 2,
    borderLeftColor: '#38bdf8',
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 32,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  drawerTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  drawerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#334155',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#475569',
  },
  closeBtnFocused: {
    borderColor: '#89b4fa',
    backgroundColor: '#0284c7',
    transform: [{ scale: 1.1 }],
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  optionBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  optionBtnPrimary: {
    backgroundColor: '#0284c7',
    borderColor: '#0ea5e9',
  },
  optionBtnSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#075985',
  },
  optionBtnFocused: {
    borderColor: '#89b4fa',
    borderWidth: 2.5,
    backgroundColor: '#0284c7',
    transform: [{ scale: 1.03 }],
    shadowColor: '#89b4fa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  optionContent: {
    flexDirection: 'column',
  },
  optionText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  optionTextFocused: {
    color: '#ffffff',
  },
  optionDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 3,
  },
  optionDescFocused: {
    color: '#e0f2fe',
  },
  infoBadge: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoBadgeText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  systemInfoBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  systemInfoLine: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
