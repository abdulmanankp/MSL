/**
 * WhatsApp Template Manager
 * Handles persistent storage and retrieval of WhatsApp templates
 */

import fs from 'fs';
import path from 'path';

// Default template definitions - Only pre-built templates
const DEFAULT_TEMPLATES = {
  member_register: {
    id: 'member_register',
    name: 'Member Registration',
    language: 'en_US',
    type: 'registration',
    content: {
      text: `*Assalamu Alaikum {{first_name}},*\n\nYour registration with Muslim Students League (MSL) Pakistan has been successfully received.\n\n*Membership ID:* {{membership_id}}\n\nOur team will review your information shortly. Once your membership is approved, you will be informed automatically and guided to download your official Membership Card from the MSL Pakistan website.\n\nThank you for your interest in becoming part of MSL Pakistan.\n\nDevelop by WEBNIX`
    },
    createdAt: new Date().toISOString(),
    isDefault: true
  },

  otp_verification: {
    id: 'otp_verification',
    name: 'OTP Verification',
    language: 'en_US',
    type: 'otp',
    description: 'Automatic template for card download verification',
    content: {
      text: `OTP Code: {{otp_code}}. This is your OTP for Membership Card. The OTP is valid for 10 minutes. Call 123-456-7890 if you did not perform this request.`
    },
    createdAt: new Date().toISOString(),
    isDefault: true
  },

  approved: {
    id: 'approved',
    name: 'Membership Approved',
    language: 'en_US',
    type: 'approval',
    description: 'Automatic template when membership is approved',
    content: {
      text: `*Assalamu Alaikum {{first_name}},*\n\nWe are pleased to inform you that your membership with Muslim Students League (MSL) Pakistan has been approved successfully.\n\nYour official digital membership card has been generated and is now available for download.\n\nPlease click the button below and log in using your registered details to download your membership card.\n\nThis card serves as your official identification within MSL Pakistan.\n\nMembership ID: {{membership_id}}\n\nBest Regards\n*MSL IT DEPARTMENT*\n\nDevelop by Abdul Manan`
    },
    createdAt: new Date().toISOString(),
    isDefault: true
  }
};

class TemplateManager {
  constructor(templatesDir) {
    this.templatesDir = templatesDir;
    this.templatesFile = path.join(templatesDir, 'whatsapp_templates.json');
    this.ensureDirectory();
    this.ensureTemplatesFile();
  }

  ensureDirectory() {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }
  }

  ensureTemplatesFile() {
    if (!fs.existsSync(this.templatesFile)) {
      fs.writeFileSync(this.templatesFile, JSON.stringify(DEFAULT_TEMPLATES, null, 2));
    }
  }

  getAllTemplates() {
    try {
      const data = fs.readFileSync(this.templatesFile, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.warn('Failed to read templates, using defaults:', err);
      return DEFAULT_TEMPLATES;
    }
  }

  getTemplateById(id) {
    const templates = this.getAllTemplates();
    return templates[id];
  }

  getTemplatesByType(type) {
    const templates = this.getAllTemplates();
    return Object.values(templates).filter(t => t.type === type);
  }

  getTemplatesByLanguage(language) {
    const templates = this.getAllTemplates();
    return Object.values(templates).filter(t => t.language === language);
  }

  createTemplate(templateData) {
    const templates = this.getAllTemplates();
    const id = templateData.id || `${templateData.type}_${templateData.language}_${Date.now()}`;
    
    if (templates[id]) {
      throw new Error(`Template with ID ${id} already exists`);
    }

    const newTemplate = {
      id,
      name: templateData.name,
      language: templateData.language,
      type: templateData.type,
      description: templateData.description || '',
      content: templateData.content,
      createdAt: new Date().toISOString()
    };

    templates[id] = newTemplate;
    this.saveTemplates(templates);
    return newTemplate;
  }

  updateTemplate(id, updates) {
    const templates = this.getAllTemplates();
    if (!templates[id]) {
      throw new Error(`Template with ID ${id} not found`);
    }

    templates[id] = {
      ...templates[id],
      ...updates,
      id, // Prevent ID changes
      createdAt: templates[id].createdAt // Preserve creation date
    };

    this.saveTemplates(templates);
    return templates[id];
  }

  deleteTemplate(id) {
    const templates = this.getAllTemplates();
    if (!templates[id]) {
      throw new Error(`Template with ID ${id} not found`);
    }

    delete templates[id];
    this.saveTemplates(templates);
    return { success: true, deletedId: id };
  }

  resetToDefaults() {
    this.saveTemplates(DEFAULT_TEMPLATES);
    return DEFAULT_TEMPLATES;
  }

  saveTemplates(templates) {
    fs.writeFileSync(this.templatesFile, JSON.stringify(templates, null, 2));
  }
}

export default TemplateManager;
