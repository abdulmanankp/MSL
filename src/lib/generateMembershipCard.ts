import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Database } from '@/integrations/supabase/types';

type Member = Database['public']['Tables']['members']['Row'];

const educationLabels: Record<string, string> = {
  hafiz_quran: 'Hafiz e Quran',
  matric: 'Matric',
  inter: 'Inter',
  bs: 'BS',
  masters: 'Masters',
  phd: 'PHD',
};

const areaLabels: Record<string, string> = {
  muslim_kids: 'Muslim Kids',
  media_department: 'Media Department',
  madadgar_team: 'Madadgar Team',
  universities_department: 'Universities Department',
};

// Card dimensions in mm (standard ID card size: 85.6 x 53.98 mm)
const CARD_WIDTH = 85.6;
const CARD_HEIGHT = 54;

// Brand colors
const PRIMARY_COLOR = { r: 1, g: 79, b: 53 }; // #014f35

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 200,
    margin: 1,
    color: {
      dark: '#014f35',
      light: '#ffffff',
    },
  });
}

export async function generateMembershipCard(
  member: Member,
  verificationBaseUrl: string
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [CARD_WIDTH, CARD_HEIGHT],
  });

  // Generate QR code for verification
  const verificationUrl = `${verificationBaseUrl}/verify-member?id=${member.membership_id}`;
  const qrCodeDataUrl = await generateQRCode(verificationUrl);

  // Load profile photo if exists
  let profilePhotoBase64: string | null = null;
  if (member.profile_photo_url) {
    profilePhotoBase64 = await loadImageAsBase64(member.profile_photo_url);
  }

  // ========== FRONT OF CARD ==========
  // Background
  doc.setFillColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.rect(0, 0, CARD_WIDTH, 16, 'F');

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MSL PAKISTAN', CARD_WIDTH / 2, 8, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('MEMBERSHIP CARD', CARD_WIDTH / 2, 13, { align: 'center' });

  // Profile photo area
  const photoX = 5;
  const photoY = 20;
  const photoSize = 20;

  if (profilePhotoBase64) {
    try {
      doc.addImage(profilePhotoBase64, 'JPEG', photoX, photoY, photoSize, photoSize);
    } catch {
      // Draw placeholder if image fails
      doc.setFillColor(240, 240, 240);
      doc.rect(photoX, photoY, photoSize, photoSize, 'F');
    }
  } else {
    doc.setFillColor(240, 240, 240);
    doc.rect(photoX, photoY, photoSize, photoSize, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(6);
    doc.text('Photo', photoX + photoSize / 2, photoY + photoSize / 2 + 1, { align: 'center' });
  }

  // Member details
  doc.setTextColor(0, 0, 0);
  const detailsX = photoX + photoSize + 5;
  let detailsY = 20;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(member.full_name.toUpperCase(), detailsX, detailsY);

  detailsY += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(member.designation, detailsX, detailsY);

  detailsY += 4;
  doc.text(member.district, detailsX, detailsY);

  detailsY += 4;
  doc.text(areaLabels[member.area_of_interest] || member.area_of_interest, detailsX, detailsY);

  // Membership ID
  doc.setTextColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(member.membership_id, detailsX, detailsY + 6);

  // QR Code (bottom right)
  const qrSize = 15;
  const qrX = CARD_WIDTH - qrSize - 5;
  const qrY = CARD_HEIGHT - qrSize - 5;
  doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  // Footer
  doc.setFillColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.rect(0, CARD_HEIGHT - 3, CARD_WIDTH, 3, 'F');

  // ========== BACK OF CARD (Page 2) ==========
  doc.addPage([CARD_WIDTH, CARD_HEIGHT], 'landscape');

  // Background
  doc.setFillColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.rect(0, 0, CARD_WIDTH, 10, 'F');

  // Header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('MEMBER DETAILS', CARD_WIDTH / 2, 6, { align: 'center' });

  // Details section
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');

  let backY = 15;
  const labelX = 5;
  const valueX = 30;

  const details = [
    ['Email:', member.email],
    ['WhatsApp:', member.whatsapp_number],
    ['Education:', educationLabels[member.education_level] || member.education_level],
    ['Address:', member.complete_address.substring(0, 40) + (member.complete_address.length > 40 ? '...' : '')],
    ['Member Since:', new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })],
  ];

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, labelX, backY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, valueX, backY);
    backY += 5;
  });

  // Verification text
  doc.setTextColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.setFontSize(5);
  doc.text('Scan QR code on front to verify membership', CARD_WIDTH / 2, CARD_HEIGHT - 8, { align: 'center' });

  // Footer
  doc.setFillColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.rect(0, CARD_HEIGHT - 5, CARD_WIDTH, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(5);
  doc.text('mslpakistan.org', CARD_WIDTH / 2, CARD_HEIGHT - 1.5, { align: 'center' });

  return doc.output('blob');
}
