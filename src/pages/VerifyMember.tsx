import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ShieldCheck, ShieldX, Search, Download } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Member = Database['public']['Tables']['members']['Row'];

const formSchema = z.object({
  identifier: z.string().min(1, 'Please enter a Membership ID or WhatsApp number'),
});

type FormValues = z.infer<typeof formSchema>;

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
  msl_team: 'MSL Team',
  it_department: 'IT Department',
};

const VerifyMember: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [mode, setMode] = useState<'whatsapp' | 'membership'>('whatsapp');
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: '',
    },
  });

  const searchMember = async (identifier: string) => {
    setIsLoading(true);
    setMember(null);
    setNotFound(false);
    setHasSearched(true);
    
    try {
      let query = supabase.from('members').select('*');
      
      if (identifier.startsWith('MSL')) {
        query = query.eq('membership_id', identifier);
      } else {
        query = query.eq('whatsapp_number', identifier);
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) {
        toast.error('Something went wrong. Please try again.');
        console.error('Fetch error:', error);
        return;
      }

      if (!data) {
        setNotFound(true);
        return;
      }

      setMember(data);
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle QR code scans with membership ID in URL
  useEffect(() => {
    const memberId = searchParams.get('id');
    if (memberId) {
      form.setValue('identifier', memberId);
      searchMember(memberId);
    }
  }, [searchParams, form]);

  const onSubmit = async (values: FormValues) => {
    const value = values.identifier.trim();
    if (mode === 'whatsapp') {
      // Optionally add validation for WhatsApp number format
    } else {
      // Optionally add validation for Membership ID format
    }
    await searchMember(value);
  };

  const downloadCard = async () => {
    if (!member) return;

    setIsDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-card', {
        body: { memberId: member.id }
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${member.membership_id}_card.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Card downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download card. Please try again.');
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Full-width header bar */}
      <div className="w-full bg-[#014f35] flex items-center justify-between px-4 py-2" style={{position: 'relative', left: 0, right: 0, top: 0}}>
        <span className="text-white text-sm font-medium">Visit our official website</span>
        <a
          href="https://mslpakistan.com" target="_blank" rel="noopener noreferrer"
          className="px-4 py-1.5 rounded-full bg-white text-[#014f35] font-semibold text-xs shadow hover:bg-[#abd8c9] transition-colors duration-150"
        >
          Visit MSL Official Website
        </a>
      </div>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex flex-col items-center">
          <Logo className="mb-6" />
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => window.location.href = '/'}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Back to Join Page
          </Button>
          
          <div className="w-full mb-6 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium uppercase tracking-wider mb-3">
              <ShieldCheck className="inline h-3 w-3 mr-1" />
              Verification
            </span>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#014f35' }}>
              Verify Membership
            </h1>
            <p className="text-muted-foreground mt-2">
              Enter a Membership ID or WhatsApp number to verify
            </p>
          </div>
          
          <Card className="w-full mb-6">
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Animated tab selector */}
                  <div className="relative flex mb-2 bg-muted rounded-lg overflow-hidden border border-border h-12">
                    {/* Animated background */}
                    <span
                      className="absolute top-0 left-0 h-full w-1/2 transition-transform duration-300 ease-in-out rounded-lg bg-white shadow"
                      style={{
                        transform: mode === 'whatsapp' ? 'translateX(0%)' : 'translateX(100%)',
                        boxShadow: '0 2px 8px 0 rgba(1,79,53,0.08)',
                        zIndex: 1,
                      }}
                    />
                    <button
                      type="button"
                      className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 text-base font-medium transition-colors duration-150 relative z-10 ${mode === 'whatsapp' ? 'text-[#014f35]' : 'text-muted-foreground hover:bg-accent'}`}
                      style={{ borderRight: '1px solid #e5e7eb' }}
                      onClick={() => setMode('whatsapp')}
                    >
                      <span className="inline-flex items-center gap-1"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.205 5.077 4.372.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg> WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 text-base font-medium transition-colors duration-150 relative z-10 ${mode === 'membership' ? 'text-[#014f35]' : 'text-muted-foreground hover:bg-accent'}`}
                      onClick={() => setMode('membership')}
                    >
                      <span className="inline-flex items-center gap-1"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a4 4 0 1 1 8 0v2" /></svg> Member ID</span>
                    </button>
                  </div>
                  {/* Input field and label */}
                  <div>
                    <label className="block text-base font-semibold mb-1 text-foreground">
                      {mode === 'whatsapp' ? 'WhatsApp Number' : 'Membership ID'}
                    </label>
                    <FormField
                      control={form.control}
                      name="identifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder={mode === 'whatsapp' ? 'e.g. 03176227245' : 'e.g. MSL2026-01'}
                              {...field}
                              className="h-12 text-base"
                              inputMode={mode === 'whatsapp' ? 'tel' : 'text'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {mode === 'whatsapp'
                        ? 'Enter your registered WhatsApp number starting with 031762'
                        : 'Enter your Membership ID (e.g. MSL2026-01)'}
                    </p>
                  </div>
                  {/* Button */}
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-lg bg-[#014f35] hover:bg-[#013d29] text-white text-base font-semibold flex items-center justify-center transition-colors duration-150 mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Verify Membership
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {hasSearched && notFound && (
            <Card className="w-full border-destructive/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <ShieldX className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Member Not Found
                  </h3>
                  <p className="text-muted-foreground">
                    This member is not registered or the information provided is incorrect.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {member && (
            <Card className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Verified Member</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      member.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : member.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.status}
                    </span>
                    {member.status === 'approved' && (
                      <Button
                        size="sm"
                        onClick={downloadCard}
                        disabled={isDownloading}
                        className="flex items-center gap-2 bg-[#abd8c9] text-[#014f35] hover:bg-[#8fcab3] font-semibold rounded-lg border-none"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {isDownloading ? 'Generating...' : 'Download Card'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground w-1/3">Full Name</TableCell>
                      <TableCell>{member.full_name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Membership ID</TableCell>
                      <TableCell className="font-mono">{member.membership_id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Designation</TableCell>
                      <TableCell>{member.designation}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">District</TableCell>
                      <TableCell>{member.district}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Provincial Seat</TableCell>
                      <TableCell>{member.provincial_seat ? member.provincial_seat : <span className="text-muted-foreground">Not set</span>}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Area of Interest</TableCell>
                      <TableCell>{areaLabels[member.area_of_interest]}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Education Level</TableCell>
                      <TableCell>{educationLabels[member.education_level]}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Member Since</TableCell>
                      <TableCell>{new Date(member.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default VerifyMember;
