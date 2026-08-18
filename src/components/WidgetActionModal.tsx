import React, { useState, memo } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ScrollView } from 'react-native';
import {
  useWidgetStore,
  WIDGET_ACTION_OPTIONS,
  getWidgetClickAction,
  getWidgetClickActionOption,
  WidgetClickAction,
} from '../stores/widgetStore';
import { launchApp } from '../services/WidgetProviderService';

interface ModalOptionButtonProps {
  label: string;
  description?: string;
  isSelected?: boolean;
  isDanger?: boolean;
  hasTVPreferredFocus?: boolean;
  onPress: () => void;
}

const ModalOptionButton = memo(function ModalOptionButton({
  label,
  description,
  isSelected,
  isDanger,
  hasTVPreferredFocus,
  onPress,
}: ModalOptionButtonProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      focusable={true}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={onPress}
      style={[
        styles.modalOptionBtn,
        isSelected ? styles.modalOptionBtnSelected : null,
        isDanger ? styles.modalOptionDanger : null,
        isFocused
          ? isDanger
            ? styles.modalOptionDangerFocused
            : styles.modalOptionBtnFocused
          : null,
      ]}
    >
      <Text
        style={[
          styles.modalOptionText,
          isDanger ? styles.modalOptionDangerText : null,
          isFocused ? styles.modalOptionTextFocused : null,
        ]}
      >
        {label}
      </Text>
      {description ? (
        <Text
          style={[
            styles.modalOptionDescription,
            isFocused ? styles.modalOptionDescriptionFocused : null,
          ]}
        >
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
});

const ModalCancelButton = memo(function ModalCancelButton({
  onPress,
  label = 'Cancel',
}: {
  onPress: () => void;
  label?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      focusable={true}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={onPress}
      style={[styles.modalCancelBtn, isFocused ? styles.modalCancelBtnFocused : null]}
    >
      <Text style={[styles.modalCancelText, isFocused ? styles.modalCancelTextFocused : null]}>
        {label}
      </Text>
    </Pressable>
  );
});

export const WidgetActionModal = memo(function WidgetActionModal() {
  const selectedWidget = useWidgetStore((state) => state.selectedWidget);
  const isActionSettingsOpen = useWidgetStore((state) => state.isActionSettingsOpen);
  const setSelectedWidget = useWidgetStore((state) => state.setSelectedWidget);
  const setIsActionSettingsOpen = useWidgetStore((state) => state.setIsActionSettingsOpen);
  const updateWidgetClickAction = useWidgetStore((state) => state.updateWidgetClickAction);
  const handleRetryBind = useWidgetStore((state) => state.handleRetryBind);
  const removeWidget = useWidgetStore((state) => state.removeWidget);
  const triggerConfigure = useWidgetStore((state) => state.triggerConfigure);

  if (!selectedWidget) return null;

  const handleClose = () => {
    if (isActionSettingsOpen) {
      setIsActionSettingsOpen(false);
    } else {
      setSelectedWidget(null);
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{selectedWidget.label || 'Widget Options'}</Text>
          <Text style={styles.modalSubtext}>{selectedWidget.packageName}</Text>

          {isActionSettingsOpen ? (
            /* Click Action Settings Sub-Menu */
            <>
              <Text style={styles.actionSettingsHint}>
                Choose what happens when this card is pressed.
              </Text>
              {WIDGET_ACTION_OPTIONS.map((option, index) => {
                const isSelected = getWidgetClickAction(selectedWidget) === option.id;
                return (
                  <ModalOptionButton
                    key={option.id}
                    label={`${isSelected ? '✓ ' : ''}${option.label}`}
                    description={option.description}
                    isSelected={Boolean(isSelected)}
                    hasTVPreferredFocus={index === 0}
                    onPress={() =>
                      updateWidgetClickAction(selectedWidget.instanceId, option.id)
                    }
                  />
                );
              })}
              <ModalCancelButton label="Back" onPress={() => setIsActionSettingsOpen(false)} />
            </>
          ) : (
            /* Main Card Context Menu */
            <>
              <ModalOptionButton
                label="🎯 Select / Change Camera Device"
                hasTVPreferredFocus={true}
                onPress={() => {
                  const instId = selectedWidget.instanceId;
                  setSelectedWidget(null);
                  triggerConfigure(instId);
                }}
              />

              <ModalOptionButton
                label={`⚙ Click Action: ${getWidgetClickActionOption(selectedWidget).label}`}
                description="Choose action on short press (Live Stream, Open App, or None)"
                onPress={() => setIsActionSettingsOpen(true)}
              />

              <ModalOptionButton
                label="🔄 Retry Binding / Refresh ID"
                onPress={() => {
                  handleRetryBind(selectedWidget.instanceId);
                }}
              />

              <ModalOptionButton
                label="📱 Open Tapo App Now"
                onPress={() => {
                  const pkg = selectedWidget.packageName;
                  setSelectedWidget(null);
                  if (pkg) launchApp(pkg);
                }}
              />

              <ModalOptionButton
                label="🗑️ Delete Widget"
                isDanger={true}
                onPress={() => {
                  removeWidget(selectedWidget.instanceId);
                }}
              />

              <ModalCancelButton onPress={() => setSelectedWidget(null)} />
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: 420,
    maxHeight: '85%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtext: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 20,
  },
  actionSettingsHint: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    textAlign: 'center',
  },
  modalOptionBtn: {
    width: '100%',
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#475569',
  },
  modalOptionBtnSelected: {
    backgroundColor: '#075985',
    borderColor: '#38bdf8',
  },
  modalOptionBtnFocused: {
    borderColor: '#89b4fa',
    borderWidth: 2,
    backgroundColor: '#0284c7',
    transform: [{ scale: 1.04 }],
    shadowColor: '#89b4fa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOptionText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOptionTextFocused: {
    color: '#ffffff',
    fontWeight: '700',
  },
  modalOptionDescription: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOptionDescriptionFocused: {
    color: '#e0f2fe',
  },
  modalOptionDanger: {
    backgroundColor: '#7f1d1d',
    borderColor: '#b91c1c',
  },
  modalOptionDangerFocused: {
    borderColor: '#fca5a5',
    borderWidth: 2,
    backgroundColor: '#991b1b',
    transform: [{ scale: 1.04 }],
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOptionDangerText: {
    color: '#fca5a5',
  },
  modalCancelBtn: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  modalCancelBtnFocused: {
    borderColor: '#89b4fa',
    backgroundColor: '#334155',
    transform: [{ scale: 1.05 }],
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCancelTextFocused: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
