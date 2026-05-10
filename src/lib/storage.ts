import { supabase } from './supabase';

export const uploadImage = async (file: File, bucket: 'products' | 'logos' | 'banners') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Direct upload to bucket (since we confirmed bucket names are 'products' and 'logos')
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) {
    console.error(`Upload to ${bucket} failed:`, error);
    // If we get an RLS error, it's because the 'anon' key is not allowed to upload
    // The user may need to enable 'public' inserts in Supabase Storage policies
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
};
