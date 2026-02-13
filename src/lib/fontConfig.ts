


/**
 * Font configuration for pdfme
 * Uses local Node server at http://localhost:3001
 * Fonts are stored in storage/fonts directory
 * For UI preview, uses Google Fonts for browser rendering
 */



const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL ? process.env.VITE_API_URL : 'http://localhost:3001');

export const fontConfig = {
  Montserrat: {
    data: `${API_URL}/fonts/Montserrat-Regular.ttf`,
    fallback: true,
  },
  'Montserrat-Bold': {
    data: `${API_URL}/fonts/Montserrat-Bold.ttf`,
  },
  'Montserrat-Italic': {
    data: `${API_URL}/fonts/Montserrat-MediumItalic.ttf`,
  },
};

/**
 * Font options for UI preview (Designer, Form, Viewer)
 * Uses Google Fonts for browser rendering
 */
export const uiFontOptions = {
  fonts: [
    { name: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700&display=swap' }
  ]
};

/**
 * Default font name for text fields
 */
export const DEFAULT_FONT_NAME = 'Montserrat';
