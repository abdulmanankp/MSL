import { generate } from '@pdfme/generator';
import { image, text } from '@pdfme/schemas';
import type { Template } from '@pdfme/common';
import type { Database } from '@/integrations/supabase/types';
import QRCode from 'qrcode';
import { fontConfig, DEFAULT_FONT_NAME } from '@/lib/fontConfig';
import { createCircularImageWithBorder } from '@/lib/circularImagePlugin';

// Custom text plugin with Montserrat support and bold control
const customText = {
  ...text,
  propPanel: {
    ...text.propPanel,
    defaultSchema: {
      ...text.propPanel.defaultSchema,
      fontName: DEFAULT_FONT_NAME,
      bold: false, // Use bold (boolean) for text styling
    },
  },
};

// Custom image plugin: ensure border/circle defaults for all images
const customImage = {
  ...image,
  propPanel: {
    ...image.propPanel,
    defaultSchema: {
      ...(image.propPanel.defaultSchema as Record<string, unknown>),
      borderRadius: '50',
      hasBorder: true,
      borderWidth: 1,
      borderColor: '#000000',
    },
  },
} as unknown as typeof image;

// Map member data to template input fields
async function mapMemberToTemplateInput(member: Database['public']['Tables']['members']['Row']) {
  // Helper function to convert image URL to base64
  const imageUrlToBase64 = async (url: string | null): Promise<string | null> => {
    if (!url) return null;
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  // Generate QR code for verification
  const generateQRCodeBase64 = async (data: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(data, { width: 256 });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  // Convert profile photo to base64 and apply circular clipping with white border
  let profilePhotoBase64 = await imageUrlToBase64(member.profile_photo_url);
  if (profilePhotoBase64) {
    try {
      // Apply circular clipping with 1px white border (200x200 high-res for quality)
      profilePhotoBase64 = await createCircularImageWithBorder(profilePhotoBase64, 200, 200, 1, '#FFFFFF');
    } catch (error) {
      console.error('Error applying circular clipping:', error);
      // Fall back to original image if clipping fails
    }
  }

  // Generate QR code
  const qrCodeBase64 = await generateQRCodeBase64(`https://mslpakistan.org/verify-member?id=${member.membership_id}`);

  return {
    full_name: member.full_name,
    membership_id: member.membership_id,
    email: member.email,
    whatsapp_number: member.whatsapp_number,
    designation: member.designation,
    district: member.district,
    complete_address: member.complete_address,
    area_of_interest: member.area_of_interest,
    education_level: member.education_level,
    degree_institute: member.degree_institute,
    profile_photo: profilePhotoBase64, // Base64 image data for image field
    qr_code: qrCodeBase64, // Base64 QR code image
  };
}


export async function generatePdfmeCard(member: Database['public']['Tables']['members']['Row']): Promise<Blob> {
  // Use dynamic API URL for production compatibility
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  let response: Response;
  try {
    response = await fetch(`${API_URL}/load-template`, { mode: 'cors' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to reach template server at ${API_URL}. (${msg})`);
  }

  if (!response.ok) {
    throw new Error('No template found on template server. Please design and save a template first.');
  }

  const templateData = await response.json() as unknown as Template;
  const template = { ...templateData } as Template & { basePdf: unknown; schemas: Array<Array<Record<string, unknown>>> };
  
  // Validate template structure
  if (!template || typeof template !== 'object') {
    throw new Error('Invalid template format: template must be an object');
  }
  
  if (!template.schemas || !Array.isArray(template.schemas) || template.schemas.length === 0) {
    throw new Error('Invalid template format: template.schemas must be a non-empty array');
  }
  
  // Ensure template.basePdf is raw PDF data (Uint8Array) before generation.
  // Acceptable stored forms: Uint8Array, data URL (data:application/pdf;base64,...), or HTTP URL.
  const ensureBasePdfIsBytes = async () => {
    if (!template.basePdf) {
      throw new Error('No PDF template found. Please upload and save a PDF template first.');
    }

    // Already bytes
    if (template.basePdf instanceof Uint8Array) {
      return;
    }

    // Data URL
    if (typeof template.basePdf === 'string') {
      if (template.basePdf.startsWith('data:')) {
        try {
          const resp = await fetch(template.basePdf as string);
          if (!resp.ok) throw new Error(`Failed to fetch data URL: ${resp.status}`);
          const buf = await resp.arrayBuffer();
          template.basePdf = new Uint8Array(buf);
          return;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new Error(`Failed to convert basePdf data URL to bytes: ${msg}`);
        }
      }

      // HTTP(S) URL
      if (/https?:\/\//.test(template.basePdf)) {
        try {
          const pdfResp = await fetch(template.basePdf as string, { mode: 'cors' });
          if (!pdfResp.ok) throw new Error(`Failed to fetch PDF from URL: ${pdfResp.status}`);
          const buf = await pdfResp.arrayBuffer();
          template.basePdf = new Uint8Array(buf);
          return;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new Error(`Failed to fetch basePdf URL: ${msg}`);
        }
      }

      // Try local server path (e.g., "/templates/template.pdf")
      if (template.basePdf.startsWith('/')) {
        try {
    // Ensure template.basePdf is raw PDF data (Uint8Array) before generation.
    // Only allow Uint8Array or fetch from local /get-pdf-template endpoint.
    const ensureBasePdfIsBytes = async () => {
      if (!template.basePdf) {
        // Try to fetch from local endpoint
        const resp = await fetch('http://localhost:3001/get-pdf-template', { mode: 'cors' });
        if (!resp.ok) throw new Error('No PDF template found. Please upload and save a PDF template first.');
        const buf = await resp.arrayBuffer();
        template.basePdf = new Uint8Array(buf);
        return;
      }
      if (template.basePdf instanceof Uint8Array) {
        return;
      }
      throw new Error('Unsupported basePdf format. Only local PDF is allowed.');
    };
          const buf = await pdfResp.arrayBuffer();
          template.basePdf = new Uint8Array(buf);
          return;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new Error(`Failed to fetch basePdf from local path: ${msg}`);
        }
      }
    }

    // If it's an object like {"0": 37, "1": 80, ...} (Uint8Array serialized to object), convert it
    if (typeof template.basePdf === 'object' && template.basePdf !== null && !(template.basePdf instanceof ArrayBuffer)) {
      try {
        const obj = template.basePdf as unknown as Record<string, number>;
        const keys = Object.keys(obj).map(k => parseInt(k, 10)).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
        if (keys.length === 0) {
          throw new Error('Empty byte array');
        }
        const arr = new Uint8Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
          arr[i] = obj[String(keys[i])];
        }
        template.basePdf = arr;
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to convert serialized basePdf object to bytes: ${msg}`);
      }
    }

    // Unknown type
    throw new Error(`Unknown basePdf format: ${typeof template.basePdf}. Expected Uint8Array, data URL, HTTP URL, local path, or serialized byte-object.`);
  };

  await ensureBasePdfIsBytes();

  // Validate and clean template schemas
  if (!Array.isArray(template.schemas[0])) {
    throw new Error('Invalid template: schemas[0] must be an array of field objects');
  }

  // Ensure all schema fields have required properties
  (template.schemas[0] as Array<Record<string, unknown>>) = template.schemas[0].map((field: Record<string, unknown>, index: number) => {
    if (!field.name) {
      throw new Error(`Template field at index ${index} is missing required 'name' property`);
    }
    if (!field.type) {
      throw new Error(`Template field '${field.name}' is missing required 'type' property`);
    }
    return field;
  });

  // Clean up template: remove duplicate fields and fix image content
  {
    const seenNames = new Set<string>();
    (template.schemas[0] as Array<Record<string, unknown>>) = template.schemas[0].filter((field: Record<string, unknown>) => {
      const fieldName = field.name as string;
      if (seenNames.has(fieldName)) {
        console.warn(`Removing duplicate field: ${fieldName}`);
        return false; // Remove duplicate
      }
      seenNames.add(fieldName);
      
      // Fix image fields: remove content for image types
      if (field.type === 'image') {
        field.content = '';
      }
      
      return true;
    });
  }

  // Ensure profile_photo fields have border defaults for generation
  (template.schemas[0] as Array<Record<string, unknown>>) = template.schemas[0].map((field: Record<string, unknown>) => {
    if (field.type === 'image' && String(field.name) === 'profile_photo') {
      if (!field.borderRadius) field.borderRadius = '50%';
      if (field.hasBorder === undefined) field.hasBorder = true;
      if (!field.borderWidth) field.borderWidth = 1;
      if (!field.borderColor) field.borderColor = '#000000';
    }
    return field;
  });

  // Map member data to inputs
  const inputs = [await mapMemberToTemplateInput(member)];
  
  // Validate input keys match template field names
  const templateFieldNames = new Set(template.schemas[0].map((f: Record<string, unknown>) => f.name as string));
  const inputKeys = Object.keys(inputs[0]);
  const unmappedFields = Array.from(templateFieldNames).filter(name => !inputKeys.includes(name));
  const unusedInputs = inputKeys.filter(key => !templateFieldNames.has(key));
  
  if (unmappedFields.length > 0) {
    console.warn(`Warning: Template fields without input data: ${unmappedFields.join(', ')}`);
  }
  if (unusedInputs.length > 0) {
    console.warn(`Info: Input data not used in template: ${unusedInputs.join(', ')}`);
  }

  try {
    console.log('Starting PDF generation with fonts:', Object.keys(fontConfig));
    
    // Verify fonts are accessible
    const fontUrls = Object.values(fontConfig).map((f: Record<string, unknown>) => f.data as string);
    console.log('Font URLs to be fetched:', fontUrls);
    
    const pdfBuffer = await generate({ 
      template, 
      inputs, 
      plugins: { text: customText, image: customImage },
      options: { font: fontConfig }
    });
    
    console.log('PDF generated successfully, size:', pdfBuffer.length);
    return new Blob([pdfBuffer], { type: 'application/pdf' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('PDF generation error details:', {
      error: error,
      message: msg,
      template: {
        schemasCount: template.schemas.length,
        fieldsCount: template.schemas[0]?.length,
        inputKeys: Object.keys(inputs[0]),
      }
    });
    // Use dynamic API_URL for error message
    const API_URL = import.meta.env?.VITE_API_URL || (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL ? process.env.VITE_API_URL : 'http://localhost:3001');
    throw new Error(`Failed to generate PDF: ${msg}. Ensure template server is running and fonts are accessible at ${API_URL}/fonts/`);
  }
}
