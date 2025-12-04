import { supabase } from './client';

export async function uploadSnapshot(
  examId: string,
  sessionId: string,
  sequenceNumber: number,
  eventCode: string,
  frameData: string
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const path = `snapshots/${examId}/${sessionId}/${year}/${month}/${day}/${sequenceNumber}-${eventCode}.jpg`;
  
  // Convert base64 to blob
  const base64Data = frameData.replace(/^data:image\/\w+;base64,/, '');
  const blob = base64ToBlob(base64Data, 'image/jpeg');
  
  const { data, error } = await supabase.storage
    .from('snapshots')
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });
  
  if (error) {
    console.error('Error uploading snapshot:', error);
    throw error;
  }
  
  return data.path;
}

export async function getSignedUrl(storagePath: string, expiresIn: number = 300): Promise<string> {
  const { data, error } = await supabase.storage
    .from('snapshots')
    .createSignedUrl(storagePath, expiresIn);
  
  if (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }
  
  return data.signedUrl;
}

export async function deleteSnapshot(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('snapshots')
    .remove([storagePath]);
  
  if (error) {
    console.error('Error deleting snapshot:', error);
    throw error;
  }
}

export async function listSnapshots(sessionId: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from('snapshots')
    .list('', {
      search: sessionId,
    });
  
  if (error) {
    console.error('Error listing snapshots:', error);
    throw error;
  }
  
  return data.map(file => file.name);
}

// Helper function to convert base64 to blob
function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}
