import { createClient } from '@supabase/supabase-js'
import { PDFDocument, rgb } from 'pdf-lib'
import QRCode from 'qrcode'

interface GenerateCardRequest {
  memberId: string
}

interface Member {
  id: string
  membership_id: string
  full_name: string
  email: string
  whatsapp_number: string
  designation: string
  district: string
  complete_address: string
  area_of_interest: string
  education_level: string
  degree_institute: string
  profile_photo_url: string | null
}

interface TemplateField {
  id: string
  field_name: string
  field_type: string
  page_number: number
  x_position: number | null
  y_position: number | null
  width: number | null
  height: number | null
  font_family: string | null
  font_size: number | null
  font_color: string | null
  text_alignment: string | null
  image_shape: string | null
  has_border: boolean | null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { memberId }: GenerateCardRequest = await req.json()

    if (!memberId) {
      return new Response('Member ID is required', { status: 400 })
    }

    console.log(`Generating card for member: ${memberId}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return new Response('Server configuration error', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch member data
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return new Response('Member not found', { status: 404 })
    }

    // Get active template
    const { data: template, error: templateError } = await supabase
      .from('card_templates')
      .select('*')
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      return new Response('No active template found', { status: 404 })
    }

    // Get template fields
    const { data: fields, error: fieldsError } = await supabase
      .from('template_fields')
      .select('*')
      .eq('template_id', template.id)
      .order('page_number')

    if (fieldsError) {
      return new Response('Failed to load template fields', { status: 500 })
    }

    // Load PDF template
    let pdfDoc;
    try {
      if (typeof template.pdf_data === 'string') {
        // Handle base64 string (legacy support)
        pdfDoc = await PDFDocument.load(template.pdf_data);
      } else if (template.pdf_data instanceof Uint8Array) {
        // Handle Uint8Array directly
        pdfDoc = await PDFDocument.load(template.pdf_data);
      } else if (template.pdf_data && typeof template.pdf_data === 'object' && 'buffer' in template.pdf_data) {
        // Handle Buffer-like objects
        const buffer = template.pdf_data as any;
        const uint8Array = new Uint8Array(buffer.buffer || buffer);
        pdfDoc = await PDFDocument.load(uint8Array);
      } else {
        // Try to convert to Uint8Array as fallback
        const uint8Array = new Uint8Array(template.pdf_data as ArrayBuffer);
        pdfDoc = await PDFDocument.load(uint8Array);
      }
    } catch (pdfError) {
      console.error('Failed to load PDF template:', pdfError);
      return new Response('Invalid PDF template data', { status: 500 });
    }
    const pages = pdfDoc.getPages()

    // Process each field
    for (const field of fields) {
      const pageIndex = field.page_number - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) {
        console.warn(`Invalid page number ${field.page_number} for field ${field.field_name}`);
        continue;
      }
      
      const page = pages[pageIndex];
      const pageHeight = page.getHeight();

      // Calculate position (centered if not specified)
      let x = field.x_position || (page.getWidth() / 2)
      let y = field.y_position || (pageHeight / 2)

      if (field.field_type === 'text') {
        const value = getFieldValue(member, field.field_name)
        if (value && value.trim()) {
          const fontSize = field.font_size || 12
          const color = field.font_color ? hexToRgb(field.font_color) : rgb(0, 0, 0)

          // Calculate text width for alignment (rough estimate)
          const textWidth = fontSize * value.length * 0.6

          // Set default positions if not specified
          let finalX = x;
          let finalY = y;

          if (field.text_alignment === 'center') {
            finalX = (page.getWidth() - textWidth) / 2
          } else if (field.text_alignment === 'right') {
            finalX = page.getWidth() - textWidth - 50
          }

          // Ensure coordinates are within page bounds
          finalX = Math.max(0, Math.min(finalX, page.getWidth() - textWidth))
          finalY = Math.max(0, Math.min(finalY, pageHeight))

          page.drawText(value, {
            x: finalX,
            y: pageHeight - finalY, // PDF-lib uses bottom-left origin
            size: fontSize,
            color
          })
        }
      } else if (field.field_type === 'image' && field.field_name === 'profile_photo') {
        if (member.profile_photo_url) {
          try {
            // Fetch image with timeout
            const imageResponse = await fetch(member.profile_photo_url, {
              signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            if (!imageResponse.ok) {
              console.warn(`Failed to fetch profile image: ${imageResponse.status}`);
              continue;
            }

            const imageBytes = await imageResponse.arrayBuffer();

            let image;
            const contentType = imageResponse.headers.get('content-type') || '';
            if (contentType.includes('png') || member.profile_photo_url.toLowerCase().includes('.png')) {
              image = await pdfDoc.embedPng(imageBytes);
            } else {
              image = await pdfDoc.embedJpg(imageBytes);
            }

            const width = field.width || 100
            const height = field.height || 100

            // Center the image
            x = field.x_position || (page.getWidth() / 2 - width / 2)
            y = field.y_position || (pageHeight / 2 - height / 2)

            if (field.image_shape === 'circle') {
              // For circular images, we'll just draw as rectangle for now
              // PDF-lib doesn't have built-in circle clipping
              page.drawImage(image, {
                x,
                y: pageHeight - y - height,
                width,
                height
              })
            } else {
              page.drawImage(image, {
                x,
                y: pageHeight - y - height,
                width,
                height
              })
            }

            // Add border if requested
            if (field.has_border) {
              page.drawRectangle({
                x,
                y: pageHeight - y - height,
                width,
                height,
                borderColor: rgb(0, 0, 0),
                borderWidth: 2,
                color: rgb(1, 1, 1) // Transparent fill
              })
            }
          } catch (error) {
            console.error('Failed to load profile image:', error)
          }
        }
      } else if (field.field_type === 'qr_code') {
        try {
          // Generate QR code linking to verification page
          const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:8081';
          const verificationUrl = `${siteUrl}/verify/${member.membership_id}`;
          
          const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: Math.min(field.width || 100, 500), // Cap at 500px for performance
            margin: 1,
            errorCorrectionLevel: 'M'
          });

          // Convert data URL to bytes
          const qrResponse = await fetch(qrCodeDataUrl);
          if (!qrResponse.ok) {
            console.warn('Failed to generate QR code data URL');
            continue;
          }
          
          const qrBytes = await qrResponse.arrayBuffer();
          const qrImage = await pdfDoc.embedPng(qrBytes);

          const width = field.width || 100
          const height = field.height || 100

          x = field.x_position || (page.getWidth() / 2 - width / 2)
          y = field.y_position || (pageHeight / 2 - height / 2)

          page.drawImage(qrImage, {
            x,
            y: pageHeight - y - height,
            width,
            height
          })
        } catch (error) {
          console.error('Failed to generate QR code:', error)
        }
      }
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save()

    console.log(`Successfully generated card for member ${member.membership_id}, PDF size: ${modifiedPdfBytes.length} bytes`)

    // Return the PDF as response
    return new Response(modifiedPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${member.membership_id}_card.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating card:', error)
    return new Response('Internal server error', { status: 500 })
  }
})

function getFieldValue(member: Member, fieldName: string): string {
  switch (fieldName) {
    case 'full_name':
      return member.full_name
    case 'membership_id':
      return member.membership_id
    case 'email':
      return member.email
    case 'whatsapp_number':
      return member.whatsapp_number
    case 'designation':
      return member.designation
    case 'district':
      return member.district
    case 'complete_address':
      return member.complete_address
    case 'area_of_interest':
      return member.area_of_interest.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    case 'education_level':
      return member.education_level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    case 'degree_institute':
      return member.degree_institute
    default:
      return ''
  }
}

function hexToRgb(hex: string): { red: number; green: number; blue: number } {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Handle 3-digit hex codes
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Handle 6-digit hex codes
  if (hex.length === 6) {
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        red: parseInt(result[1], 16) / 255,
        green: parseInt(result[2], 16) / 255,
        blue: parseInt(result[3], 16) / 255
      };
    }
  }
  
  // Default to black if invalid
  console.warn(`Invalid hex color: ${hex}, using black`);
  return { red: 0, green: 0, blue: 0 };
}