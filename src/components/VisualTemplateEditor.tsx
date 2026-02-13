import React, { useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Move, Type, Image as ImageIcon, QrCode, Settings } from 'lucide-react';

// Configure PDF.js worker - using CDNJS for a valid version (3.11.174)
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

interface TemplateField {
  id: string;
  field_name: string;
  field_type: string;
  page_number: number;
  x_position: number | null;
  y_position: number | null;
  width: number | null;
  height: number | null;
  font_family: string | null;
  font_size: number | null;
  font_color: string | null;
  text_alignment: string | null;
  image_shape: string | null;
  has_border: boolean | null;
}

interface VisualTemplateEditorProps {
  templatePdfData: string; // base64 PDF data
  fields: TemplateField[];
  onFieldAdd: (field: Partial<TemplateField>) => void;
  onFieldUpdate: (fieldId: string, updates: Partial<TemplateField>) => void;
  onFieldDelete: (fieldId: string) => void;
}

const FIELD_OPTIONS = [
  { value: 'full_name', label: 'Full Name' },
  { value: 'membership_id', label: 'Membership ID' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp_number', label: 'WhatsApp Number' },
  { value: 'designation', label: 'Designation' },
  { value: 'district', label: 'District' },
  { value: 'complete_address', label: 'Complete Address' },
  { value: 'area_of_interest', label: 'Area of Interest' },
  { value: 'education_level', label: 'Education Level' },
  { value: 'degree_institute', label: 'Degree Institute' },
  { value: 'profile_photo', label: 'Profile Photo' },
  { value: 'qr_code', label: 'QR Code' },
];

export const VisualTemplateEditor: React.FC<VisualTemplateEditorProps> = ({
  templatePdfData,
  fields,
  onFieldAdd,
  onFieldUpdate,
  onFieldDelete,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [draggedField, setDraggedField] = useState<TemplateField | null>(null);
  const [selectedField, setSelectedField] = useState<TemplateField | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Reset loading state when template changes
  React.useEffect(() => {
    setPdfLoading(true);
    setPdfError(null);
    setNumPages(null);
    setPageNumber(1);
  }, [templatePdfData]);

  const [newField, setNewField] = useState<Partial<TemplateField>>({
    field_type: 'text',
    page_number: 1,
    text_alignment: 'left',
    image_shape: 'square',
    has_border: false
  });

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfLoading(false);
    setPdfError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setPdfError('Failed to load PDF. Please try again.');
    setPdfLoading(false);
  }, []);

  const handleDragStart = (field: TemplateField) => {
    setDraggedField(field);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (!draggedField || !pdfContainerRef.current) return;

    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to PDF coordinates (assuming PDF is scaled to fit container)
    const pdfWidth = rect.width;
    const pdfHeight = rect.height;

    onFieldUpdate(draggedField.id, {
      x_position: (x / pdfWidth) * 100, // Percentage
      y_position: (y / pdfHeight) * 100, // Percentage
      page_number: pageNumber
    });

    setIsDragging(false);
    setDraggedField(null);
  };

  const handleFieldClick = (field: TemplateField) => {
    setSelectedField(field);
  };

  const addFieldToPosition = (x: number, y: number) => {
    if (!newField.field_name || !newField.field_type) return;

    const rect = pdfContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pdfX = ((x - rect.left) / rect.width) * 100;
    const pdfY = ((y - rect.top) / rect.height) * 100;

    onFieldAdd({
      ...newField,
      x_position: pdfX,
      y_position: pdfY,
      page_number: pageNumber
    });

    setNewField({
      field_type: 'text',
      page_number: pageNumber,
      text_alignment: 'left',
      image_shape: 'square',
      has_border: false
    });
  };

  const renderFieldElement = (field: TemplateField) => {
    if (field.page_number !== pageNumber) return null;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${field.x_position || 0}%`,
      top: `${field.y_position || 0}%`,
      zIndex: 10,
    };

    const icon = field.field_type === 'text' ? <Type className="w-3 h-3" /> :
                 field.field_type === 'image' ? <ImageIcon className="w-3 h-3" /> :
                 <QrCode className="w-3 h-3" />;

    return (
      <div
        key={field.id}
        style={style}
        className={`pdf-field-element ${selectedField?.id === field.id ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        draggable
        onDragStart={() => handleDragStart(field)}
        onDragEnd={handleDragEnd}
        onClick={() => handleFieldClick(field)}
      >
        <div className="field-icon">{icon}</div>
        <span className="field-label">{field.field_name}</span>
        <button
          className="field-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onFieldDelete(field.id);
          }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* PDF Preview */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>PDF Preview - Page {pageNumber} of {numPages}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
                  disabled={pageNumber >= (numPages || 1)}
                >
                  Next
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={pdfContainerRef}
              className="pdf-container"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('react-pdf__Page__canvas')) {
                  addFieldToPosition(e.clientX, e.clientY);
                }
              }}
            >
              {templatePdfData ? (
                <Document
                  file={{ url: templatePdfData }}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  className="flex justify-center"
                  loading={
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p>Loading PDF...</p>
                      </div>
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center text-red-500">
                        <p>{pdfError || 'Failed to load PDF. The PDF file may be corrupted.'}</p>
                      </div>
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={1.0}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-lg"
                  />
                </Document>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center text-red-500">
                    <p>Invalid PDF data. Please upload a valid PDF template.</p>
                  </div>
                </div>
              )}

              {/* Render field elements */}
              {fields.map(renderFieldElement)}

              {fields.filter(f => f.page_number === pageNumber).length === 0 && (
                <div className="pdf-drop-zone">
                  <div className="text-center">
                    <Move className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Click on the PDF to add fields or drag existing fields to reposition</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Configuration */}
      <div className="space-y-6">
        {/* Add New Field */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Field</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Field Name</label>
              <Select
                value={newField.field_name || ''}
                onValueChange={(value) => setNewField({ ...newField, field_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Field Type</label>
              <Select
                value={newField.field_type || 'text'}
                onValueChange={(value) => setNewField({ ...newField, field_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="qr_code">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type-specific options */}
            {newField.field_type === 'text' && (
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Font Size</label>
                  <Input
                    type="number"
                    placeholder="12"
                    value={newField.font_size || ''}
                    onChange={(e) => setNewField({ ...newField, font_size: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Font Color</label>
                  <Input
                    type="color"
                    value={newField.font_color || '#000000'}
                    onChange={(e) => setNewField({ ...newField, font_color: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Alignment</label>
                  <Select
                    value={newField.text_alignment || 'left'}
                    onValueChange={(value) => setNewField({ ...newField, text_alignment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  <div>
                    <label className="text-sm font-medium">Width</label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newField.width || ''}
                      onChange={(e) => setNewField({ ...newField, width: parseFloat(e.target.value) || undefined })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Height</label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={newField.height || ''}
                      onChange={(e) => setNewField({ ...newField, height: parseFloat(e.target.value) || undefined })}
                    />
                  </div>
              </div>
            )}

            {newField.field_type === 'image' && (
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Shape</label>
                  <Select
                    value={newField.image_shape || 'square'}
                    onValueChange={(value) => setNewField({ ...newField, image_shape: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Width</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={newField.width || ''}
                    onChange={(e) => setNewField({ ...newField, width: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Height</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={newField.height || ''}
                    onChange={(e) => setNewField({ ...newField, height: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_border"
                    checked={newField.has_border || false}
                    onChange={(e) => setNewField({ ...newField, has_border: e.target.checked })}
                  />
                  <label htmlFor="has_border" className="text-sm font-medium">Border</label>
                </div>
              </div>
            )}

            <Button
              onClick={() => addFieldToPosition(0, 0)}
              disabled={!newField.field_name || !newField.field_type}
              className="w-full"
            >
              Add Field
            </Button>
          </CardContent>
        </Card>

        {/* Existing Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Fields ({fields.filter(f => f.page_number === pageNumber).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fields
                .filter(f => f.page_number === pageNumber)
                .map((field) => (
                  <div
                    key={field.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedField?.id === field.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedField(field)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {field.field_type === 'text' && <Type className="w-4 h-4" />}
                        {field.field_type === 'image' && <ImageIcon className="w-4 h-4" />}
                        {field.field_type === 'qr_code' && <QrCode className="w-4 h-4" />}
                        <span className="font-medium">{field.field_name}</span>
                      </div>
                      <Badge variant="outline">{field.field_type}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Position: {field.x_position?.toFixed(1)}%, {field.y_position?.toFixed(1)}%
                    </div>
                  </div>
                ))}
              {fields.filter(f => f.page_number === pageNumber).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No fields on this page
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};