export const SITE_APPEARANCE_STORAGE_KEY = 'pretend-terminal-demo:appearance';

export type SiteAppearance = 'system' | 'dark' | 'light';
export type ResolvedSiteAppearance = Exclude<SiteAppearance, 'system'>;

export function normalizeStoredAppearance(value: string | null): SiteAppearance {
  return value === 'dark' || value === 'light' ? value : 'system';
}

export function resolveAppearance(
  preference: SiteAppearance,
  prefersDark: boolean,
): ResolvedSiteAppearance {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light';
  }

  return preference;
}

export function readSiteAppearance(): SiteAppearance {
  try {
    return normalizeStoredAppearance(window.localStorage.getItem(SITE_APPEARANCE_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

export function writeSiteAppearance(preference: SiteAppearance): void {
  try {
    if (preference === 'system') {
      window.localStorage.removeItem(SITE_APPEARANCE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(SITE_APPEARANCE_STORAGE_KEY, preference);
    }
  } catch {
    // Appearance controls remain usable when storage is unavailable.
  }
}

export function applySiteAppearance(appearance: ResolvedSiteAppearance): void {
  document.documentElement.dataset.siteAppearance = appearance;
  document.documentElement.style.colorScheme = appearance;
}
