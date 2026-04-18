import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
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
import { Loader2, Download, CreditCard, User, Phone, MapPin, Building, ArrowLeft, Search } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { generatePdfmeCard } from '@/lib/generatePdfmeCard';

type Member = Database['public']['Tables']['members']['Row'];

const formSchema = z.object({
  identifier: z.string().min(1, 'Please enter your Membership ID or WhatsApp number'),
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

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  inactive: 'bg-gray-100 text-gray-800',
};

const buildWhatsAppSearchVariants = (value: string): string[] => {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, '');
  const variants = new Set<string>();

  if (raw) variants.add(raw);
  if (digits) variants.add(digits);

  if (digits.startsWith('0') && digits.length > 1) {
    const localPart = digits.slice(1);
    variants.add(`92${localPart}`);
    variants.add(`+92${localPart}`);
    variants.add(`0092${localPart}`);
  }

  if (digits.startsWith('92') && digits.length > 2) {
    const localPart = digits.slice(2);
    variants.add(`0${localPart}`);
    variants.add(`+${digits}`);
    variants.add(`0092${localPart}`);
  }

  if (digits.startsWith('0092') && digits.length > 4) {
    const localPart = digits.slice(4);
    variants.add(`0${localPart}`);
    variants.add(`92${localPart}`);
    variants.add(`+92${localPart}`);
  }

  return Array.from(variants);
};

const GenerateCard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [mode, setMode] = useState<'whatsapp' | 'membership'>('whatsapp');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setMember(null);
    try {
      const identifier = values.identifier.trim();

      if (mode === 'membership') {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('membership_id', identifier)
          .maybeSingle();

        if (error) {
          toast.error('Something went wrong. Please try again.');
          console.error('Fetch error:', error);
          return;
        }

        if (!data) {
          toast.error('No member found with this ID or WhatsApp number');
          return;
        }

        setMember(data);
        toast.success('Member found!');
      } else {
        const variants = buildWhatsAppSearchVariants(identifier);

        const { data: exactData, error: exactError } = await supabase
          .from('members')
          .select('*')
          .in('whatsapp_number', variants)
          .limit(1)
          .maybeSingle();

        if (exactError) {
          toast.error('Something went wrong. Please try again.');
          console.error('Fetch error:', exactError);
          return;
        }

        if (exactData) {
          setMember(exactData);
          toast.success('Member found!');
          return;
        }

        const digits = identifier.replace(/\D/g, '');
        const tail = digits.length >= 10 ? digits.slice(-10) : digits;

        if (tail) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('members')
            .select('*')
            .ilike('whatsapp_number', `%${tail}%`)
            .limit(1)
            .maybeSingle();

          if (fallbackError) {
            toast.error('Something went wrong. Please try again.');
            console.error('Fetch error:', fallbackError);
            return;
          }

          if (fallbackData) {
            setMember(fallbackData);
            toast.success('Member found!');
            return;
          }
        }

        toast.error('No member found with this ID or WhatsApp number');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Track last download timestamp (simulate with localStorage for demo, should be in DB for production)
  const getLastDownload = () => {
    return localStorage.getItem(`lastDownload_${member?.membership_id}`);
  };
  const setLastDownload = () => {
    localStorage.setItem(`lastDownload_${member?.membership_id}`, Date.now().toString());
  };

  // Simulate user role (should be fetched from user_roles table in production)
  // For now, default to 'user'.
  const userRole: 'user' | 'admin' = 'user'; // Replace with actual role fetch if available

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const sendOtp = async () => {
    if (!member) return;
    setIsSendingOtp(true);
    const language = 'en'; // You can make this configurable
    try {
      // Check server-side download allowance before sending OTP
      const API_URL = import.meta.env.VITE_API_URL || '/';
      try {
        const checkResp = await fetch(`${API_URL}/whatsapp/check-download-allowed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ membership_id: member.membership_id })
        });
        const checkJson = await checkResp.json();
        if (checkJson && checkJson.allowed === false) {
          toast.error(`Download limit reached (${checkJson.downloadsThisWeek}/${checkJson.limit})`);
          setIsSendingOtp(false);
          return;
        }
      } catch (e) {
        console.warn('Failed to check server download limit', e);
        // allow fallback to continue OTP send
      }
      const resp = await fetch(`${API_URL.replace(/\/$/, '')}/whatsapp/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: member.whatsapp_number, language })
      });
      const json = await resp.json();
      if (json?.success) {
        setOtpSent(true);
        setOtpModalOpen(true);
        console.log('📱 OTP sent. Template:', json?.template);
        toast.success('OTP sent to your WhatsApp number');

        // Background-check delivery status to surface WhatsApp failures quickly.
        if (json?.messageId) {
          const baseUrl = API_URL.replace(/\/$/, '');
          void (async () => {
            for (let attempt = 0; attempt < 6; attempt++) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              try {
                const statusResp = await fetch(`${baseUrl}/whatsapp/message-status/${json.messageId}`);
                if (!statusResp.ok) continue;
                const statusJson = await statusResp.json();
                const status = statusJson?.status?.status;
                if (status === 'failed') {
                  const errors = statusJson?.status?.errors || [];
                  const firstErr = errors[0] || {};
                  const errText = firstErr?.title || firstErr?.message || 'WhatsApp could not deliver OTP';
                  toast.error(`OTP delivery failed: ${errText}`);
                  break;
                }
                if (status === 'delivered' || status === 'read') {
                  break;
                }
              } catch {
                // Ignore transient polling errors
              }
            }
          })();
        }
      } else {
        console.error('sendOtp failed', json);
        toast.error('Failed to send OTP. Please try again later.');
      }
    } catch (e) {
      console.error('sendOtp error', e);
      toast.error('Failed to send OTP. Please try again later.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!member) return;
    setIsVerifyingOtp(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/';
      const resp = await fetch(`${API_URL.replace(/\/$/, '')}/whatsapp/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: member.whatsapp_number, code: otpCode })
      });
      const json = await resp.json();
      if (json?.success) {
        setOtpModalOpen(false);
        setOtpCode('');
        // proceed to generate and download
        await doGenerateAndDownload();
        if (String(userRole) !== 'admin') setLastDownload();
      } else {
        console.error('verifyOtp failed', json);
        toast.error(json?.error || 'Invalid OTP');
      }
    } catch (e) {
      console.error('verifyOtp error', e);
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const doGenerateAndDownload = async () => {
    if (!member) return;
    setIsGenerating(true);
    try {
      const pdfBlob = await generatePdfmeCard(member, member.core_team ? 'core-team' : 'standard');
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${member.membership_id}-card.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Membership card downloaded successfully!');
      // Record download on server for enforcement
      try {
        const API_URL = import.meta.env.VITE_API_URL || '/';
        await fetch(`${API_URL}whatsapp/record-download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ membership_id: member.membership_id })
        });
      } catch (e) {
        console.warn('Failed to record download on server', e);
      }
    } catch (error) {
      console.error('Card generation error:', error);
      toast.error('Failed to generate card. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCard = async () => {
    if (!member) return;
    if (member.status !== 'approved') {
      toast.error('Your membership must be approved before downloading the card');
      return;
    }
    if (!member.profile_photo_url) {
      toast.error('No profile photo found. Please contact support.');
      return;
    }
    // Restrict download to once per week for members
    if (String(userRole) !== 'admin') {
      const lastDownload = getLastDownload();
      if (lastDownload) {
        const last = parseInt(lastDownload, 10);
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (now - last < oneWeek) {
          toast.error('You can only download your card once per week.');
          return;
        }
      }
    }

    // If not admin, require OTP verification before generating
    if (String(userRole) !== 'admin') {
      await sendOtp();
      return;
    }

    // Admins can generate directly
    await doGenerateAndDownload();
    if (String(userRole) !== 'admin') setLastDownload();
  };

  return (
    <div className="msl-page-bg flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-2xl">
        <div className="msl-panel flex flex-col items-center p-4 md:p-6">
          <Logo className="mb-6" />
          
          <Button 
            className="mb-4 bg-gradient-to-r from-[#014f35] to-[#1a7d52] text-white hover:shadow-lg border-0 shadow-md font-semibold transition-all duration-200"
            onClick={() => window.location.href = '/'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Join Page
          </Button>
          
          <div className="w-full mb-6 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-[#014f35] to-[#1a7d52] text-white text-xs font-medium uppercase tracking-wider mb-3 shadow-lg">
              <CreditCard className="inline h-3 w-3 mr-1" />
              Membership Card
            </span>
            <h1 className="text-2xl md:text-4xl font-bold text-[#014f35]">
              Download Your Card
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Enter your Membership ID or WhatsApp number to download your card
            </p>
          </div>
          
          <Card className="w-full mb-6 msl-form-shell p-1 border-0 shadow-sm">
            <CardContent className="pt-6 bg-white rounded-xl">
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
                              placeholder={mode === 'whatsapp' ? 'e.g. 0319822245' : 'e.g. MSL2026-01'}
                              {...field}
                              className="h-12 text-base msl-input"
                              inputMode={mode === 'whatsapp' ? 'tel' : 'text'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {mode === 'whatsapp'
                        ? 'Enter your registered WhatsApp number (e.g. 0319822245)'
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

          <div className="w-full text-center mt-3 mb-6">
            <p className="text-xs text-gray-600 mb-2">If you face any error, contact us on WhatsApp.</p>
            <a
              href="https://wa.me/923298876069"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-[#014f35] px-4 py-2 text-xs font-medium text-white hover:bg-[#013d29] transition-colors"
            >
              Contact on Whatsapp
            </a>
          </div>

          {member && (
            <Card className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300 msl-form-shell p-1 border-0 shadow-sm">
              <div className="bg-white rounded-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-[#014f35]">Member Details</CardTitle>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[member.status]}`}>
                      {member.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Full Name</p>
                      <p className="font-medium">{member.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Membership ID</p>
                      <p className="font-medium">{member.membership_id}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                      <p className="font-medium">{member.whatsapp_number}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Designation</p>
                      <p className="font-medium">{member.designation}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">District</p>
                      <p className="font-medium">{member.district}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Area of Interest</p>
                      <p className="font-medium">{areaLabels[member.area_of_interest]}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <Button
                    className="w-full h-12 bg-[#abd8c9] text-[#014f35] hover:bg-[#8fcab3] font-semibold rounded-lg border-none"
                    onClick={handleDownloadCard}
                    disabled={member.status !== 'approved' || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Card...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {member.status === 'approved' 
                          ? 'Download Membership Card' 
                          : 'Card available after approval'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
              </div>
            </Card>
          )}
        </div>
      </main>
      
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
          <div className="msl-form-shell rounded-2xl p-1 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-[#014f35] mb-2">Enter OTP</h3>
              <p className="text-sm md:text-base text-gray-600 mb-6">We've sent an OTP to <span className="font-semibold">{member?.whatsapp_number}</span>. Enter it below to verify and download your card.</p>
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                inputMode="numeric"
                className="w-full p-3 md:p-4 border-2 border-[#99b6aa] rounded-lg mb-6 text-lg font-semibold text-center focus:outline-none focus:border-[#014f35] transition-colors"
              />
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <Button 
                  onClick={verifyOtp} 
                  disabled={isVerifyingOtp || !otpCode}
                  className="flex-1 bg-gradient-to-r from-[#014f35] to-[#1a7d52] text-white hover:shadow-lg border-0 font-semibold py-2 md:py-3 rounded-lg transition-all duration-200"
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify & Download'}
                </Button>
                <Button 
                  onClick={() => { setOtpModalOpen(false); setOtpCode(''); }}
                  className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 border-0 font-semibold py-2 md:py-3 rounded-lg transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
              <Button 
                onClick={sendOtp} 
                disabled={isSendingOtp}
                className="w-full mt-3 bg-transparent text-[#014f35] hover:bg-gray-100 border border-[#014f35] font-semibold py-2 md:py-3 rounded-lg transition-all duration-200"
              >
                {isSendingOtp ? 'Resending...' : 'Resend OTP'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GenerateCard;
