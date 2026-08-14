import { NativeModules } from 'react-native';

export interface WidgetProviderInfo {
  packageName: string;
  className: string;
  label: string;
  minWidth: number;
  minHeight: number;
  minResizeWidth: number;
  minResizeHeight: number;
  hasConfigure?: boolean;
}

const { AppWidgetModule } = NativeModules;

export async function configureWidget(appWidgetId: number): Promise<boolean> {
  if (!AppWidgetModule || typeof AppWidgetModule.configureWidget !== 'function' || appWidgetId <= 0) {
    return false;
  }
  try {
    return await AppWidgetModule.configureWidget(appWidgetId);
  } catch (error) {
    console.error(`Failed to configure appWidgetId ${appWidgetId}:`, error);
    return false;
  }
}

export async function getInstalledProviders(): Promise<WidgetProviderInfo[]> {
  if (!AppWidgetModule || typeof AppWidgetModule.getInstalledProviders !== 'function') {
    console.warn('AppWidgetModule.getInstalledProviders is not available on this platform.');
    return [];
  }
  try {
    const providers: WidgetProviderInfo[] = await AppWidgetModule.getInstalledProviders();
    return providers;
  } catch (error) {
    console.error('Error fetching installed widget providers:', error);
    return [];
  }
}

export async function launchApp(packageName: string): Promise<boolean> {
  if (!AppWidgetModule || typeof AppWidgetModule.launchApp !== 'function') {
    console.warn('AppWidgetModule.launchApp is not available on this platform.');
    return false;
  }
  try {
    return await AppWidgetModule.launchApp(packageName);
  } catch (error) {
    console.error(`Failed to launch app ${packageName}:`, error);
    return false;
  }
}

export async function launchWidgetClick(packageName: string, appWidgetId: number = -1): Promise<boolean> {
  if (!AppWidgetModule || typeof AppWidgetModule.launchWidgetClick !== 'function') {
    return launchApp(packageName);
  }
  try {
    return await AppWidgetModule.launchWidgetClick(packageName, appWidgetId);
  } catch (error) {
    console.error(`Failed launchWidgetClick for ${packageName}:`, error);
    return launchApp(packageName);
  }
}

export async function saveSetting(key: string, value: string): Promise<boolean> {
  if (!AppWidgetModule || typeof AppWidgetModule.saveSetting !== 'function') {
    return false;
  }
  try {
    return await AppWidgetModule.saveSetting(key, value);
  } catch (error) {
    console.error(`Failed to save setting ${key}:`, error);
    return false;
  }
}

export async function getSetting(key: string): Promise<string | null> {
  if (!AppWidgetModule || typeof AppWidgetModule.getSetting !== 'function') {
    return null;
  }
  try {
    return await AppWidgetModule.getSetting(key);
  } catch (error) {
    console.error(`Failed to get setting ${key}:`, error);
    return null;
  }
}

export async function allocateAppWidgetId(): Promise<number> {
  if (!AppWidgetModule || typeof AppWidgetModule.allocateAppWidgetId !== 'function') {
    return -1;
  }
  try {
    return await AppWidgetModule.allocateAppWidgetId();
  } catch (error) {
    console.error('Failed to allocate appWidgetId:', error);
    return -1;
  }
}

export async function deleteAppWidgetId(appWidgetId: number): Promise<boolean> {
  if (!AppWidgetModule || typeof AppWidgetModule.deleteAppWidgetId !== 'function' || appWidgetId <= 0) {
    return false;
  }
  try {
    return await AppWidgetModule.deleteAppWidgetId(appWidgetId);
  } catch (error) {
    console.error(`Failed to delete appWidgetId ${appWidgetId}:`, error);
    return false;
  }
}

export interface PreviewCameraPayload {
  id: string;
  name: string;
  description?: string;
  appWidgetId?: number;
}

export async function publishPreviewChannel(cameras: PreviewCameraPayload[]): Promise<number> {
  if (!AppWidgetModule || typeof AppWidgetModule.publishPreviewChannel !== 'function') {
    return -1;
  }
  try {
    return await AppWidgetModule.publishPreviewChannel(cameras);
  } catch (error) {
    console.error('Failed to publish preview channel:', error);
    return -1;
  }
}
