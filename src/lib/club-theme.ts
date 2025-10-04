/**
 * Club Theme Utilities
 *
 * Utilities for working with dynamic club branding (logo + colors)
 */

/**
 * Convert hex color to HSL format for CSS variables
 */
export function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Convert to degrees and percentages
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  // Return in HSL format for CSS variables (without hsl() wrapper)
  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

/**
 * Calculate contrast color (black or white) for given background color
 */
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  hexColor = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '222.2 84% 4.9%' : '210 40% 98%';
}

/**
 * Apply club theme to document root
 */
export function applyClubTheme(primaryColor?: string, secondaryColor?: string) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  if (primaryColor) {
    const primaryHSL = hexToHSL(primaryColor);
    const primaryForeground = getContrastColor(primaryColor);

    root.style.setProperty('--club-primary', primaryHSL);
    root.style.setProperty('--club-primary-foreground', primaryForeground);
  }

  if (secondaryColor) {
    const secondaryHSL = hexToHSL(secondaryColor);
    const secondaryForeground = getContrastColor(secondaryColor);

    root.style.setProperty('--club-secondary', secondaryHSL);
    root.style.setProperty('--club-secondary-foreground', secondaryForeground);
  }
}

/**
 * Generate inline style object for club colors
 */
export function getClubColorStyles(
  primaryColor?: string,
  secondaryColor?: string
): React.CSSProperties {
  const styles: Record<string, string> = {};

  if (primaryColor) {
    styles['--club-primary'] = hexToHSL(primaryColor);
    styles['--club-primary-foreground'] = getContrastColor(primaryColor);
  }

  if (secondaryColor) {
    styles['--club-secondary'] = hexToHSL(secondaryColor);
    styles['--club-secondary-foreground'] = getContrastColor(secondaryColor);
  }

  return styles as React.CSSProperties;
}

/**
 * Create a gradient CSS string from club colors
 */
export function getClubGradient(
  primaryColor: string,
  secondaryColor: string,
  angle: number = 135
): string {
  return `linear-gradient(${angle}deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
}
