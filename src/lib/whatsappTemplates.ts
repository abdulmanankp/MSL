/**
 * WhatsApp Template Definitions
 * Structured templates for WhatsApp Cloud API messaging
 * Each template has: name, language, content (file, button, text)
 */

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  type: 'approval' | 'otp' | 'registration' | 'custom';
  content: {
    file?: {
      type: 'document' | 'image' | 'video' | 'audio';
      url?: string;
      caption?: string;
    };
    text: string;
    button?: {
      type: 'url' | 'phone' | 'quick_reply';
      text: string;
      payload?: string;
    };
  };
  createdAt: string;
  description?: string;
}

/**
 * Default Templates
 */
export const DEFAULT_TEMPLATES: Record<string, WhatsAppTemplate> = {
  approval_en: {
    id: 'approval_en',
    name: 'Membership Approved',
    language: 'en',
    type: 'approval',
    description: 'Sent when member is approved',
    content: {
      text: `✅ *Congratulations!* Your membership with MSL Pakistan has been approved.

Your membership ID: {{membership_id}}
Status: Approved

Download your membership card now to get started.`,
      file: {
        type: 'document',
        caption: 'Your Membership Card'
      },
      button: {
        type: 'url',
        text: 'View Dashboard',
        payload: '/member-dashboard'
      }
    },
    createdAt: new Date().toISOString()
  },

  approval_ur: {
    id: 'approval_ur',
    name: 'رکنیت منظور ہوگئی',
    language: 'ur',
    type: 'approval',
    description: 'Urdu approval message',
    content: {
      text: `✅ *مبارک ہو!* آپ کی رکنیت MSL Pakistan میں منظور ہو گئی۔

رکنیت ID: {{membership_id}}
حالت: منظور

اپنا رکنیت کارڈ ڈاؤن لوڈ کریں۔`,
      file: {
        type: 'document',
        caption: 'آپ کا رکنیت کارڈ'
      },
      button: {
        type: 'url',
        text: 'ڈیش بورڈ دیکھیں',
        payload: '/member-dashboard'
      }
    },
    createdAt: new Date().toISOString()
  },

  otp_verification: {
    id: 'otp_verification',
    name: 'OTP Verification',
    language: 'en_US',
    type: 'otp',
    description: 'Sent for card download verification',
    content: {
      text: `OTP Code: {{otp_code}}. This is your OTP for Membership Card. The OTP is valid for 10 minutes. Call 123-456-7890 if you did not perform this request.`,
      button: {
        type: 'quick_reply',
        text: 'Got it'
      }
    },
    createdAt: new Date().toISOString()
  },

  otp_ur: {
    id: 'otp_ur',
    name: 'ای ٹی پی تصدیق',
    language: 'ur',
    type: 'otp',
    description: 'Urdu OTP message',
    content: {
      text: `🔐 *ای ٹی پی تصدیق*

آپ کا ایک بار استعمال ہونے والا پاس ورڈ (OTP): {{otp_code}}

یہ کوڈ 5 منٹ میں ختم ہو جائے گا۔ یہ کوڈ کسی سے شیئر نہ کریں۔

رکنیت ID: {{membership_id}}`,
      button: {
        type: 'quick_reply',
        text: 'ٹھیک ہے'
      }
    },
    createdAt: new Date().toISOString()
  },

  registration_en: {
    id: 'registration_en',
    name: 'Welcome to MSL',
    language: 'en',
    type: 'registration',
    description: 'Welcome message for new registration',
    content: {
      text: `👋 *Welcome to MSL Pakistan!*

Thank you for registering with us. Your application is being reviewed.

We'll notify you once your membership is approved.

📧 Questions? Contact us anytime!`,
      button: {
        type: 'url',
        text: 'View Status',
        payload: '/check-status'
      }
    },
    createdAt: new Date().toISOString()
  },

  registration_ur: {
    id: 'registration_ur',
    name: 'MSL میں خوش آمدید',
    language: 'ur',
    type: 'registration',
    description: 'Urdu welcome message',
    content: {
      text: `👋 *MSL Pakistan میں خوش آمدید!*

ہمارے ساتھ رجسٹر کرنے کے لیے شکریہ۔ آپ کی درخواست کا جائزہ لیا جا رہا ہے۔

جب آپ کی رکنیت منظور ہو جائے تو ہم آپ کو مطلع کریں گے۔

📧 سوالات؟ کسی بھی وقت ہم سے رابطہ کریں!`,
      button: {
        type: 'url',
        text: 'حالت دیکھیں',
        payload: '/check-status'
      }
    },
    createdAt: new Date().toISOString()
  }
};

/**
 * Get template by ID
 */
export const getTemplate = (templateId: string): WhatsAppTemplate | undefined => {
  return DEFAULT_TEMPLATES[templateId];
};

/**
 * Get templates by type
 */
export const getTemplatesByType = (type: WhatsAppTemplate['type']): WhatsAppTemplate[] => {
  return Object.values(DEFAULT_TEMPLATES).filter(t => t.type === type);
};

/**
 * Get templates by language
 */
export const getTemplatesByLanguage = (language: string): WhatsAppTemplate[] => {
  return Object.values(DEFAULT_TEMPLATES).filter(t => t.language === language);
};

/**
 * Format template with variables
 */
export const formatTemplate = (template: WhatsAppTemplate, variables: Record<string, string>): string => {
  let text = template.content.text;
  Object.entries(variables).forEach(([key, value]) => {
    text = text.replace(`{{${key}}}`, value);
  });
  return text;
};

/**
 * Get template info for logging/display
 */
export const getTemplateInfo = (templateId: string): string => {
  const template = getTemplate(templateId);
  if (!template) return 'Unknown Template';
  return `${template.name} (${template.language.toUpperCase()}) - ${template.type}`;
};
