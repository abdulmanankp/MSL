import React, { useState, useEffect, useCallback, useRef } from 'react';
import PdfmeDesignerWrapper from '@/components/PdfmeDesignerWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, LogOut, Lock } from 'lucide-react';
import type { Template } from '@pdfme/common';
import { BLANK_PDF } from '@pdfme/common';
import type { Designer } from '@pdfme/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { uiFontOptions, DEFAULT_FONT_NAME } from '@/lib/fontConfig';

// Field configuration interface
interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'image';
  shape?: 'circle' | 'rectangle';
  width?: number;
  height?: number;
  border?: boolean;
}

// Available fields from member database that can be mapped to PDF
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

// The basePdf property must be one of:
// - Uint8Array (recommended for loaded PDF data)
// - ArrayBuffer (will be converted to Uint8Array)
// - base64 string (data:application/pdf;base64,...)
// - BLANK_PDF (for a blank template)
const defaultTemplate: Template = {
  basePdf: BLANK_PDF, // Use BLANK_PDF for a blank template by default
  schemas: [[]],
};

// Component for the field mapping side panel
const FieldMappingPanel: React.FC<{
  onFieldSelect: (field: FieldConfig) => void;
}> = ({ onFieldSelect }) => {
  return (
    <Card className="w-80 h-full">
      <CardHeader>
        <CardTitle className="text-lg">Available Fields</CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag these fields onto your PDF template to map member data
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {AVAILABLE_FIELDS.map((field) => (
          <div
            key={field.key}
            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onFieldSelect(field)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify(field));
            }}
          >
            <div className="flex flex-col">
              <span className="font-medium text-sm">{field.label}</span>
              <span className="text-xs text-muted-foreground">{field.key}</span>
              {field.type === 'image' && (
                <span className="text-xs text-muted-foreground">
                  {field.shape} • {field.width}×{field.height}
                </span>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              {field.type}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const TemplateDesigner: React.FC = () => {
  const [template, setTemplate] = useState<Template>(defaultTemplate);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Use a stable template reference to prevent unnecessary re-renders
  const stableTemplateRef = useRef<Template>(defaultTemplate);

  // Update the stable reference when template changes, but only for persistence
  useEffect(() => {
    stableTemplateRef.current = template;
  }, [template]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const designerRef = useRef<Designer | null>(null);

  // Debounced save function
  const debouncedSave = useCallback(async (templateToSave: Template) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        // Create a copy for saving
        const templateForSaving = { ...templateToSave };
        // Only save a URL for basePdf in the backend, but keep Uint8Array/base64/BLANK_PDF in the designer state
        if (templateForSaving.basePdf instanceof Uint8Array || templateForSaving.basePdf instanceof ArrayBuffer) {
          // Save as URL reference to avoid large payloads
          templateForSaving.basePdf = `${API_URL}/get-pdf-template`;
        } else if (typeof templateForSaving.basePdf === 'string' && templateForSaving.basePdf.startsWith('data:application/pdf;base64,')) {
          // Save as URL reference if base64
          templateForSaving.basePdf = `${API_URL}/get-pdf-template`;
        } else if (templateForSaving.basePdf === BLANK_PDF) {
          // Save BLANK_PDF as is
          templateForSaving.basePdf = BLANK_PDF;
        }
        await fetch(`${API_URL}/save-template`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          body: JSON.stringify({ template: templateForSaving }),
        });
      } catch (error) {
        console.error('Error saving template:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Save after 1 second of inactivity
  }, [API_URL]);

  // Load template from server on mount
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await fetch(`${API_URL}/load-template`, {
          mode: 'cors',
        });
        if (response.ok) {
          const loadedTemplate = await response.json();

          // Normalize basePdf formats for the designer
          // If basePdf is an object with numeric keys (serialized Uint8Array), convert it
          if (loadedTemplate.basePdf && typeof loadedTemplate.basePdf === 'object' && !Array.isArray(loadedTemplate.basePdf)) {
            try {
              const obj = loadedTemplate.basePdf as Record<string, number>;
              const keys = Object.keys(obj).map(k => parseInt(k, 10)).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
              const arr = new Uint8Array(keys.length);
              for (let i = 0; i < keys.length; i++) {
                arr[i] = obj[String(keys[i])];
              }
              loadedTemplate.basePdf = arr;
              console.log('Converted serialized basePdf object to Uint8Array for designer, size:', arr.length);
            } catch (err) {
              console.error('Failed to convert serialized basePdf for designer:', err);
            }
          }

          // If basePdf is a string, handle base64 or URL
          if (loadedTemplate.basePdf && typeof loadedTemplate.basePdf === 'string') {
            if (loadedTemplate.basePdf.startsWith('data:application/pdf;base64,')) {
              // Handle base64-encoded PDF
              try {
                const base64 = loadedTemplate.basePdf.split(',')[1];
                const binary = atob(base64);
                const len = binary.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                  bytes[i] = binary.charCodeAt(i);
                }
                loadedTemplate.basePdf = bytes;
                console.log('Converted base64 PDF to Uint8Array for designer, size:', bytes.length);
              } catch (err) {
                console.error('Failed to convert base64 PDF for designer:', err);
              }
            } else if (loadedTemplate.basePdf.includes('http')) {
              try {
                console.log('Fetching PDF data for designer...');
                const pdfResponse = await fetch(loadedTemplate.basePdf, { mode: 'cors' });
                if (pdfResponse.ok) {
                  const pdfBuffer = await pdfResponse.arrayBuffer();
                  loadedTemplate.basePdf = new Uint8Array(pdfBuffer);
                  console.log('Fetched and converted PDF for designer, size:', loadedTemplate.basePdf.length);
                } else {
                  console.error('Failed to fetch PDF data for designer, status:', pdfResponse.status);
                }
              } catch (error) {
                console.error('Error fetching PDF data for designer:', error);
              }
            }
          }
          // If basePdf is an ArrayBuffer, convert to Uint8Array
          if (loadedTemplate.basePdf && loadedTemplate.basePdf instanceof ArrayBuffer) {
            loadedTemplate.basePdf = new Uint8Array(loadedTemplate.basePdf);
            console.log('Converted ArrayBuffer PDF to Uint8Array for designer, size:', loadedTemplate.basePdf.length);
          }
          // Normalize existing schema fields:
          try {
            if (Array.isArray(loadedTemplate.schemas)) {
              loadedTemplate.schemas = loadedTemplate.schemas.map((page: Array<Record<string, unknown>>) => {
                return (page || []).map((field: Record<string, unknown>) => {
                  // Default text fields to Montserrat if they reference Roboto or have no fontName
                  if (field && field.type === 'text') {
                    if (!field.fontName || String(field.fontName).toLowerCase().includes('roboto')) {
                      field.fontName = DEFAULT_FONT_NAME;
                    }
                    // Ensure bold is set (default to false if not present)
                    if ((field as Record<string, unknown>).bold === undefined) {
                      (field as Record<string, unknown>).bold = false;
                    }
                  }

                  // For the profile photo field, apply SVG circular shape with white border
                  if (field && field.type === 'image' && String(field.name) === 'profile_photo') {
                    field.borderWidth = field.borderWidth !== undefined ? field.borderWidth : 1;
                    field.borderColor = field.borderColor || '#FFFFFF';
                  }

                  return field;
                });
              });
            }
          } catch (err) {
            console.warn('Failed to normalize template schemas:', err);
          }

          setTemplate(loadedTemplate);
          stableTemplateRef.current = loadedTemplate;
        }
      } catch (error) {
        console.error('Error loading template:', error);
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to load template: ${msg}. Ensure the template server is running at http://localhost:3001`);
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplate();
  }, [API_URL]);

  // Auto-save template changes to server with debouncing
  useEffect(() => {
    if (!isLoading) {
      debouncedSave(template);
    }
  }, [template, isLoading, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Authentication
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsAdmin(session?.user?.user_metadata?.role === 'admin' || session?.user?.email === 'admin@mslpakistan.org');
      setIsAuthLoading(false);
    };

    getInitialSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setIsAdmin(session?.user?.user_metadata?.role === 'admin' || session?.user?.email === 'admin@mslpakistan.org');
        setIsAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);

    // Upload PDF to server
    const formData = new FormData();
    formData.append('template', file);

    try {
      const response = await fetch(`${API_URL}/upload-template`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        // After upload, fetch the PDF as binary and set as Uint8Array
        const pdfUrl = `${API_URL}/get-pdf-template`;
        const pdfResponse = await fetch(pdfUrl, { mode: 'cors' });
        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();
          setTemplate((prev) => ({ ...prev, basePdf: new Uint8Array(pdfBuffer) }));
          alert('PDF uploaded and saved successfully!');
        } else {
          console.error('Failed to fetch PDF with CORS:', pdfResponse.status);
          alert('PDF uploaded but failed to load. Please try again.');
        }
      } else {
        console.error('Upload failed:', response.status);
        alert('Failed to upload PDF');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload PDF');
    }
  };

  const handleFieldSelect = (field: FieldConfig) => {
    // This will be used when we implement drag and drop or click-to-add functionality
    console.log('Selected field:', field);
    // For now, we'll just log it. Later we can integrate with the PDF designer
  };

  const handleFieldDrop = (field: FieldConfig, position: { x: number; y: number; domX?: number; domY?: number; scale?: number }) => {
    // Directly update the stable template reference without triggering React re-renders
    const currentTemplate = stableTemplateRef.current;
    const newTemplate = { ...currentTemplate };

    if (!newTemplate.schemas || newTemplate.schemas.length === 0) {
      newTemplate.schemas = [[]];
    }

    // Use the PDF coordinates (already converted)
    const pdfX = Math.max(0, position.x - 25); // Center the field
    const pdfY = Math.max(0, position.y - 10);

    // Create a new field schema based on the field type
    const fieldSchema: { [x: string]: unknown; name: string; type: string; position: { x: number; y: number; }; width: number; height: number; content?: string; rotate?: number; opacity?: number; readOnly?: boolean; required?: boolean; __isSplit?: boolean; } = {
      name: field.key,
      type: field.type,
      content: field.type === 'image' ? '' : `{{${field.key}}}`,
      position: { x: pdfX, y: pdfY },
      width: field.width || 100,
      height: field.height || (field.type === 'image' ? 100 : 20),
      // Text field defaults
      fontName: field.type === 'text' ? DEFAULT_FONT_NAME : undefined,
      fontSize: field.type === 'text' ? 12 : undefined,
      fontColor: field.type === 'text' ? '#000000' : undefined,
      bold: field.type === 'text' ? false : undefined, // Use bold instead of fontWeight
      // Profile photo: apply SVG circular white border (uses custom SVG plugin)
      ...(field.type === 'image' && field.key === 'profile_photo' ? {
        borderWidth: 1,
        borderColor: '#FFFFFF',
      } : {}),
    };

    // Add to the first page schema
    newTemplate.schemas[0] = [...(newTemplate.schemas[0] || []), fieldSchema];

    // Update the stable reference
    stableTemplateRef.current = newTemplate;

    // Update the designer directly if it exists (this won't cause React re-render)
    if (designerRef.current && typeof designerRef.current.updateTemplate === 'function') {
      try {
        designerRef.current.updateTemplate(newTemplate);
      } catch (error) {
        console.warn('Designer updateTemplate not available, falling back to state update');
        // Fallback: update React state
        setTemplate(newTemplate);
      }
    } else {
      // Fallback: update React state (will cause re-render but only as last resort)
      setTemplate(newTemplate);
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`${API_URL}/save-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ template }),
      });
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Login required
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Admin Access Required</h1>
            <p className="text-muted-foreground mt-2">
              You need admin privileges to access the template designer.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-sm text-muted-foreground">
                Please contact your administrator if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>PDF Template Designer</CardTitle>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          <div className="flex items-center justify-between">
            {isSaving && <p className="text-sm text-muted-foreground">Saving...</p>}
            <Button onClick={handleManualSave} disabled={isSaving} size="sm">
              Save Now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Upload PDF Template</label>
            <input type="file" accept=".pdf" onChange={handlePdfUpload} className="border rounded p-2" />
            {template.basePdf && <p className="text-sm text-green-600 mt-1">PDF uploaded and saved permanently</p>}
          </div>
          <div className="flex gap-6" style={{ minHeight: 700 }}>
            <div className="flex-shrink-0">
              <FieldMappingPanel onFieldSelect={handleFieldSelect} />
            </div>
            <div className="flex-1" style={{ position: 'relative', minHeight: 700 }}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading template...</p>
                  </div>
                </div>
              ) : !template.basePdf || (typeof template.basePdf === 'string' && template.basePdf && typeof template.basePdf === 'string' && template.basePdf.trim().length === 0) ? (
                <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Please upload a PDF template first</p>
                  </div>
                </div>
              ) : (
                <PdfmeDesignerWrapper
                  template={template}
                  onChangeTemplate={setTemplate}
                  onFieldDrop={handleFieldDrop}
                  options={{ 
                    zoomLevel: 1, 
                    sidebarOpen: true,
                    ...uiFontOptions
                  }}
                  designerRef={designerRef}
                />
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Changes are automatically saved to the server after 1 second of inactivity. Use "Save Now" for immediate saves.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default TemplateDesigner;
