import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => Promise<void>;
  bucket?: string;
  folder?: string;
  className?: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
  label?: string;
  placeholder?: string;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

export default function ImageUpload({
  currentUrl,
  onUpload,
  bucket = 'images',
  folder,
  className,
  aspectRatio = 'square',
  label,
  placeholder = 'اضغط لرفع صورة',
  maxSizeMB = 1,
  maxWidthOrHeight = 1200,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const aspectClasses = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('يجب تحديد صورة للحفظ.');
      }

      const file = event.target.files[0];

      const options = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const fileExt = compressedFile.name.split('.').pop();
      const filePath = folder
        ? `${folder}/${user?.id}/${Date.now()}.${fileExt}`
        : `${user?.id}/${Date.now()}.${fileExt}`;

      if (!isSupabaseConfigured) {
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
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
          {label}
        </label>
      )}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-colors',
          aspectClasses[aspectRatio],
          currentUrl
            ? 'border-transparent'
            : 'border-slate-300 hover:border-brand-400 bg-slate-50 hover:bg-slate-100'
        )}
      >
        {currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt="Uploaded"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-white/90 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold">
                <Camera className="w-4 h-4" />
                تغيير الصورة
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
            )}
            <span className="text-sm font-bold text-slate-600">{uploading ? 'جاري الرفع...' : placeholder}</span>
            <span className="text-xs text-slate-400 mt-1">JPG, PNG — أقصى حجم 5MB</span>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
