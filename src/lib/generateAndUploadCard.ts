import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb } from 'pdf-lib';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export async function generateAndUploadCard(userId: string, formData: any, templateFile: string, fieldMapping: any) {
  // 1. Download Template from Supabase Storage
  const { data: templateData, error: downloadError } = await supabase.storage
    .from('templates')
    .download(templateFile);
  if (downloadError || !templateData) throw new Error('Failed to download template PDF');

  const pdfDoc = await PDFDocument.load(await templateData.arrayBuffer());
  const page = pdfDoc.getPages()[0];

  // 2. Map Fields (Visual mapping logic)
  for (const [field, config] of Object.entries(fieldMapping)) {
    if (formData[field]) {
      page.drawText(formData[field], {
        x: config.x,
        y: config.y,
        size: config.size || 12,
        color: config.color ? rgb(...hexToRgb(config.color)) : rgb(0,0,0)
      });
    }
  }

  // 3. Handle Photo (Embed Image)
  if (formData.photoUrl && fieldMapping.profile_pic) {
    const imageBytes = await fetch(formData.photoUrl).then(res => res.arrayBuffer());
    const image = await pdfDoc.embedJpg(imageBytes);
    page.drawImage(image, {
      x: fieldMapping.profile_pic.x,
      y: fieldMapping.profile_pic.y,
      width: fieldMapping.profile_pic.width,
      height: fieldMapping.profile_pic.height
    });
  }

  // 4. Save and Upload to 'generated-cards' bucket
  const finalPdfBytes = await pdfDoc.save();
  const fileName = `card_${userId}_${Date.now()}.pdf`;

  const { data, error } = await supabase.storage
    .from('generated-cards')
    .upload(fileName, finalPdfBytes, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (error) throw new Error('Failed to upload generated card');
  return data?.path;
}

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const num = parseInt(hex, 16);
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}
