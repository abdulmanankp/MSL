// Extend HTMLDivElement to include our custom properties
declare global {
  interface HTMLDivElement {
    _dragStartHandler?: () => void;
    _dragEndHandler?: () => void;
  }
}

import React, { useEffect, useRef, useCallback } from 'react';
import { Designer } from '@pdfme/ui';
import { image, text } from '@pdfme/schemas';
import type { Template } from '@pdfme/common';
import { fontConfig, uiFontOptions } from '@/lib/fontConfig';
import { circularImagePlugin } from '@/lib/circularImagePlugin';

// Custom text plugin with Montserrat support and bold control
const customText = {
  ...text,
  propPanel: {
    ...text.propPanel,
    defaultSchema: {
      ...(text.propPanel.defaultSchema as Record<string, unknown>),
      fontName: 'Montserrat',
      bold: false, // Use bold (boolean) instead of fontWeight
    },
  },
} as unknown as typeof text;

// Custom image plugin with SVG-based circular rendering for profile photos
// Uses SVG clipPath to create perfect circles with white borders
const customImage = {
  ...circularImagePlugin,
  propPanel: {
    ...circularImagePlugin.propPanel,
    defaultSchema: {
      ...(circularImagePlugin.propPanel.defaultSchema as Record<string, unknown>),
      // Circular profile photo with white border (1px)
      borderWidth: 1,
      borderColor: '#FFFFFF',
    },
  },
} as unknown as typeof image;

// Field configuration interface
interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'image';
  shape?: 'circle' | 'rectangle';
  width?: number;
  height?: number;
}

interface PdfmeDesignerWrapperProps {
  template: Template;
  onChangeTemplate?: (template: Template) => void;
  options?: Record<string, unknown>;
  onFieldDrop?: (field: FieldConfig, position: { x: number; y: number; domX?: number; domY?: number; scale?: number }) => void;
  designerRef?: React.MutableRefObject<Designer | null>;
}

const PdfmeDesignerWrapper: React.FC<PdfmeDesignerWrapperProps> = ({
  template,
  onChangeTemplate,
  options,
  onFieldDrop,
  designerRef: externalDesignerRef
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const designerRef = useRef<Designer | null>(null);
  const isDraggingRef = useRef(false);

  // Use external ref if provided, otherwise use internal ref
  const currentDesignerRef = externalDesignerRef || designerRef;

  // Ensure Montserrat font is available for the designer preview (weights: 300=light, 400=regular, 700=bold)
  useEffect(() => {
    const id = 'pdfme-montserrat-font';
    if (typeof document !== 'undefined' && !document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const handleTemplateChange = useCallback((newTemplate: Template) => {
    // Only call onChangeTemplate if we're not currently dragging, not in a field drop operation, and not disabled
    // This prevents constant re-renders during drag operations and field additions
    if (!isDraggingRef.current && !isFieldDropRef.current && onChangeTemplate) {
      onChangeTemplate(newTemplate);
    }
  }, [onChangeTemplate]);

  // Track field drop operations
  const isFieldDropRef = useRef(false);

  useEffect(() => {
    let designerContainer: HTMLDivElement | null = null;
    
    // Only initialize if the ref is attached and designer doesn't exist
    if (containerRef.current && !currentDesignerRef.current) {
      designerContainer = containerRef.current; // Capture the current value
      
      currentDesignerRef.current = new Designer({
        domContainer: designerContainer,
        template,
        options: {
          ...options,
          font: fontConfig,
          ...uiFontOptions,
        },
        plugins: {
          text: customText,
          image: customImage,
        },
      });

      // Set up template change handler
      currentDesignerRef.current.onChangeTemplate(handleTemplateChange);

      // Listen for drag start/end events to prevent template updates during drag
      const handleDragStart = () => {
        isDraggingRef.current = true;
      };

      const handleDragEnd = () => {
        isDraggingRef.current = false;
      };

      // Add event listeners to the designer container
      designerContainer.addEventListener('dragstart', handleDragStart);
      designerContainer.addEventListener('dragend', handleDragEnd);

      // Store the handlers for cleanup
      designerContainer._dragStartHandler = handleDragStart;
      designerContainer._dragEndHandler = handleDragEnd;
    }

    // Cleanup function
    return () => {
      if (designerContainer) {
        if (designerContainer._dragStartHandler) {
          designerContainer.removeEventListener('dragstart', designerContainer._dragStartHandler);
        }
        if (designerContainer._dragEndHandler) {
          designerContainer.removeEventListener('dragend', designerContainer._dragEndHandler);
        }
      }

      if (currentDesignerRef.current) {
        currentDesignerRef.current.destroy();
        currentDesignerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect to update template when it changes
  useEffect(() => {
    if (currentDesignerRef.current && template) {
      // Update the template if the designer exists and template has changed
      try {
        if (typeof currentDesignerRef.current.updateTemplate === 'function') {
          currentDesignerRef.current.updateTemplate(template);
        }
      } catch (error) {
        console.warn('Failed to update template:', error);
      }
    }
  }, [template, currentDesignerRef]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    isFieldDropRef.current = true; // Mark that we're in a field drop operation

    if (onFieldDrop && currentDesignerRef.current) {
      try {
        const field = JSON.parse(e.dataTransfer.getData('application/json')) as FieldConfig;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          // Convert DOM coordinates to PDF coordinates using pdfme's coordinate system
          const domX = e.clientX - rect.left;
          const domY = e.clientY - rect.top;

          // Use default scale of 1 (pdfme coordinate system)
          const scale = 1;

          // Convert to PDF coordinates (pdfme uses points, 72 DPI)
          // The conversion depends on how pdfme renders the PDF
          const pdfX = Math.max(0, domX / scale);
          const pdfY = Math.max(0, domY / scale);

          const position = {
            x: pdfX,
            y: pdfY,
            domX: domX,
            domY: domY,
            scale: scale
          };
          onFieldDrop(field, position);
        }
      } catch (error) {
        console.error('Error parsing dropped field:', error);
      } finally {
        isFieldDropRef.current = false; // Reset the flag
      }
    } else {
      isFieldDropRef.current = false; // Reset the flag if no drop handler
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: 650,
        height: 650,
        width: '100%',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    />
  );
};

export default PdfmeDesignerWrapper;
