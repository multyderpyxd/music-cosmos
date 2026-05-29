export interface FeatureFlags {
  enableWebWorkers: boolean;
  enableLayoutCache: boolean;
  enableBloom: boolean;
  enableAsteroidBelt: boolean;
  enableFocusMode: boolean;
  enableImportPanel: boolean;
  showFpsCounter: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  enableWebWorkers: false,
  enableLayoutCache: true,
  enableBloom: true,
  enableAsteroidBelt: true,
  enableFocusMode: true,
  enableImportPanel: true,
  showFpsCounter: false,
};
