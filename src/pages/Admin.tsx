import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { Database } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';
import type { User, Session } from '@supabase/supabase-js';
import { Loader2, Users, UserCheck, UserX, Eye, CheckCircle, XCircle, Upload, LogOut, Search, Clock, RefreshCw, Settings, FileText, Download, Lock, MessageSquare } from 'lucide-react';
import { generatePdfmeCard } from '@/lib/generatePdfmeCard';
import WhatsAppTemplateManager from '@/components/WhatsAppTemplateManager';

type Member = Database['public']['Tables']['members']['Row'];
type MemberStatus = Database['public']['Enums']['member_status'];
// Override CardTemplate type to match new schema (pdf_url only)
type CardTemplate = {
  id: string;
  name: string;
  description: string;
  pdf_url?: string | null;
  page_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
type TemplateField = Database['public']['Tables']['template_fields']['Row'];

const statusColors: Record<MemberStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
};

const areaLabels: Record<string, string> = {
  muslim_kids: 'Muslim Kids',
  media_department: 'Media Department',
  madadgar_team: 'Madadgar Team',
  universities_department: 'Universities Department',
  msl_team: 'MSL Team',
  it_department: 'IT Department',
};

const educationLabels: Record<string, string> = {
  hafiz_quran: 'Hafiz e Quran',
  matric: 'Matric',
  inter: 'Inter',
  bs: 'BS',
  masters: 'Masters',
  phd: 'PHD',
};

const Admin: React.FC = () => {

    // Bulk selection state
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [templates, setTemplates] = useState<CardTemplate[]>([]);
    // Load templates from localStorage on mount
    useEffect(() => {
      const storedTemplates = localStorage.getItem('msl_templates');
      if (storedTemplates) {
        setTemplates(JSON.parse(storedTemplates));
      }
    }, []);
    // Save templates to localStorage on change
    useEffect(() => {
      localStorage.setItem('msl_templates', JSON.stringify(templates));
    }, [templates]);
    // Bulk status update handler
    const bulkUpdateMemberStatus = async (newStatus: MemberStatus) => {
      if (selectedMemberIds.length === 0) return;

      setIsUpdating(true);
      try {
        console.log(`🔄 Bulk updating ${selectedMemberIds.length} members to ${newStatus}`);
        console.log('   Member IDs:', selectedMemberIds);
        
        const { error } = await supabase
          .from('members')
          .update({ status: newStatus })
          .in('id', selectedMemberIds);

        if (error) {
          console.error('❌ Bulk update error:', error);
          console.error('   Error code:', error.code);
          console.error('   Error message:', error.message);
          
          // Check if it's an RLS policy issue
          if (error.message && error.message.includes('row-level security policy')) {
            toast.error('Admin permission denied - RLS policy not configured. Please check documentation.');
          } else {
            toast.error(`Failed to update: ${error.message || 'Unknown error'}`);
          }
          
          setIsUpdating(false);
          return;
        }

        console.log('✅ Bulk update successful on backend');

        // Update local state immediately
        setMembers(prevMembers =>
          prevMembers.map(member =>
            selectedMemberIds.includes(member.id) ? { ...member, status: newStatus } : member
          )
        );

        toast.success(`${selectedMemberIds.length} member(s) status updated to ${newStatus}`);
        setSelectedMemberIds([]); // Clear selection
        
        console.log('🔄 Refreshing member list from server...');
        await fetchMembers(); // Refresh from server
        console.log('✅ Member list refreshed');
      } catch (error) {
        console.error('❌ Bulk update error:', error);
        toast.error('Failed to update member statuses');
      } finally {
        setIsUpdating(false);
      }
    };
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // const [bucketFiles, setBucketFiles] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [newField, setNewField] = useState<Partial<TemplateField>>({
    field_type: 'text',
    page_number: 1,
    text_alignment: 'left',
    image_shape: 'square',
    has_border: false
  });
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [settings, setSettings] = useState({ whatsapp_enabled: true, downloads_per_week: 1, registration_enabled: true });
  // No longer using Supabase bucket for PDFs

  // Ref to track current blob URL for cleanup
  const currentBlobUrlRef = React.useRef<string | null>(null);

  // PDF preview uses blob URL for CORS safety
  // Use direct URL for PDF preview (no blob fetch needed)
  const pdfDataUrl = selectedTemplate?.pdf_url || '';

    // Delete template from local state only
    const deleteTemplate = async (template: CardTemplate) => {
      if (!window.confirm('Are you sure you want to delete this template?')) return;
      setTemplates(templates.filter(t => t.id !== template.id));
      toast.success('Template deleted successfully');
    };
  // No-op fetchTemplates: only local state is used for templates
  const fetchTemplates = React.useCallback(async () => {
    setIsLoadingTemplates(false);
  }, []);

  // fetchMembers: fetch from Supabase
  const fetchMembers = React.useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to fetch members');
      setIsLoading(false);
      return;
    }
    setMembers(data || []);
    setIsLoading(false);
  }, []);

  // Authentication state management
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsAdmin(session?.user?.user_metadata?.role === 'admin' || session?.user?.email === 'admin@mslpakistan.org');
      setIsAuthLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setIsAdmin(session?.user?.user_metadata?.role === 'admin' || session?.user?.email === 'admin@mslpakistan.org');
        setIsAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch members/templates on mount when authenticated
  useEffect(() => {
    if (user && isAdmin) {
      fetchMembers();
      fetchTemplates();
      // fetch whatsapp settings from server
      const API_URL = import.meta.env.VITE_API_URL || '/';
      (async () => {
        try {
          const resp = await fetch(`${API_URL}/admin/settings`);
          const json = await resp.json();
          if (json?.success && json.settings) setSettings(json.settings);
        } catch (e) {
          console.warn('Failed to load settings', e);
        }
      })();
    }
  }, [user, isAdmin, fetchMembers, fetchTemplates]);

  const saveSettings = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/';
      const resp = await fetch(`${API_URL}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const json = await resp.json();
      if (json?.success) {
        toast.success('Settings saved');
        setSettingsOpen(false);
      } else {
        toast.error('Failed to save settings');
      }
    } catch (e) {
      console.error('save settings error', e);
      toast.error('Failed to save settings');
    }
  };

  // handleLogin: authenticate with Supabase
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        // Check if user is admin
        const isUserAdmin = data.user.user_metadata?.role === 'admin' || data.user.email === 'admin@mslpakistan.org';
        if (!isUserAdmin) {
          await supabase.auth.signOut();
          toast.error('Access denied. Admin privileges required.');
          return;
        }

        toast.success('Login successful!');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // handleLogout: sign out from Supabase
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  // Duplicate fetchMembers removed. Use the useCallback version above.

  // updateMemberStatus: update in Supabase
  const updateMemberStatus = async (memberId: string, newStatus: MemberStatus) => {
    setIsUpdating(true);
    // capture member data before updating so we can generate card
    const memberBefore = members.find(m => m.id === memberId) || null;
    try {
      console.log(`🔄 Updating member ${memberId} status to ${newStatus}`);
      console.log(`👤 Current user:`, user?.email);
      console.log(`👑 Is Admin:`, isAdmin);

      const { error } = await supabase
        .from('members')
        .update({ status: newStatus })
        .eq('id', memberId);

      if (error) {
        console.error('❌ SUPABASE UPDATE FAILED:');
        console.error('   Code:', error.code);
        console.error('   Message:', error.message);
        console.error('   Details:', error);

        // Check for specific errors
        if (error.message && error.message.includes('row-level security')) {
          toast.error('🔒 PERMISSION DENIED: RLS policy "Admins can update members" is NOT configured. Ask admin to run the SQL fix.');
          console.error('📋 TO FIX: Run the SQL in EMERGENCY_FIX_ACTIONS_NOT_WORKING.md');
        } else if (error.message && error.message.includes('permission')) {
          toast.error('❌ Permission denied. Admin role may not be assigned.');
        } else {
          toast.error(`Update failed: ${error.message}`);
        }

        setIsUpdating(false);
        return;
      }

      console.log('✅ Backend update successful!');

      // Update local state immediately for better UX
      setMembers(prevMembers =>
        prevMembers.map(member =>
          member.id === memberId ? { ...member, status: newStatus } : member
        )
      );

      toast.success('✅ Member status updated successfully!');

      // If approved, generate card, upload and notify via WhatsApp
      if (newStatus === 'approved' && memberBefore) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || '/';
          console.log('🧾 Generating card for member (on approval)...');
          const pdfBlob = await generatePdfmeCard(memberBefore);

          // Upload generated PDF to backend
          const form = new FormData();
          form.append('card', pdfBlob, `${memberBefore.membership_id}-card.pdf`);
          form.append('membership_id', memberBefore.membership_id);

          console.log('🔼 Uploading card to server...');
          const uploadResp = await fetch(`${API_URL}upload-card`, {
            method: 'POST',
            body: form as BodyInit,
          });
          const uploadJson = await uploadResp.json();
          console.log('📤 Upload response:', uploadJson);

          const cardUrl = uploadJson?.url;

          // Notify member via WhatsApp with template info (server will send text + media if provided)
          const language = 'en'; // You can make this configurable
          console.log('📲 Notifying member via WhatsApp with template [approval_' + language + ']...');
          const notifyResp = await fetch(`${API_URL}whatsapp/notify-approval`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              phone: memberBefore.whatsapp_number, 
              card_url: cardUrl, 
              membership_id: memberBefore.membership_id,
              language: language 
            })
          });
          const notifyJson = await notifyResp.json();
          console.log('✅ WhatsApp notification sent. Template:', notifyJson?.template);
        } catch (err) {
          console.error('Error generating/uploading/sending card:', err);
          // don't block the status update UX; just warn
          toast.error('Warning: card generation or WhatsApp send failed. Check logs.');
        }
      }

      // Refresh from server to ensure consistency
      console.log('🔄 Refreshing member list...');
      await fetchMembers();
      console.log('✅ Member list refreshed from database');
    } catch (error) {
      console.error('❌ Exception during update:', error);
      toast.error('Failed to update member status');
    } finally {
      setIsUpdating(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Membership ID', 'Full Name', 'Email', 'WhatsApp', 'Designation', 'District', 'Provincial Seat', 'Area of Interest', 'Education', 'Status', 'Created At'];
    const csvData = filteredMembers.map(m => [
      m.membership_id,
      m.full_name,
      m.email,
      m.whatsapp_number,
      m.designation,
      m.district,
      m.provincial_seat || '',
      areaLabels[m.area_of_interest],
      educationLabels[m.education_level],
      m.status,
      new Date(m.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredMembers = members.filter(member => {
    // Defensive: if members is empty or not loaded
    if (!member) return false;
    const matchesSearch =
      (member.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.membership_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.whatsapp_number || '').includes(searchQuery);
    return matchesSearch;
  });

  // Duplicate fetchTemplates removed. Use the useCallback version above.

  // No-op fetchTemplateFields: only local state is used for fields
  const fetchTemplateFields = async (templateId: string) => {
    setIsLoadingFields(false);
  };

  const uploadTemplate = async (file: File, name: string, description?: string) => {
    setIsUploadingTemplate(true);
    try {
      // Validate file type
      if (!file.type.includes('pdf')) {
        toast.error('Please select a valid PDF file (application/pdf).');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB.');
        return;
      }

      // Upload PDF to backend server
      const API_URL = import.meta.env.VITE_API_URL || '/';
      const formData = new FormData();
      formData.append('template', file);
      const response = await fetch(`${API_URL}upload-template`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to upload template');
      }
      const data = await response.json();
      // Use the full URL returned from backend
      const pdfUrl = data.url;

      // Optionally, insert template record in your DB (if needed)
      // Here, we just add to local state for demo
      const newTemplate: CardTemplate = {
        id: Date.now().toString(),
        name,
        description: description || '',
        pdf_url: pdfUrl,
        page_count: 1,
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTemplates([newTemplate, ...templates]);
      toast.success('Template uploaded successfully');
      return newTemplate;
    } catch (error) {
      console.error('Upload error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload template';
      toast.error(errorMessage);
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  // addTemplateField: no-op or implement with your own API/local state
  const addTemplateField = async () => {
    toast.error('Add template field not implemented.');
  };

  // updateTemplateField: no-op or implement with your own API/local state
  const updateTemplateField = async (fieldId: string, updates: Partial<TemplateField>) => {
    toast.error('Update template field not implemented.');
  };

  // deleteTemplateField: no-op or implement with your own API/local state
  const deleteTemplateField = async (fieldId: string) => {
    toast.error('Delete template field not implemented.');
  };

  // setActiveTemplate: no-op or implement with your own API/local state
  const setActiveTemplate = async (templateId: string) => {
    toast.error('Set active template not implemented.');
  };

  // generateMemberCard: generate card for member
  const generateMemberCard = async (memberId: string, membershipId: string) => {
    setIsGeneratingCard(true);
    try {
      // Fetch member data
      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error || !member) {
        toast.error('Failed to fetch member data');
        return;
      }

      // Generate the card
      const pdfBlob = await generatePdfmeCard(member);
      
      // Download the card
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${membershipId}-card.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Card generated successfully!');
    } catch (error) {
      console.error('Card generation error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to generate card. Please ensure a template is saved.';
      toast.error(msg);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const stats = {
    total: members.length,
    pending: members.filter(m => m.status === 'pending').length,
    approved: members.filter(m => m.status === 'approved').length,
    rejected: members.filter(m => m.status === 'rejected').length,
  };

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Login form for unauthenticated users
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Logo className="mb-8" />
        
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Enter your credentials to access the admin dashboard
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12"
                style={{ backgroundColor: '#014f35', color: 'white' }}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo className="scale-75" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage MSL Pakistan</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setTemplateManagerOpen(true)}
              title="Manage WhatsApp Templates"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button style={{ backgroundColor: '#014f35', color: 'white' }} onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={() => setSettingsOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>WhatsApp Settings</DialogTitle>
            <DialogDescription>Control WhatsApp notifications and card sending</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Enable WhatsApp</div>
                <div className="text-xs text-muted-foreground">Toggle WhatsApp notifications</div>
              </div>
              <input type="checkbox" checked={settings.whatsapp_enabled} onChange={e => setSettings(prev => ({ ...prev, whatsapp_enabled: e.target.checked }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Enable Registration</div>
                <div className="text-xs text-muted-foreground">If disabled, new members cannot register</div>
              </div>
              <input type="checkbox" checked={settings.registration_enabled} onChange={e => setSettings(prev => ({ ...prev, registration_enabled: e.target.checked }))} />
            </div>
            {/* Note: Automatic card sending on approval removed — only notifications are sent */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Downloads per member per week</div>
                <div className="text-xs text-muted-foreground">Maximum number of times a member may download their card per week</div>
              </div>
              <input
                type="number"
                min={0}
                value={settings.downloads_per_week}
                onChange={e => setSettings(prev => ({ ...prev, downloads_per_week: parseInt(e.target.value || '0', 10) }))}
                className="w-20 text-right"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Cancel</Button>
              <Button onClick={saveSettings}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Template Manager Dialog */}
      <WhatsAppTemplateManager 
        isOpen={templateManagerOpen} 
        onClose={() => setTemplateManagerOpen(false)} 
      />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="members">Members</TabsTrigger>
            <Link to="/template-designer">
              <TabsTrigger value="designer">Template Designer</TabsTrigger>
            </Link>
          </TabsList>

          <TabsContent value="members">
                        {/* Bulk Actions */}
                        <div className="flex items-center gap-3 mb-4">
                          <Button
                            variant="outline"
                            disabled={selectedMemberIds.length === 0 || isUpdating}
                            onClick={() => bulkUpdateMemberStatus('approved')}
                          >
                            Bulk Approve
                          </Button>
                          <Button
                            variant="outline"
                            disabled={selectedMemberIds.length === 0 || isUpdating}
                            onClick={() => bulkUpdateMemberStatus('rejected')}
                          >
                            Bulk Reject
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {selectedMemberIds.length} selected
                          </span>
                        </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Total Members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.pending}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.approved}</p>
                      <p className="text-xs text-muted-foreground">Approved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <UserX className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.rejected}</p>
                      <p className="text-xs text-muted-foreground">Rejected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, ID, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button style={{ backgroundColor: '#014f35', color: 'white' }} onClick={fetchMembers} disabled={isLoading} className="h-12">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportToCSV} style={{ backgroundColor: '#014f35', color: 'white' }} className="h-12">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: '#014f35' }}>Members ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <input
                          type="checkbox"
                          checked={filteredMembers.length > 0 && selectedMemberIds.length === filteredMembers.length}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedMemberIds(filteredMembers.map(m => m.id));
                            } else {
                              setSelectedMemberIds([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Photo</TableHead>
                      <TableHead>Member ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Provincial Seat</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.includes(member.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedMemberIds([...selectedMemberIds, member.id]);
                              } else {
                                setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {member.profile_photo_url ? (
                            <img 
                              src={member.profile_photo_url} 
                              alt={member.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs font-medium text-muted-foreground">
                                {member.full_name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium" style={{ color: '#014f35' }}>{member.membership_id}</TableCell>
                        <TableCell>{member.full_name}</TableCell>
                        <TableCell>{member.whatsapp_number}</TableCell>
                        <TableCell>{member.district}</TableCell>
                        <TableCell>{member.provincial_seat ? member.provincial_seat : <span className="text-muted-foreground">Not set</span>}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[member.status]}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedMember(member)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              style={{ backgroundColor: '#014f35', color: 'white' }}
                              onClick={() => generateMemberCard(member.id, member.membership_id)}
                              disabled={isGeneratingCard}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {member.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => updateMemberStatus(member.id, 'approved')}
                                  disabled={isUpdating}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => updateMemberStatus(member.id, 'rejected')}
                                  disabled={isUpdating}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this member?')) {
                                  setIsUpdating(true);
                                  const { error } = await supabase
                                    .from('members')
                                    .delete()
                                    .eq('id', member.id);
                                  setIsUpdating(false);
                                  if (error) {
                                    toast.error('Failed to delete member');
                                    return;
                                  }
                                  toast.success('Member deleted successfully');
                                  fetchMembers();
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredMembers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No members found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

          </TabsContent>
        </Tabs>

        {/* Member Detail Dialog */}
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
              <DialogDescription>{selectedMember?.membership_id}</DialogDescription>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                  {selectedMember.profile_photo_url ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20">
                      <img 
                        src={selectedMember.profile_photo_url} 
                        alt={selectedMember.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{selectedMember.full_name}</h3>
                    <p className="text-muted-foreground">{selectedMember.designation}</p>
                    <Badge variant="outline" className={`mt-2 ${statusColors[selectedMember.status]}`}>
                      {selectedMember.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedMember.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    <p className="font-medium">{selectedMember.whatsapp_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">District</p>
                    <p className="font-medium">{selectedMember.district}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Provincial Seat</p>
                    <p className="font-medium">{selectedMember.provincial_seat ? selectedMember.provincial_seat : <span className="text-muted-foreground">Not set</span>}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Area of Interest</p>
                    <p className="font-medium">{areaLabels[selectedMember.area_of_interest]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Education Level</p>
                    <p className="font-medium">{educationLabels[selectedMember.education_level]}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Complete Address</p>
                  <p className="font-medium">{selectedMember.complete_address}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Degree & Institute</p>
                  <p className="font-medium">{selectedMember.degree_institute}</p>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  {selectedMember.status === 'approved' && (
                    <Button
                      variant="default"
                      onClick={() => generateMemberCard(selectedMember.id, selectedMember.membership_id)}
                      disabled={isGeneratingCard}
                      className="flex items-center gap-2"
                    >
                      {isGeneratingCard ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {isGeneratingCard ? 'Generating...' : 'Generate Card'}
                    </Button>
                  )}
                  <Select
                    value={selectedMember.status}
                    onValueChange={(value) => updateMemberStatus(selectedMember.id, value as MemberStatus)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setSelectedMember(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Template Configuration Dialog */}
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Configure Template: {selectedTemplate?.name}</DialogTitle>
              <DialogDescription>
                Drag and drop fields onto the PDF preview to position them
              </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
              <>
                {pdfDataUrl ? (
                  <div style={{ position: 'relative', width: '100%', minHeight: 600 }}>
                    {/* PDF Preview */}
                    {/* PDF preview and draggable field overlay removed for new designer system */}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 text-center text-red-600">
                    <div>
                      <p className="text-lg font-semibold mb-2">PDF preview unavailable</p>
                      <p className="text-sm">This template does not have valid PDF data. Please re-upload or check the template source.</p>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Admin;
