# Cal AI Admin Panel - Theme & Style Guide

## 🎨 Overview

The Cal AI Admin Panel uses a **minimalist, modern, clean design system** with a light theme, black primary color, and white background. The design emphasizes clarity, readability, and professional aesthetics.

---

## 📋 Color Palette

### Primary Colors
Black theme with comprehensive grayscale variations (50-950):
```
primary: {
  DEFAULT: '#000000',
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
  950: '#000000',
}
```

### Accent Colors
Subtle zinc/dark gray tones for depth:
```
accent: {
  DEFAULT: '#18181b',
  light: '#3f3f46',
  lighter: '#71717a',
  lightest: '#a1a1aa',
}
```

### Background Colors
Clean white-based backgrounds with subtle variations:
```
background: {
  DEFAULT: '#ffffff',
  primary: '#ffffff',
  secondary: '#fafafa',
  tertiary: '#f5f5f5',
  hover: '#f9fafb',
  card: '#ffffff',
}
```

### Text Colors
Comprehensive text color hierarchy:
```
text: {
  primary: '#000000',        // Main text
  secondary: '#3f3f46',      // Secondary text
  tertiary: '#71717a',       // Tertiary text
  disabled: '#a1a1aa',       // Disabled state
  inverse: '#ffffff',        // Light text on dark backgrounds
  placeholder: '#9ca3af',    // Placeholder text
}
```

### Border Colors
```
border: {
  DEFAULT: '#e5e7eb',
  strong: '#000000',
  light: '#f3f4f6',
  medium: '#d1d5db',
  focus: '#000000',
}
```

### Status Colors
**Success:**
```
{
  DEFAULT: '#16a34a',
  light: '#dcfce7',
  dark: '#15803d',
  text: '#14532d',
}
```

**Error:**
```
{
  DEFAULT: '#dc2626',
  light: '#fee2e2',
  dark: '#b91c1c',
  text: '#7f1d1d',
}
```

**Warning:**
```
{
  DEFAULT: '#ea580c',
  light: '#ffedd5',
  dark: '#c2410c',
  text: '#7c2d12',
}
```

**Info:**
```
{
  DEFAULT: '#0891b2',
  light: '#e0f2fe',
  dark: '#0e7490',
  text: '#164e63',
}
```

---

## 📝 Typography

### Font Families
```
Sans Serif (Main):
"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

Monospace:
"Fira Code", "Courier New", monospace
```

### Font Sizes
```
xs:   12px (0.75rem)  | line-height: 1rem
sm:   14px (0.875rem) | line-height: 1.25rem
base: 16px (1rem)     | line-height: 1.5rem
lg:   18px (1.125rem) | line-height: 1.75rem
xl:   20px (1.25rem)  | line-height: 1.75rem
2xl:  24px (1.5rem)   | line-height: 2rem
3xl:  30px (1.875rem) | line-height: 2.25rem
4xl:  36px (2.25rem)  | line-height: 2.5rem
5xl:  48px (3rem)     | line-height: 1
```

### Font Weights
```
normal:    400
medium:    500
semibold:  600
bold:      700
```

---

## 📐 Spacing Scale

| Size | Value | Pixels |
|------|-------|--------|
| xs   | 0.25rem | 4px   |
| sm   | 0.5rem  | 8px   |
| md   | 1rem    | 16px  |
| lg   | 1.5rem  | 24px  |
| xl   | 2rem    | 32px  |
| 2xl  | 3rem    | 48px  |
| 3xl  | 4rem    | 64px  |

---

## 🔘 Border Radius

| Size | Value | Pixels |
|------|-------|--------|
| none | 0     | 0px    |
| sm   | 0.25rem | 4px  |
| DEFAULT | 0.5rem | 8px |
| md   | 0.75rem | 12px |
| lg   | 1rem    | 16px |
| xl   | 1.5rem  | 24px |
| 2xl  | 2rem    | 32px |
| full | 9999px  | Circular |

---

## 🎭 Shadows

```
sm:   0 1px 2px 0 rgb(0 0 0 / 0.05)
DEFAULT: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
md:   0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
lg:   0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
xl:   0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
2xl:  0 25px 50px -12px rgb(0 0 0 / 0.25)
inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05)
none: none
```

---

## ⚡ Transitions

```
fast:  150ms cubic-bezier(0.4, 0, 0.2, 1)
base:  200ms cubic-bezier(0.4, 0, 0.2, 1)
slow:  300ms cubic-bezier(0.4, 0, 0.2, 1)
```

---

## 📊 Z-Index Scale

| Layer | Value |
|-------|-------|
| dropdown | 1000 |
| sticky | 1020 |
| fixed | 1030 |
| modalBackdrop | 1040 |
| modal | 1050 |
| popover | 1060 |
| tooltip | 1070 |

---

## 🛠️ Configuration Files

### Tailwind Configuration (`tailwind.config.ts`)
```typescript
const config: Config = {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#000000',
                    hover: '#1f1f1f',
                },
            },
        }
    },
    plugins: []
};
```

### PostCSS Configuration (`postcss.config.cjs`)
```javascript
module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer {}
    }
};
```

### Global Styles (`src/index.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
    color-scheme: light;
}

body {
    margin: 0;
    font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-color: #ffffff;
    color: #000000;
}
```

---

## 🎯 Theme Configuration File (`src/config/theme.ts`)

The theme is centrally defined in `src/config/theme.ts` and includes:

1. **Colors** - Complete color system with status indicators
2. **Spacing** - Consistent spacing scale
3. **Border Radius** - Predefined radius values
4. **Shadows** - Shadow utilities for depth
5. **Typography** - Font families, sizes, and weights
6. **Transitions** - Animation timing functions
7. **Z-Index** - Layering guide

**Helper Function:**
```typescript
export const getThemeValue = (path: string): any => {
  return path.split('.').reduce((obj, key) => obj?.[key], theme as any);
};
```

Usage:
```typescript
getThemeValue('colors.primary.DEFAULT')  // '#000000'
getThemeValue('spacing.md')              // '1rem'
getThemeValue('typography.fontFamily.sans')
```

---

## 🎨 Design Principles

### 1. **Minimalism**
- Clean, uncluttered interface
- Whitespace as design element
- Focus on content and functionality

### 2. **Modern Aesthetics**
- Professional black and white palette
- Subtle grays for depth and hierarchy
- Contemporary typography (Inter font)

### 3. **High Contrast**
- Black text on white backgrounds
- Clear visual hierarchy
- Accessible color combinations

### 4. **Consistency**
- Unified component appearance
- Predictable spacing and sizing
- Standardized interactions

### 5. **Professionalism**
- Corporate admin panel feel
- Trustworthy and stable design
- Clear data presentation

---

## 🚀 Usage Examples

### Tailwind Classes
```html
<!-- Primary colors -->
<div class="text-black bg-white border-black">
  Primary elements
</div>

<!-- Text hierarchy -->
<p class="text-text-primary">Main text</p>
<p class="text-text-secondary">Secondary text</p>
<p class="text-text-tertiary">Tertiary text</p>

<!-- Backgrounds -->
<div class="bg-background-secondary">Secondary background</div>
<div class="bg-background-hover hover:bg-background-primary">Hover effect</div>

<!-- Status indicators -->
<div class="bg-success-light text-success-text">Success message</div>
<div class="bg-error-light text-error-text">Error message</div>
<div class="bg-warning-light text-warning-text">Warning message</div>
<div class="bg-info-light text-info-text">Info message</div>

<!-- Spacing -->
<div class="p-md m-lg">Content with padding and margin</div>

<!-- Shadows -->
<div class="shadow-lg">Elevated card</div>

<!-- Rounded corners -->
<button class="rounded-lg">Button</button>

<!-- Transitions -->
<div class="transition-base hover:bg-background-hover">Interactive element</div>
```

### Using Theme Configuration
```typescript
import { theme, getThemeValue } from './config/theme';

// Direct access
const primaryColor = theme.colors.primary.DEFAULT;
const spacing = theme.spacing.md;

// Using helper function
const bgColor = getThemeValue('colors.background.primary');
const radius = getThemeValue('borderRadius.lg');
```

---

## 📱 Responsive Considerations

- **Mobile First**: Design starts with mobile, scales up
- **Breakpoints**: Standard Tailwind breakpoints (sm, md, lg, xl, 2xl)
- **Touch Targets**: Minimum 44px for interactive elements
- **Readability**: Font sizes scale appropriately

---

## 🌐 Supported Components

The panel includes the following components with consistent theming:

- **Sidebar** - Navigation with primary color
- **Layout** - Two-column layout with proper spacing
- **Cards** - Info, offers, versions with consistent styling
- **Forms** - Inputs, modals with unified appearance
- **Tables** - Data display with alternating rows
- **Buttons** - Primary, secondary, tertiary states
- **Status Badges** - Color-coded indicators
- **Alerts** - Success, error, warning, info messages

---

## 🔄 Theme Extension

To extend the theme, modify `src/config/theme.ts`:

```typescript
export const theme = {
  colors: {
    // Add new colors here
    custom: {
      special: '#FF00FF',
    },
  },
  // Add or modify other properties
};
```

Then update `tailwind.config.ts` to include new values.

---

## 📚 Reference

- **Tailwind CSS**: https://tailwindcss.com
- **Inter Font**: https://fonts.google.com/specimen/Inter
- **Fira Code**: https://fonts.google.com/specimen/Fira+Code
- **Color Accessibility**: WCAG 2.1 AA compliant

---

**Last Updated:** 2025-10-17
**Version:** 1.0


