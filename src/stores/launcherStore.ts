import { create } from 'zustand';
import { launchApp } from '../services/WidgetProviderService';

export interface AppShortcut {
  packageName: string;
  appName: string;
  icon?: string;
  isFavorite?: boolean;
}

interface LauncherState {
  installedApps: AppShortcut[];
  overscanPadding: { horizontal: number; vertical: number };
  displayDensity: number;

  // Actions
  launchApplication: (packageName: string) => Promise<boolean>;
  setOverscanPadding: (horizontal: number, vertical: number) => void;
}

export const useLauncherStore = create<LauncherState>((set) => ({
  installedApps: [],
  overscanPadding: { horizontal: 48, vertical: 32 }, // 6% Safe TV Overscan padding
  displayDensity: 309,

  launchApplication: async (packageName: string) => {
    try {
      return await launchApp(packageName);
    } catch (err) {
      console.warn('Failed launching app:', packageName, err);
      return false;
    }
  },

  setOverscanPadding: (horizontal: number, vertical: number) => {
    set({ overscanPadding: { horizontal, vertical } });
  },
}));
