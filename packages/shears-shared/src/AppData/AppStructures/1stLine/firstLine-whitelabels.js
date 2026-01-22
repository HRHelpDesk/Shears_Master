export const firstLineWhitelabels = [
  {
    whiteLabel: 'firstline',
    displayName: '1st Line Services',
    app: 'firstline',
    themeColors: {
      light: {
        primary: '#00D4FF',        // Bright cyan from logo
        secondary: '#F5C344',      // Gold from logo text
        accent: '#0EA5E9',         // Deeper cyan for accents
        background: '#F9FAFB',     // Light gray-white
        surface: '#FFFFFF',        // Pure white
        surfaceVariant: '#F3F4F6', // Very subtle gray
        text: '#1F2937',           // Dark navy-gray
        textSecondary: '#6B7280',  // Medium gray
        textLight: '#9CA3AF',      // Light gray
        primaryContainer: '#E0F7FF', // Light cyan container
        secondaryContainer: '#FEF3C7', // Light gold container
        error: '#EF4444',          // Red for errors
        onPrimary: '#1F2937',      // Dark text on cyan
        onSecondary: '#1F2937',    // Dark text on gold
        onSurface: '#1F2937',      // Dark text on white
        border: '#E5E7EB',         // Soft border
        borderLight: '#F3F4F6',    // Lighter border
        disabled: '#D1D5DB',       // Gray disabled
        // Input specific
        inputBackground: '#FFFFFF',
        inputBorder: '#E5E7EB',
        inputFocusBorder: '#00D4FF',
      },
      dark: {
        primary: '#00D4FF',        // Bright cyan (consistent)
        secondary: '#F5C344',      // Gold (consistent)
        accent: '#38BDF8',         // Lighter cyan for dark mode
        background: '#1F2937',     // Dark navy from logo
        surface: '#374151',        // Dark gray
        surfaceVariant: '#2D3748', // Slightly lighter
        text: '#F9FAFB',           // Light gray-white
        textSecondary: '#D1D5DB',  // Medium gray
        textLight: '#9CA3AF',      // Dimmed gray
        primaryContainer: '#0EA5E9', // Darker cyan container
        secondaryContainer: '#D97706', // Darker gold container
        error: '#F87171',          // Soft red
        onPrimary: '#1F2937',      // Dark text on cyan
        onSecondary: '#1F2937',    // Dark text on gold
        onSurface: '#F9FAFB',      // Light text on dark
        border: '#4B5563',         // Dark border
        borderLight: '#374151',    // Subtle border
        disabled: '#6B7280',       // Muted disabled
        // Input specific
        inputBackground: '#374151',
        inputBorder: '#4B5563',
        inputFocusBorder: '#00D4FF',
      },

      // Spacing system (multiply by 8)
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
      },

      // Border radius
      radius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        full: 9999,
      },
    },
  },
];
