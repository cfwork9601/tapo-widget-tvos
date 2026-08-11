import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { WidgetProviderInfo } from '../services/WidgetProviderService';

interface TapoProviderPickerModalProps {
  visible: boolean;
  providers: WidgetProviderInfo[];
  onSelectProvider: (provider: WidgetProviderInfo) => void;
  onClose: () => void;
}

interface ProviderCardProps {
  provider: WidgetProviderInfo;
  isFirst: boolean;
  onSelect: () => void;
}

function ProviderCard({ provider, isFirst, onSelect }: ProviderCardProps) {
  const [isFocused, setIsFocused] = useState(false);
  const shortClassName = provider.className.split('.').pop() || provider.className;
  const displayLabel = provider.label || shortClassName;

  return (
    <Pressable
      focusable={true}
      hasTVPreferredFocus={isFirst}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={onSelect}
      style={[
        styles.providerItem,
        isFocused ? styles.providerItemFocused : null,
      ]}
    >
      <View style={styles.providerItemHeader}>
        <Text style={[styles.providerLabel, isFocused ? styles.providerLabelFocused : null]}>
          {displayLabel}
        </Text>
        <View style={styles.dimensionsBadge}>
          <Text style={styles.dimensionsText}>
            {provider.minWidth}×{provider.minHeight} dp
          </Text>
        </View>
      </View>
      <Text style={styles.providerClass} numberOfLines={1} ellipsizeMode="tail">
        {provider.className}
      </Text>
    </Pressable>
  );
}

export default function TapoProviderPickerModal({
  visible,
  providers,
  onSelectProvider,
  onClose,
}: TapoProviderPickerModalProps) {
  const tapoProviders = providers.filter((p) => p.packageName === 'com.tplink.iot');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Tapo Widget</Text>
            <Text style={styles.subtitle}>
              Select an installed TP-Link Tapo widget provider ({tapoProviders.length} available)
            </Text>
          </View>

          {tapoProviders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Tapo Widgets Found</Text>
              <Text style={styles.emptySubtitle}>
                No app-widget providers from package com.tplink.iot were detected on this Android TV device.
              </Text>
              <Text style={styles.emptyHint}>
                Ensure the TP-Link Tapo application is installed and updated.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.providerList} contentContainerStyle={styles.providerListContent}>
              {tapoProviders.map((provider, index) => (
                <ProviderCard
                  key={`${provider.packageName}-${provider.className}`}
                  provider={provider}
                  isFirst={index === 0}
                  onSelect={() => {
                    onSelectProvider(provider);
                    onClose();
                  }}
                />
              ))}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Pressable
              focusable={true}
              style={({ pressed }) => [styles.closeBtn, pressed ? styles.closeBtnPressed : null]}
              onPress={onClose}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    color: '#fca5a5',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#cbd5e1',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  providerList: {
    maxHeight: 340,
    marginVertical: 8,
  },
  providerListContent: {
    gap: 10,
    paddingVertical: 4,
  },
  providerItem: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  providerItemFocused: {
    borderColor: '#38bdf8',
    backgroundColor: '#0284c7',
    transform: [{ scale: 1.02 }],
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  providerItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  providerLabelFocused: {
    color: '#ffffff',
  },
  dimensionsBadge: {
    backgroundColor: '#1e293b',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  dimensionsText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  providerClass: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  closeBtnPressed: {
    backgroundColor: '#475569',
  },
  closeBtnText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
});
