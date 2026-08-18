import React, { memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import WidgetCard from './WidgetCard';
import TVFocusGuide from './TVFocusGuide';
import { useWidgetStore, getWidgetClickAction, ActiveWidget } from '../stores/widgetStore';
import { launchApp } from '../services/WidgetProviderService';

export const WidgetGrid = memo(function WidgetGrid() {
  const { width: screenWidth } = useWindowDimensions();
  const providers = useWidgetStore((state) => state.providers);
  const activeWidgets = useWidgetStore((state) => state.activeWidgets);
  const layoutMode = useWidgetStore((state) => state.layoutMode);
  const tilesPerRow = useWidgetStore((state) => state.tilesPerRow);
  const loading = useWidgetStore((state) => state.loading);
  const configureTokens = useWidgetStore((state) => state.configureTokens);

  const handleCardPress = useWidgetStore((state) => state.handleCardPress);
  const setSelectedWidget = useWidgetStore((state) => state.setSelectedWidget);
  const setIsActionSettingsOpen = useWidgetStore((state) => state.setIsActionSettingsOpen);
  const removeWidget = useWidgetStore((state) => state.removeWidget);
  const handleRetryBind = useWidgetStore((state) => state.handleRetryBind);
  const handleDeviceNameDetected = useWidgetStore((state) => state.handleDeviceNameDetected);

  // Dynamic layout calculations based on tilesPerRow setting
  const containerPadding = 48; // Safe 6% margin
  const availableWidth = Math.max(screenWidth - containerPadding, 600);
  const tileMargin = 16;
  const cardWidth = Math.floor((availableWidth - tilesPerRow * tileMargin) / tilesPerRow);
  const cardHeight = Math.max(Math.floor(cardWidth * 0.65), 220);

  const handleCardOptions = (item: ActiveWidget) => {
    setIsActionSettingsOpen(false);
    setSelectedWidget(item);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (activeWidgets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No active widgets on dashboard.</Text>
        <Text style={styles.emptySubtext}>
          Use "+ Add Tapo Widget" above to place a widget card.
        </Text>
      </View>
    );
  }

  if (layoutMode === 'slide') {
    return (
      <TVFocusGuide autoFocus={true} style={styles.guideWrapper}>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slideContainer}
          nestedScrollEnabled={false}
          removeClippedSubviews={false}
        >
          {activeWidgets.map((item, index) => {
            const isInstalled =
              providers.length === 0 ||
              providers.some(
                (p) => p.packageName === item.packageName && p.className === item.className
              );
            return (
              <WidgetCard
                key={item.instanceId}
                id={item.instanceId}
                appWidgetId={item.appWidgetId}
                label={item.label}
                packageName={item.packageName}
                className={item.className}
                width={cardWidth}
                height={cardHeight}
                isInstalled={isInstalled}
                hasTVPreferredFocus={index === 0}
                triggerWidgetClick={getWidgetClickAction(item) === 'widget_primary'}
                triggerClickToken={item.triggerClickToken}
                triggerConfigureToken={configureTokens[item.instanceId] || 0}
                onDeviceNameDetected={(detected) =>
                  handleDeviceNameDetected(item.instanceId, detected)
                }
                onPress={() => handleCardPress(item)}
                onLongPress={() => handleCardOptions(item)}
                onOptions={() => handleCardOptions(item)}
                onRemove={() => removeWidget(item.instanceId)}
                onRetryBind={() => handleRetryBind(item.instanceId)}
                onOpenApp={() => launchApp(item.packageName)}
              />
            );
          })}
        </ScrollView>
      </TVFocusGuide>
    );
  }

  return (
    <TVFocusGuide autoFocus={true} style={styles.gridContainer}>
      {activeWidgets.map((item, index) => {
        const isInstalled =
          providers.length === 0 ||
          providers.some(
            (p) => p.packageName === item.packageName && p.className === item.className
          );
        return (
          <WidgetCard
            key={item.instanceId}
            id={item.instanceId}
            appWidgetId={item.appWidgetId}
            label={item.label}
            packageName={item.packageName}
            className={item.className}
            width={cardWidth}
            height={cardHeight}
            isInstalled={isInstalled}
            hasTVPreferredFocus={index === 0}
            triggerWidgetClick={getWidgetClickAction(item) === 'widget_primary'}
            triggerClickToken={item.triggerClickToken}
            triggerConfigureToken={configureTokens[item.instanceId] || 0}
            onDeviceNameDetected={(detected) =>
              handleDeviceNameDetected(item.instanceId, detected)
            }
            onPress={() => handleCardPress(item)}
            onLongPress={() => handleCardOptions(item)}
            onOptions={() => handleCardOptions(item)}
            onRemove={() => removeWidget(item.instanceId)}
            onRetryBind={() => handleRetryBind(item.instanceId)}
            onOpenApp={() => launchApp(item.packageName)}
          />
        );
      })}
    </TVFocusGuide>
  );
});

const styles = StyleSheet.create({
  centerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  guideWrapper: {
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
  },
  slideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 6,
  },
});
