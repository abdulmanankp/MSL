-- ===========================================
-- MSL Pakistan Card Template System
-- ===========================================

-- Create card_templates table
CREATE TABLE public.card_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  pdf_data BYTEA NOT NULL, -- Store the PDF template as binary
  page_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template_fields table for field mappings
CREATE TABLE public.template_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.card_templates(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- e.g., 'full_name', 'whatsapp_number', 'profile_photo'
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'image', 'qr_code')),
  page_number INTEGER NOT NULL DEFAULT 1,
  x_position NUMERIC(10,2), -- X coordinate (optional for auto-placement)
  y_position NUMERIC(10,2), -- Y coordinate (optional for auto-placement)
  width NUMERIC(10,2), -- Width for images
  height NUMERIC(10,2), -- Height for images
  font_family TEXT, -- Font family for text fields
  font_size INTEGER, -- Font size for text fields
  font_color TEXT, -- Hex color for text fields
  text_alignment TEXT CHECK (text_alignment IN ('left', 'center', 'right')), -- Alignment for text
  image_shape TEXT CHECK (image_shape IN ('circle', 'square')), -- Shape for image fields
  has_border BOOLEAN DEFAULT false, -- Border for images
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_id, field_name)
);

-- Create index for better performance
CREATE INDEX idx_template_fields_template_id ON public.template_fields(template_id);
CREATE INDEX idx_card_templates_active ON public.card_templates(is_active);

-- Enable RLS
ALTER TABLE public.card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage templates
CREATE POLICY "Admins can view card templates"
ON public.card_templates
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage card templates"
ON public.card_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view template fields"
ON public.template_fields
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage template fields"
ON public.template_fields
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_card_templates_updated_at
    BEFORE UPDATE ON public.card_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_template_fields_updated_at
    BEFORE UPDATE ON public.template_fields
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();