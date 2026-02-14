import React, { useState, useEffect, useCallback, useRef } from 'react';
import PdfmeDesignerWrapper from '@/components/PdfmeDesignerWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, LogOut, Lock } from 'lucide-react';
import type { Template } from '@pdfme/common';
import type { Designer } from '@pdfme/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { uiFontOptions, DEFAULT_FONT_NAME } from '@/lib/fontConfig';

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'image';
  shape?: 'circle' | 'rectangle';
  width?: number;
  height?: number;
  border?: boolean;
}

const AVAILABLE_FIELDS: FieldConfig[] = [
  { key: 'full_name', label: 'Full Name', type: 'text' },
  { key: 'membership_id', label: 'Membership ID', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text' },
  { key: 'designation', label: 'Designation', type: 'text' },
  { key: 'district', label: 'District', type: 'text' },
  { key: 'provincial_seat', label: 'Provincial Seat', type: 'text' },
  { key: 'complete_address', label: 'Complete Address', type: 'text' },
  { key: 'area_of_interest', label: 'Area of Interest', type: 'text' },
  { key: 'education_level', label: 'Education Level', type: 'text' },
  { key: 'degree_institute', label: 'Degree Institute', type: 'text' },
  { key: 'profile_photo', label: 'Profile Photo', type: 'image', shape: 'circle', border: true },
  { key: 'qr_code', label: 'QR Code', type: 'image', shape: 'rectangle', width: 40, height: 40 },
];

const defaultTemplate: Template = {
  basePdf: '',
  schemas: [[]],
};

const FieldMappingPanel: React.FC<{ onFieldSelect: (field: FieldConfig) => void }> = ({ onFieldSelect }) => (
  <Card className="w-80 h-full">
    <CardHeader>
      <CardTitle className="text-lg">Available Fields</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {AVAILABLE_FIELDS.map((field) => (
        <div
          key={field.key}
          className="p-3 border rounded-lg cursor-pointer hover:bg-accent"
          draggable
          onClick={() => onFieldSelect(field)}
          onDragStart={(e) =>
            e.dataTransfer.setData('application/json', JSON.stringify(field))
          }
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{field.label}</span>
            <Badge variant="secondary">{field.type}</Badge>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const TemplateDesigner: React.FC = () => {
  const [template, setTemplate] = useState<Template>(defaultTemplate);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const stableTemplateRef = useRef<Template>(defaultTemplate);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const designerRef = useRef<Designer | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || '/';

  useEffect(() => {
    stableTemplateRef.current = template;
  }, [template]);

  /* ---------------- LOAD TEMPLATE ---------------- */

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const url = API_URL.endsWith('/')
          ? `${API_URL}load-template`
          : `${API_URL}/load-template`;

        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`Status ${response.status}`);

        const loadedTemplate = await response.json();

        if (
          loadedTemplate.basePdf &&
          typeof loadedTemplate.basePdf === 'string' &&
          loadedTemplate.basePdf.includes('http')
        ) {
          const pdfResponse = await fetch(loadedTemplate.basePdf);
          const pdfBuffer = await pdfResponse.arrayBuffer();
          loadedTemplate.basePdf = new Uint8Array(pdfBuffer);
        }

        setTemplate(loadedTemplate);
        stableTemplateRef.current = loadedTemplate;
      } catch (error) {
        console.error(error);
        toast.error('Failed to load template');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [API_URL]);

  /* ---------------- AUTOSAVE ---------------- */

  const debouncedSave = useCallback(
    (templateToSave: Template) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true);

          const url = API_URL.endsWith('/')
            ? `${API_URL}save-template`
            : `${API_URL}/save-template`;

          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify({ template: templateToSave }),
          });
        } catch (err) {
          console.error('Save error:', err);
        } finally {
          setIsSaving(false);
        }
      }, 1000);
    },
    [API_URL]
  );

  useEffect(() => {
    if (!isLoading) debouncedSave(template);
  }, [template, isLoading, debouncedSave]);

  /* ---------------- AUTH ---------------- */

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;

      setUser(currentUser);
      setIsAdmin(
        currentUser?.user_metadata?.role === 'admin' ||
          currentUser?.email === 'admin@mslpakistan.org'
      );
      setIsAuthLoading(false);
    };

    init();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
  };

  /* ---------------- PDF UPLOAD ---------------- */

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('template', file);

    const url = API_URL.endsWith('/')
      ? `${API_URL}upload-template`
      : `${API_URL}/upload-template`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      toast.success('PDF uploaded');
      window.location.reload();
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  /* ---------------- UI STATES ---------------- */

  if (isAuthLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Lock className="h-8 w-8 animate-pulse" />
      </div>
    );

  if (!user || !isAdmin)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Admin access required</p>
      </div>
    );

  /* ---------------- MAIN UI ---------------- */

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>PDF Template Designer</CardTitle>
          <Button onClick={handleLogout} size="sm" variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">
              Upload PDF Template
            </label>
            <input type="file" accept=".pdf" onChange={handlePdfUpload} />
          </div>

          <div className="flex gap-6 min-h-[700px]">
            <FieldMappingPanel onFieldSelect={() => {}} />

            <div className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  Loading...
                </div>
              ) : (
                <PdfmeDesignerWrapper
                  template={template}
                  onChangeTemplate={setTemplate}
                  designerRef={designerRef}
                  options={{ zoomLevel: 1, sidebarOpen: true, ...uiFontOptions }}
                />
              )}
            </div>
          </div>

          {isSaving && (
            <p className="text-sm text-muted-foreground mt-4">Saving...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateDesigner;
