# Font Configuration Fix - PDF Generation

## Problem Found
The error "Unknown font format" was caused by incorrect font paths in fontConfig. The paths were:
- `/storage/fonts/Montserrat-Regular.ttf` ❌
- This is a local file path that pdfme cannot process

## Solution Implemented

### 1. Updated Font Paths to HTTP URLs
Changed `src/lib/fontConfig.ts` to use proper HTTP URLs:
```typescript
export const fontConfig: Font = {
  Montserrat: {
    data: 'http://localhost:3001/storage/fonts/Montserrat-Regular.ttf',  // ✅ HTTP URL
    fallback: true,
  },
  'Montserrat-Bold': {
    data: 'http://localhost:3001/storage/fonts/Montserrat-Bold.ttf',
  },
  'Montserrat-Italic': {
    data: 'http://localhost:3001/storage/fonts/Montserrat-MediumItalic.ttf',
  },
};
```

### 2. Added Server Route for Fonts
Updated `server.js` to serve the fonts directory:
```javascript
// Serve font files for pdfme
app.use('/storage/fonts', express.static(path.join(__dirname, 'storage', 'fonts')));
```

### 3. Enhanced Error Handling
Updated `src/lib/generatePdfmeCard.ts` with:
- Better debugging logs showing font URLs
- Detailed error messages
- Input validation

### 4. Font Files Verified
✅ All three fonts exist in `storage/fonts/`:
- Montserrat-Regular.ttf
- Montserrat-Bold.ttf
- Montserrat-MediumItalic.ttf

## How It Works Now

1. **PDF Generation Request** → Admin clicks "Download Card"
2. **Font Loading** → pdfme fetches fonts from HTTP URLs:
   - `http://localhost:3001/storage/fonts/Montserrat-Regular.ttf`
   - `http://localhost:3001/storage/fonts/Montserrat-Bold.ttf`
   - `http://localhost:3001/storage/fonts/Montserrat-MediumItalic.ttf`
3. **Server Response** → Fonts are delivered as binary TTF files
4. **Font Embedding** → pdfme embeds fonts into the PDF
5. **PDF Generation** → Text renders with proper Montserrat fonts

## Testing Checklist

Before using in production:

1. ✅ Start the template server:
   ```bash
   node server.js
   ```

2. ✅ Start the dev server:
   ```bash
   npm run dev
   ```

3. ✅ Test PDF generation:
   - Go to Admin Dashboard
   - Click "Download Card" on any member
   - Check console for font loading messages
   - Verify PDF downloads with text visible (not placeholder text)

## Debugging

If you still get font errors:

1. **Check Server Running**:
   ```bash
   curl http://localhost:3001/storage/fonts/Montserrat-Regular.ttf
   ```
   Should download the TTF file (binary data).

2. **Check Console Logs**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for messages like "Font URLs to be fetched"
   - Check for any 404 or CORS errors

3. **Check Network Tab**:
   - Go to Network tab
   - Click "Download Card"
   - Look for requests to `/storage/fonts/*`
   - Verify they return 200 OK with correct file size

## Files Modified

- ✅ `src/lib/fontConfig.ts` - Updated font paths to HTTP URLs
- ✅ `src/lib/generatePdfmeCard.ts` - Enhanced error handling and logging
- ✅ `server.js` - Added static route for fonts directory
