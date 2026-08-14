import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { ActiveWidget } from './WidgetMediaCard';

export interface RowConfig {
  rowTitle: string;
  showRowTitle: boolean;
  cardsPerRow: 2 | 3 | 4;
  hideTitles: boolean;
}

interface WidgetRowSettingsModalProps {
  visible: boolean;
  selectedWidget: ActiveWidget | null;
  rowConfig: RowConfig;
  onUpdateRowConfig: (newConfig: RowConfig) => void;
  onUpdateWidget: (updatedWidget: ActiveWidget) => void;
  onDeleteWidget: (instanceId: string) => void;
  onPublishTvChannel: () => void;
  onClose: () => void;
}

export const WidgetRowSettingsModal: React.FC<WidgetRowSettingsModalProps> = ({
  visible,
  selectedWidget,
  rowConfig,
  onUpdateRowConfig,
  onUpdateWidget,
  onDeleteWidget,
  onPublishTvChannel,
  onClose,
}) => {
  const [editingName, setEditingName] = useState<string>(selectedWidget?.customLabel || '');

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.scrim} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.sheetTitle}>{rowConfig.rowTitle || 'Tapo Smart Home'}</Text>
            <Text style={styles.sheetSubtitle}>Media row settings</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 1. Media Cards Per Row */}
            <View style={styles.settingItem}>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Media cards per row</Text>
                <Text style={styles.settingDesc}>Adjust card size and density</Text>
              </View>
              <View style={styles.densityButtonGroup}>
                {([2, 3, 4] as const).map((count) => (
                  <Pressable
                    key={count}
                    style={({ focused }: any) => [
                      styles.densityButton,
                      rowConfig.cardsPerRow === count && styles.densityButtonActive,
                      focused && styles.buttonFocused,
                    ]}
                    onPress={() => onUpdateRowConfig({ ...rowConfig, cardsPerRow: count })}
                  >
                    <Text
                      style={[
                        styles.densityButtonText,
                        rowConfig.cardsPerRow === count && styles.densityButtonTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 2. Hide Titles Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Hide titles</Text>
                <Text style={styles.settingDesc}>Show only artwork, without the title</Text>
              </View>
              <Switch
                value={rowConfig.hideTitles}
                onValueChange={(val) => onUpdateRowConfig({ ...rowConfig, hideTitles: val })}
                thumbColor={rowConfig.hideTitles ? '#38bdf8' : '#64748b'}
                trackColor={{ false: '#334155', true: '#0284c7' }}
              />
            </View>

            {/* 3. Show Row Name Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Show row name</Text>
                <Text style={styles.settingDesc}>Display category header above cards</Text>
              </View>
              <Switch
                value={rowConfig.showRowTitle}
                onValueChange={(val) => onUpdateRowConfig({ ...rowConfig, showRowTitle: val })}
                thumbColor={rowConfig.showRowTitle ? '#38bdf8' : '#64748b'}
                trackColor={{ false: '#334155', true: '#0284c7' }}
              />
            </View>

            {/* 4. Selected Widget Customization Section */}
            {selectedWidget && (
              <View style={styles.widgetSection}>
                <Text style={styles.sectionHeader}>Selected Card: {selectedWidget.label}</Text>

                {/* Rename */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Custom Card Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingName}
                    placeholder={selectedWidget.label}
                    placeholderTextColor="#64748b"
                    onChangeText={setEditingName}
                    onEndEditing={() => {
                      if (editingName !== selectedWidget.customLabel) {
                        onUpdateWidget({ ...selectedWidget, customLabel: editingName.trim() });
                      }
                    }}
                  />
                </View>

                {/* Click Action */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>On Click Action</Text>
                  <View style={styles.actionButtonGroup}>
                    <Pressable
                      style={({ focused }: any) => [
                        styles.actionButton,
                        selectedWidget.clickAction === 'widget_primary' && styles.actionButtonActive,
                        focused && styles.buttonFocused,
                      ]}
                      onPress={() =>
                        onUpdateWidget({ ...selectedWidget, clickAction: 'widget_primary' })
                      }
                    >
                      <Text style={styles.actionButtonText}>Live View / Primary</Text>
                    </Pressable>

                    <Pressable
                      style={({ focused }: any) => [
                        styles.actionButton,
                        selectedWidget.clickAction === 'open_tapo_app' && styles.actionButtonActive,
                        focused && styles.buttonFocused,
                      ]}
                      onPress={() =>
                        onUpdateWidget({ ...selectedWidget, clickAction: 'open_tapo_app' })
                      }
                    >
                      <Text style={styles.actionButtonText}>Open Tapo App</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Delete Widget Button */}
                <Pressable
                  style={({ focused }: any) => [styles.deleteButton, focused && styles.deleteButtonFocused]}
                  onPress={() => {
                    onDeleteWidget(selectedWidget.instanceId);
                    onClose();
                  }}
                >
                  <Text style={styles.deleteButtonText}>✕ Remove Widget Card</Text>
                </Pressable>
              </View>
            )}

            {/* 5. System TV Channel Sync */}
            <View style={styles.systemChannelSection}>
              <Text style={styles.sectionHeader}>Android TV System Channels</Text>
              <Text style={styles.settingDesc}>
                Publish Tapo Live Cameras as a TV preview channel to Google TV and Monet Launcher.
              </Text>
              <Pressable
                style={({ focused }: any) => [styles.syncChannelButton, focused && styles.buttonFocused]}
                onPress={onPublishTvChannel}
              >
                <Text style={styles.syncChannelButtonText}>📺 Sync to Google TV / Monet Rows</Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Footer Close Button */}
          <Pressable
            style={({ focused }: any) => [styles.closeButton, focused && styles.buttonFocused]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  scrim: {
    flex: 1,
  },
  sheetContainer: {
    width: 460,
    height: '100%',
    backgroundColor: '#0e1422',
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    padding: 24,
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
  },
  header: {
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
  scrollContent: {
    paddingVertical: 18,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  densityButtonGroup: {
    flexDirection: 'row',
  },
  densityButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginLeft: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  densityButtonActive: {
    backgroundColor: '#0284c7',
  },
  densityButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  densityButtonTextActive: {
    color: '#ffffff',
  },
  buttonFocused: {
    borderColor: '#38bdf8',
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  widgetSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeader: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionButtonGroup: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginRight: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  actionButtonActive: {
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8',
  },
  actionButtonText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteButtonFocused: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteButtonText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '700',
  },
  systemChannelSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  syncChannelButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  syncChannelButtonText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
