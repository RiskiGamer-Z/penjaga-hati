'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { UploadDocumentSchema, UploadDocumentInput } from './schema'

export async function getMitraDocumentsAction(mitraId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, data: null, error: 'Not authenticated' };
    }

    const adminClient = createAdminClient();
    
    // Verify ownership
    const { data: mitra } = await adminClient
      .from('mitras')
      .select('user_id')
      .eq('id', mitraId)
      .single();

    if (!mitra || mitra.user_id !== user.id) {
      return { success: false, data: null, error: 'Unauthorized access' };
    }

    const { data: documents, error } = await adminClient
      .from('mitra_documents')
      .select('*')
      .eq('mitra_id', mitraId);

    if (error) {
        if (error.code === '42P01') {
            return { success: true, data: [] }; // Table doesn't exist yet
        }
        throw error;
    }

    return { success: true, data: documents || [] };
  } catch (err: any) {
    console.error('Get Mitra Documents Error:', err);
    return { success: false, data: null, error: err.message };
  }
}

export async function saveMitraDocumentAction(input: UploadDocumentInput) {
  try {
    const validatedData = UploadDocumentSchema.parse(input);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Silakan login kembali.' };
    }

    const adminClient = createAdminClient();

    // Verify ownership
    const { data: mitra } = await adminClient
      .from('mitras')
      .select('user_id')
      .eq('id', validatedData.mitraId)
      .single();

    if (!mitra || mitra.user_id !== user.id) {
      return { success: false, error: 'Anda tidak berhak memodifikasi profil ini.' };
    }

    // Upsert document
    // First try to check if it exists
    const { data: existingDoc } = await adminClient
        .from('mitra_documents')
        .select('id')
        .eq('mitra_id', validatedData.mitraId)
        .eq('document_type', validatedData.documentType)
        .single();

    if (existingDoc) {
        // Update
        const { error: updateError } = await adminClient
            .from('mitra_documents')
            .update({
                file_url: validatedData.fileUrl,
                status: 'pending',
                uploaded_at: new Date().toISOString(),
                rejection_reason: null
            })
            .eq('id', existingDoc.id);
            
        if (updateError) throw updateError;
    } else {
        // Insert
        const { error: insertError } = await adminClient
            .from('mitra_documents')
            .insert({
                mitra_id: validatedData.mitraId,
                document_type: validatedData.documentType,
                file_url: validatedData.fileUrl,
                status: 'pending'
            });
            
        if (insertError) throw insertError;
    }

    revalidatePath('/mitra/profil');
    return { success: true };
  } catch (err: any) {
    console.error('Save Mitra Document Error:', err);
    return { success: false, error: err.message || 'Gagal menyimpan dokumen.' };
  }
}

export async function deleteMitraDocumentAction(mitraId: string, documentId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
    
        if (!user) {
          return { success: false, error: 'Silakan login kembali.' };
        }
    
        const adminClient = createAdminClient();
    
        // Verify ownership
        const { data: mitra } = await adminClient
          .from('mitras')
          .select('user_id')
          .eq('id', mitraId)
          .single();
    
        if (!mitra || mitra.user_id !== user.id) {
          return { success: false, error: 'Anda tidak berhak.' };
        }

        // Delete from table
        const { data: doc } = await adminClient
            .from('mitra_documents')
            .select('file_url')
            .eq('id', documentId)
            .eq('mitra_id', mitraId)
            .single();
            
        if (doc && doc.file_url) {
            // Delete from storage if it's in our supabase bucket
            try {
                if (doc.file_url.includes('mitra_documents')) {
                    const urlObj = new URL(doc.file_url);
                    const pathParts = urlObj.pathname.split('/mitra_documents/');
                    if (pathParts.length > 1) {
                        const filePath = pathParts[1];
                        await adminClient.storage.from('mitra_documents').remove([filePath]);
                    }
                }
            } catch(e) {
                console.error("Failed to delete file from storage", e);
            }
        }

        const { error } = await adminClient
            .from('mitra_documents')
            .delete()
            .eq('id', documentId)
            .eq('mitra_id', mitraId);

        if (error) throw error;

        revalidatePath('/mitra/profil');
        return { success: true };
    } catch(err: any) {
        console.error('Delete Mitra Document Error:', err);
        return { success: false, error: err.message };
    }
}
