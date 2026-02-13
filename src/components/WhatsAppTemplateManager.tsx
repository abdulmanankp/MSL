import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, RefreshCw, Copy } from 'lucide-react';

interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  type: 'approval' | 'otp' | 'registration';
  description?: string;
  content: {
    file?: { type: string; caption?: string };
    text: string;
    button?: { type: string; text: string; payload?: string };
  };
  createdAt: string;
  isDefault?: boolean;
}

interface WhatsAppTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhatsAppTemplateManager: React.FC<WhatsAppTemplateManagerProps> = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState<Record<string, WhatsAppTemplate>>({});
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [selectedType, setSelectedType] = useState<'approval' | 'otp' | 'registration'>('approval');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ur'>('en');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/whatsapp/templates`);
      const json = await resp.json();
      if (json?.all) {
        setTemplates(json.all);
        console.log('✅ Loaded templates:', Object.keys(json.all).length);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Load templates on mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  const updateTemplate = async () => {
    if (!editingTemplate?.id) return;

    try {
      const resp = await fetch(`${API_URL}/whatsapp/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTemplate.name,
          description: editingTemplate.description,
          content: editingTemplate.content
        })
      });

      const json = await resp.json();
      if (json?.success) {
        setTemplates(prev => ({ ...prev, [editingTemplate.id]: json.template }));
        toast.success('Template updated successfully');
        setEditingTemplate(null);
      } else {
        toast.error(json?.error || 'Failed to update template');
      }
    } catch (err) {
      console.error('Error updating template:', err);
      toast.error('Failed to update template');
    }
  };

  const groupedTemplates = {
    approval: Object.values(templates).filter(t => t.type === 'approval'),
    otp: Object.values(templates).filter(t => t.type === 'otp'),
    registration: Object.values(templates).filter(t => t.type === 'registration')
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>WhatsApp Template Manager</DialogTitle>
          <DialogDescription>
            View and edit system WhatsApp templates for registration, OTP verification, and approval notifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* System Templates Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              📋 These are system templates managed by developers. Edit message content as needed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadTemplates}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Tabs for Template Types */}
          <Tabs defaultValue="approval" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="approval">Approval ({groupedTemplates.approval.length})</TabsTrigger>
              <TabsTrigger value="otp">OTP ({groupedTemplates.otp.length})</TabsTrigger>
              <TabsTrigger value="registration">Registration ({groupedTemplates.registration.length})</TabsTrigger>
            </TabsList>

            {['approval', 'otp', 'registration'].map(type => (
              <TabsContent key={type} value={type} className="space-y-3">
                {groupedTemplates[type as keyof typeof groupedTemplates].length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No {type} templates found
                    </CardContent>
                  </Card>
                ) : (
                  groupedTemplates[type as keyof typeof groupedTemplates].map(template => (
                    <Card key={template.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                          </div>
                          <div className="flex gap-1">
                            <Badge>{template.language.toUpperCase()}</Badge>
                            <Badge variant="outline">{template.type}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap break-words">
                          {template.content.text}
                        </div>
                        {template.content.file && (
                          <div className="text-xs text-muted-foreground">
                            📎 File: {template.content.file.type} - {template.content.file.caption}
                          </div>
                        )}
                        {template.content.button && (
                          <div className="text-xs text-muted-foreground">
                            🔘 Button: {template.content.button.text} ({template.content.button.type})
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingTemplate(template)}
                            className="gap-2"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(template.content.text);
                              toast.success('Copied to clipboard');
                            }}
                            className="gap-2"
                          >
                            <Copy className="h-3 w-3" />
                            Copy Text
                          </Button>

                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>



        {/* Edit Template Dialog */}
        {editingTemplate && (
          <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate(p => p ? { ...p, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={editingTemplate.description || ''}
                    onChange={e => setEditingTemplate(p => p ? { ...p, description: e.target.value } : null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message Text</label>
                  <Textarea
                    value={editingTemplate.content.text}
                    onChange={e => setEditingTemplate(p => p ? { ...p, content: { ...p.content, text: e.target.value } } : null)}
                    rows={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={updateTemplate}>Update Template</Button>
                  <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppTemplateManager;
