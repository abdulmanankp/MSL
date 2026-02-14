import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProfilePhotoUploadProps {
  onPhotoUploaded: (url: string) => void;
  currentPhotoUrl?: string;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  onPhotoUploaded,
  currentPhotoUrl,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      let fileToUpload = file;
      // Only compress if file is larger than 250KB
      if (file.size > 250 * 1024) {
        const options = {
          maxSizeMB: 0.25,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };
        fileToUpload = await imageCompression(file, options);
        if (fileToUpload.size > 250 * 1024) {
          toast.error('Image must be less than 250KB after compression');
          setIsUploading(false);
          return;
        }
      }
      // Always preserve the original extension
      const ext = file.name.split('.').pop();
      const newFile = new File([fileToUpload], `photo.${ext}`, { type: fileToUpload.type });
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      // Upload directly to backend for local storage
      const formData = new FormData();
      formData.append('photo', newFile);
      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url: uploadedUrl } = await uploadRes.json();
      setPhotoUrl(uploadedUrl);
      onPhotoUploaded(uploadedUrl);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    onPhotoUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className="h-24 w-24 border-2 border-border">
          {photoUrl ? (
            <AvatarImage src={photoUrl} alt="Profile photo" className="object-cover" />
          ) : (
            <AvatarFallback className="bg-muted">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          )}
        </Avatar>
        {photoUrl && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.heic,image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="profile-photo-input"
      />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Camera className="h-4 w-4 mr-2" />
            {photoUrl ? 'Change Photo' : 'Upload Photo'}
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => window.open('https://image.pi7.org/compress-image-to-200kb', '_blank')}
        className="mt-2"
      >
        Compress Image Online
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Upload a passport-size photo (max 250KB, will be compressed automatically)
      </p>
    </div>
  );
};

export default ProfilePhotoUpload;
