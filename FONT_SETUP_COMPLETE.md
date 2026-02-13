# Font Configuration Implementation Guide

## Overview
Successfully integrated the three local fonts from `storage/fonts/` into the pdfme design system:
- **Montserrat-Regular.ttf** (fallback font for general use)
- **Montserrat-Bold.ttf** (for bold text)
- **Montserrat-MediumItalic.ttf** (for italic text)

## Files Created

### 1. [src/lib/fontConfig.ts](src/lib/fontConfig.ts)
Central font configuration file that exports:

```typescript
// Font object for pdfme generator and UI (uses local font files)
fontConfig: Font = {
  Montserrat: { data: '/storage/fonts/Montserrat-Regular.ttf', fallback: true },
  'Montserrat-Bold': { data: '/storage/fonts/Montserrat-Bold.ttf' },
  'Montserrat-Italic': { data: '/storage/fonts/Montserrat-MediumItalic.ttf' }
}

// UI font options for browser preview (uses Google Fonts)
uiFontOptions = {
  fonts: [{ name: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700&display=swap' }]
}

// Default font name constant
DEFAULT_FONT_NAME = 'Montserrat'
```

## Files Modified

### 1. [src/components/PdfmeDesignerWrapper.tsx](src/components/PdfmeDesignerWrapper.tsx)
**Changes:**
- Added import: `import { fontConfig, uiFontOptions } from '@/lib/fontConfig';`
- Updated Designer initialization to include fonts:
  ```typescript
  options: {
    ...options,
    font: fontConfig,
    ...uiFontOptions,
  }
  ```

**Impact:** Designer now uses local fonts for PDF generation and Google Fonts for browser preview.

---

### 2. [src/lib/generatePdfmeCard.ts](src/lib/generatePdfmeCard.ts)
**Changes:**
- Added import: `import { fontConfig, DEFAULT_FONT_NAME } from '@/lib/fontConfig';`
- Updated customText defaultSchema to use `DEFAULT_FONT_NAME`
- Updated `generate()` function call to include font options:
  ```typescript
  const pdfBuffer = await generate({ 
    template, 
    inputs, 
    plugins: { text: customText, image: customImage },
    options: { font: fontConfig }  // ← Added this
  });
  ```

**Impact:** PDF generation now uses the local Montserrat fonts consistently.

---

### 3. [src/pages/TemplateDesigner.tsx](src/pages/TemplateDesigner.tsx)
**Changes:**
- Added import: `import { uiFontOptions, DEFAULT_FONT_NAME } from '@/lib/fontConfig';`
- Updated template schema loading to use `DEFAULT_FONT_NAME`
- Updated field drop handler to use `DEFAULT_FONT_NAME`
- Updated PdfmeDesignerWrapper options:
  ```typescript
  options={{ 
    zoomLevel: 1, 
    sidebarOpen: true,
    ...uiFontOptions,  // ← Replaced hardcoded fonts array
  }}
  ```

**Impact:** Template designer consistently uses the configured fonts.

---

## Font Usage

### Local Fonts (Production/PDF Generation)
- **Path:** `/storage/fonts/`
- **Format:** TTF files
- Used by: `generatePdfmeCard.ts`
- Provides: Actual font embedding in generated PDFs

### Google Fonts (UI Preview)
- **URL:** `https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700&display=swap`
- Used by: Designer, Form, and Viewer UI components
- Provides: Visual preview in the browser without needing the actual font files

### Fallback Strategy
- `Montserrat` (Regular) is set as **fallback: true**
- Used when text fields don't specify a fontName
- Weight options: 300 (light), 400 (regular), 700 (bold)

---

## Usage in Components

### In Template Designer
```tsx
const newField = {
  fontName: DEFAULT_FONT_NAME,  // Uses 'Montserrat'
  fontSize: 12,
  bold: false,
};
```

### In PDF Generation
```typescript
await generate({
  template,
  inputs,
  options: { font: fontConfig }  // Local fonts embedded
});
```

### In Designer Initialization
```typescript
new Designer({
  domContainer,
  template,
  options: {
    font: fontConfig,
    ...uiFontOptions
  }
});
```

---

## Benefits

✅ **Centralized Configuration** - Single source of truth for font settings
✅ **Consistency** - Same fonts used across Designer, Form, and generation
✅ **Local Fonts** - PDFs use actual Montserrat fonts from storage
✅ **Browser Support** - UI preview uses Google Fonts for compatibility
✅ **Easy Maintenance** - Change fonts in one place affects all components
✅ **Multiple Variants** - Support for Regular, Bold, and Italic weights

---

## Integration Points

1. **Template Loading** - Normalizes old templates to use DEFAULT_FONT_NAME
2. **Field Creation** - New fields automatically use DEFAULT_FONT_NAME
3. **PDF Generation** - Embeds local fonts for consistent rendering
4. **Designer UI** - Uses Google Fonts for real-time preview

---

## Notes

- The fonts are automatically loaded from the public storage directory
- No additional npm packages required
- Backward compatible with existing templates
- Fonts are lazy-loaded only when needed
