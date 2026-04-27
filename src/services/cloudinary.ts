/**
 * Cloudinary Upload Service
 * Allows uploading images to Cloudinary without requiring a backend by using "Unsigned Uploads".
 * 
 * To use this:
 * 1. Create a Cloudinary account.
 * 2. Go to Settings -> Upload -> Upload Presets.
 * 3. Create a new "Unsigned" upload preset.
 * 4. Use your Cloud Name and Preset Name here.
 */

// Replace these with your actual Cloudinary credentials
// You can move these to a .env file or a config file later
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name'; 
const CLOUDINARY_UPLOAD_PRESET = 'your_unsigned_preset';

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  [key: string]: any;
}

/**
 * Uploads a local image URI to Cloudinary.
 * @param uri The local file URI from image-picker
 * @returns The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (uri: string): Promise<string> => {
  try {
    const data = new FormData();
    
    // In React Native, we need to format the file object for FormData
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    data.append('file', {
      uri,
      name: `upload.${fileType}`,
      type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
    } as any);
    
    data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    data.append('cloud_name', CLOUDINARY_CLOUD_NAME);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const result: CloudinaryResponse = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message || 'Upload to Cloudinary failed');
    }

    return result.secure_url;
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};

/**
 * Uploads multiple images.
 */
export const uploadMultipleToCloudinary = async (uris: string[]): Promise<string[]> => {
  const uploadPromises = uris.map(uri => uploadToCloudinary(uri));
  return Promise.all(uploadPromises);
};
