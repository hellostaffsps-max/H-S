import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => Promise<void>;
  bucket?: string;
  className?: string;
  fallbackInitial?: string;
}

export default function AvatarUpload({ 
  currentUrl, 
  onUpload, 
  bucket = 'avatars', 
  className,
  fallbackInitial = 'U'
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('يجب تحديد صورة للحفظ.');
      }

      const file = event.target.files[0];

      // Compress the image
      const options = {
        maxSizeMB: 0.5, // 500KB Max
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      
      const fileExt = compressedFile.name.split('.').pop();
      const filePath = `${user?.id}/${Date.now()}.${fileExt}`;

      if (!isSupabaseConfigured) {
        // Mock upload for UI preview
        setTimeout(() => {
          onUpload(URL.createObjectURL(compressedFile));
          setUploading(false);
        }, 1000);
        return;
      }

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile);

      if (uploadError) {
        throw uploadError;
      }

      if (data) {
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
        await onUpload(publicUrl);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("relative group", className)}>
      <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-4xl font-bold text-brand-700 shadow-sm border-4 border-white overflow-hidden shrink-0">
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="uppercase">{fallbackInitial}</span>
        )}
      </div>
      
      <button 
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="absolute bottom-0 right-0 p-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-slate-600 hover:text-brand-600 hover:border-brand-200 transition-colors z-10"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
      </button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
      />
      {error && <p className="absolute -bottom-6 text-xs text-red-500 whitespace-nowrap">{error}</p>}
    </div>
  );
}
