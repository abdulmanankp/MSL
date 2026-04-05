import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TablesInsert } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
// ...existing code...
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';

import ppData from '@/../pp.json';

const ISLAMABAD_SEATS = ['NA-46', 'NA-47', 'NA-48'];
const FULL_NAME_MAX_LENGTH = 18;
const DESIGNATION_MAX_LENGTH = 36;

const createNameSuggestions = (value: string) => {
  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (!cleaned) return [];

  const suggestions = new Set<string>();
  const truncated = cleaned.slice(0, FULL_NAME_MAX_LENGTH).trimEnd();
  if (truncated) suggestions.add(truncated);

  const parts = cleaned.split(' ');
  if (parts.length > 1) {
    const shortened = `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`.trim();
    if (shortened.length <= FULL_NAME_MAX_LENGTH) {
      suggestions.add(shortened);
    }
  }

  return Array.from(suggestions).filter((suggestion) => suggestion.length <= FULL_NAME_MAX_LENGTH);
};

const createDesignationSuggestions = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) return [];

  const suggestions = new Set<string>();
  const isFullOrgName = /muslim student league pakistan/i.test(normalized);

  if (isFullOrgName) {
    suggestions.add('MSL Pakistan');
    suggestions.add('MSL');
  }

  const truncated = normalized.slice(0, DESIGNATION_MAX_LENGTH).trimEnd();
  if (truncated) suggestions.add(truncated);

  return Array.from(suggestions).filter((suggestion) => suggestion.length <= DESIGNATION_MAX_LENGTH);
};

const formSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(FULL_NAME_MAX_LENGTH, `Full name must be at most ${FULL_NAME_MAX_LENGTH} characters`),
  email: z.string().email('Please enter a valid email address').max(255),
  whatsapp_number: z
    .string()
    .min(10, 'WhatsApp number must be at least 10 digits')
    .max(15)
    .regex(/^[\d+\-\s]+$/, 'Please enter a valid phone number'),
  designation: z.string().min(2, 'Designation is required').max(DESIGNATION_MAX_LENGTH, `Designation must be at most ${DESIGNATION_MAX_LENGTH} characters`),
  district: z.string().min(1, 'Please select a district'),
  provincial_seat: z.string().min(1, 'Please select a provincial seat'),
  complete_address: z.string().min(10, 'Please enter your complete address').max(500),
  area_of_interest: z.enum(['msl_team','muslim_kids', 'media_department', 'madadgar_team', 'universities_department', 'it_department']),
  education_level: z.enum(['hafiz_quran', 'matric', 'inter', 'bs', 'masters', 'phd']),
  degree_institute: z.string().min(5, 'Please enter your degree and institute name').max(500),
});

type FormValues = z.infer<typeof formSchema>;

const areaOfInterestOptions = [
  { value: 'muslim_kids', label: 'Muslim Kids' },
  { value: 'media_department', label: 'Media Department' },
  { value: 'madadgar_team', label: 'Madadgar Team' },
  { value: 'universities_department', label: 'Universities Department' },
  { value: 'msl_team', label: 'MSL Team' },
  { value: 'it_department', label: 'IT Department' },
];

const educationLevelOptions = [
  { value: 'hafiz_quran', label: 'Hafiz e Quran' },
  { value: 'matric', label: 'Matric' },
  { value: 'inter', label: 'Inter' },
  { value: 'bs', label: 'BS' },
  { value: 'masters', label: 'Masters' },
  { value: 'phd', label: 'PHD' },
];

const JoinUsForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      whatsapp_number: '',
      designation: '',
      district: '',
      complete_address: '',
      area_of_interest: undefined,
      education_level: undefined,
      degree_institute: '',
    },
  });

  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  React.useEffect(() => {
    // Fetch registration_enabled from backend
    fetch(`${API_URL}/admin/settings`)
      .then(res => res.json())
      .then(json => {
        if (json?.success && typeof json.settings?.registration_enabled === 'boolean') {
          setRegistrationEnabled(json.settings.registration_enabled);
        }
      })
      .catch(() => setRegistrationEnabled(true));
  }, [API_URL]);

  const onSubmit = async (values: FormValues) => {
    if (!profilePhotoUrl) {
      toast.error('Profile photo is required. Please upload your image before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      // membership_id is auto-generated by database trigger
      const insertData: TablesInsert<'members'> = {
        full_name: values.full_name,
        email: values.email,
        whatsapp_number: values.whatsapp_number,
        designation: values.designation,
        district: values.district,
        provincial_seat: values.provincial_seat,
        complete_address: values.complete_address,
        area_of_interest: values.area_of_interest,
        education_level: values.education_level,
        degree_institute: values.degree_institute,
        membership_id: 'temp', // Will be replaced by database trigger
        profile_photo_url: profilePhotoUrl || null,
      };
      
      const { data, error } = await supabase
        .from('members')
        .insert([insertData])
        .select('membership_id, full_name, email')
        .single();

      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('whatsapp_number')) {
            toast.error('This WhatsApp number is already registered');
          } else {
            toast.error('This email or phone number is already registered');
          }
        } else {
          toast.error('Something went wrong. Please try again.');
          console.error('Submission error:', error);
        }
        return;
      }

      setMembershipId(data.membership_id);
      setIsSuccess(true);
      toast.success('Registration successful!');

      // Send email to admin on new registration
      fetch(`${API_URL}/send-registration-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@mslpakistan.org',
          membership_id: data.membership_id,
          full_name: data.full_name || values.full_name,
          whatsapp_number: values.whatsapp_number,
          designation: values.designation,
          district: values.district,
          provincial_seat: values.provincial_seat,
          complete_address: values.complete_address,
          area_of_interest: values.area_of_interest,
          education_level: values.education_level,
          degree_institute: values.degree_institute,
          profile_photo_url: profilePhotoUrl || null,
          email_of_member: values.email
        })
      });

      // Send WhatsApp notification on new registration
      fetch(`${API_URL}/whatsapp/send-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: values.whatsapp_number,
          first_name: data.full_name || values.full_name,
          membership_id: data.membership_id
        })
      });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!registrationEnabled) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12 px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Registration Closed</h2>
        <p className="text-muted-foreground mb-6">
          New member registration is currently disabled by the admin. Please check back later.
        </p>
      </div>
    );
  }

  if (isSuccess && membershipId) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12 px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Registration Successful!</h2>
        <p className="text-muted-foreground mb-6">
          Your membership application has been submitted successfully.
        </p>
        <div className="bg-muted rounded-lg p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-2">Your Membership ID</p>
          <p className="text-2xl font-bold text-primary">{membershipId}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Please save this ID for future reference. You can use it to download your membership card
          once your application is approved.
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => {
            setIsSuccess(false);
            setMembershipId(null);
            form.reset();
          }}
        >
          Register Another Member
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Full Name*" {...field} className="h-12 msl-input" />
                </FormControl>
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{field.value?.length || 0}/{FULL_NAME_MAX_LENGTH}</span>
                  {field.value && field.value.length > FULL_NAME_MAX_LENGTH && (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {createNameSuggestions(field.value).map((suggestion) => (
                        <Button
                          key={suggestion}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-full border-[#99b6aa] bg-white px-3 text-xs text-[#014f35] hover:bg-[#eaf4f0]"
                          onClick={() => form.setValue('full_name', suggestion, { shouldValidate: true, shouldDirty: true })}
                        >
                          Use “{suggestion}”
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="email" placeholder="Email*" {...field} className="h-12 msl-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whatsapp_number"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="WhatsApp Number*" {...field} className="h-12 msl-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="designation"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Designation (Coordinator, Volunteer, Member)*"
                    {...field}
                    className="h-12 msl-input"
                  />
                </FormControl>
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{field.value?.length || 0}/{DESIGNATION_MAX_LENGTH}</span>
                  {(field.value?.length || 0) > DESIGNATION_MAX_LENGTH || /muslim student league pakistan/i.test(field.value || '') ? (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {createDesignationSuggestions(field.value).map((suggestion) => (
                        <Button
                          key={suggestion}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-full border-[#99b6aa] bg-white px-3 text-xs text-[#014f35] hover:bg-[#eaf4f0]"
                          onClick={() => form.setValue('designation', suggestion, { shouldValidate: true, shouldDirty: true })}
                        >
                          Use “{suggestion}”
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="district"
            render={({ field }) => {
              // Get all district names from pp.json keys
              const districtList = [
                'Islamabad',
                ...Object.keys(ppData.Pakistan_Provincial_Seats || {}).filter((district) => district !== 'Islamabad'),
              ];
              return (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 msl-select">
                        <SelectValue placeholder="Select District*" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px] bg-white z-50 border-[#99b6aa]">
                      {districtList.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Provincial Seat Dropdown, shown after district selection */}
          <FormField
            control={form.control}
            name="provincial_seat"
            render={({ field }) => {
              // Only show seats if available for the selected district
              const selectedDistrict = form.watch('district');
              const seats = selectedDistrict === 'Islamabad'
                ? ISLAMABAD_SEATS
                : selectedDistrict
                  ? (ppData.Pakistan_Provincial_Seats[selectedDistrict] || [])
                  : [];
              // Hide if no seats for this district
              if (!selectedDistrict || seats.length === 0) return null;
              return (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDistrict}>
                    <FormControl>
                      <SelectTrigger className="h-12 msl-select">
                        <SelectValue placeholder={selectedDistrict ? `Select Provincial Seat [${seats.join(', ')}]` : 'Select District First'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px] bg-white z-50 border-[#99b6aa]">
                      {seats.map((seat) => (
                        <SelectItem key={seat} value={seat}>
                          {seat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="complete_address"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Enter Your Complete Address*" {...field} className="h-12 msl-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area_of_interest"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 msl-select">
                      <SelectValue placeholder="Choose Area of Interest*" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white z-50 border-[#99b6aa]">
                    {areaOfInterestOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="education_level"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 msl-select">
                      <SelectValue placeholder="Select Education Level*" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white z-50 border-[#99b6aa]">
                    {educationLevelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="degree_institute"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Enter Your Degree and Institute Name*"
                    {...field}
                    className="min-h-[100px] resize-none msl-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Profile Photo Upload - After Degree */}
          <div className="pt-4 border-t border-border">
            <p className="mb-3 text-sm font-medium text-[#014f35]">
              Profile Photo <span className="text-red-600">*</span>
            </p>
            <ProfilePhotoUpload
              onPhotoUploaded={setProfilePhotoUrl}
              currentPhotoUrl={profilePhotoUrl}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 md:h-14 text-base font-semibold rounded-xl bg-[#014f35] text-white hover:bg-[#013d29] shadow-[0_8px_20px_rgba(1,79,53,0.22)] hover:shadow-[0_10px_24px_rgba(1,79,53,0.3)] transition-all duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Become Member'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default JoinUsForm;
