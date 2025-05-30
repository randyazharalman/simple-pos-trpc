import { Bucket } from "@/server/bucket";
import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
type uploadFileToSignedUrlType = {
  file: File;
  path: string;
  token: string;
  bucket: Bucket
}
export const  uploadFileToSignedUrl = async ({
  file,
  path,
  token,
  bucket
}: uploadFileToSignedUrlType ) => {
  try {
    const {data, error} = await supabaseClient.storage
    .from(Bucket.ProductImages)
    .uploadToSignedUrl(path, token, file);

    if(error) throw error;

    if(!data) throw new Error("No data returned from uploadToSignedUrl");

    const fileUrl = supabaseClient.storage.from(bucket).getPublicUrl(data?.path)

    return fileUrl.data.publicUrl;
  } catch (error) {
    throw error;
  }
}