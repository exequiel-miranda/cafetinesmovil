import * as ImagePicker from 'expo-image-picker';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Escoge una imagen de la galería.
 */
export async function pickImageFromGallery() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Se requiere permiso para acceder a la galería');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled) {
    return result.assets[0].uri;
  }
  return null;
}

/**
 * Toma una foto con la cámara.
 */
export async function takePhoto() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Se requiere permiso para acceder a la cámara');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled) {
    return result.assets[0].uri;
  }
  return null;
}

/**
 * Sube la imagen a Cloudinary directamente desde React Native
 * @param uri URI local del archivo, devuelto por ImagePicker
 * @returns La URL de la imagen en formato seguro HTTPS
 */
export async function uploadImageToCloudinary(uri: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Faltan variables de entorno para Cloudinary (CLOUD_NAME o UPLOAD_PRESET)');
  }

  // Prepara los FormData para la subida
  const data = new FormData();
  
  // Extrae el nombre del archivo y el tipo mime
  const filename = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  data.append('file', {
    uri,
    name: filename,
    type,
  } as any);
  
  data.append('upload_preset', UPLOAD_PRESET);
  
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: data,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    const json = await res.json();
    if (json.secure_url) {
      return json.secure_url;
    } else {
      throw new Error(json.error?.message || 'Error desconocido de Cloudinary');
    }
  } catch (err: any) {
    console.error('Error subiendo imagen:', err.message);
    throw err;
  }
}
