'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Submit a review for a completed order
 * User can only review after order is completed
 */
export async function submitReviewAction(
  orderId: string,
  mitraId: string,
  data: {
    rating: number
    comment: string
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    // Validate input
    if (data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
      return { success: false, error: 'Rating harus antara 1 sampai 5.' }
    }

    if (!data.comment || data.comment.trim().length === 0) {
      return { success: false, error: 'Komentar tidak boleh kosong.' }
    }

    if (data.comment.trim().length > 500) {
      return { success: false, error: 'Komentar maksimal 500 karakter.' }
    }

    const adminClient = createAdminClient()

    // Verify order belongs to user and is completed
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, user_id, status, mitra_id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .eq('mitra_id', mitraId)
      .eq('status', 'completed')
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Pesanan tidak ditemukan atau belum selesai.' }
    }

    // Check if review already exists
    const { data: existingReview } = await adminClient
      .from('reviews')
      .select('id')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single()

    if (existingReview) {
      return { success: false, error: 'Anda sudah memberikan review untuk pesanan ini.' }
    }

    // Create review
    const { data: review, error: createError } = await adminClient
      .from('reviews')
      .insert({
        order_id: orderId,
        user_id: user.id,
        mitra_id: mitraId,
        rating: data.rating,
        comment: data.comment.trim()
      })
      .select()
      .single()

    if (createError) throw createError

    // Update mitra's average rating
    // Get all ratings for this mitra
    const { data: reviews } = await adminClient
      .from('reviews')
      .select('rating')
      .eq('mitra_id', mitraId)

    if (reviews) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      const totalReviews = reviews.length

      await adminClient
        .from('mitras')
        .update({
          average_rating: Math.round(avgRating * 100) / 100,
          total_reviews: totalReviews
        })
        .eq('id', mitraId)
    }

    // Add timeline entry
    await adminClient.from('order_timeline').insert({
      order_id: orderId,
      event_type: 'reviewed',
      details: { rating: data.rating },
      triggered_by: 'user',
      created_by: user.id
    })

    revalidatePath(`/user/orders/${orderId}`)
    revalidatePath('/user/dashboard')
    revalidatePath('/admin/reviews')

    return { success: true, data: review }
  } catch (err: any) {
    console.error('Submit Review Error:', err)
    return { success: false, error: err.message || 'Gagal mengirim review.' }
  }
}

/**
 * Update an existing review
 */
export async function updateReviewAction(
  reviewId: string,
  data: {
    rating?: number
    comment?: string
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    // Validate input
    if (data.rating && (data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating))) {
      return { success: false, error: 'Rating harus antara 1 sampai 5.' }
    }

    if (data.comment && (data.comment.trim().length === 0 || data.comment.trim().length > 500)) {
      return { success: false, error: 'Komentar harus antara 1 sampai 500 karakter.' }
    }

    const adminClient = createAdminClient()

    // Verify review ownership
    const { data: review, error: reviewError } = await adminClient
      .from('reviews')
      .select('id, user_id, mitra_id')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single()

    if (reviewError || !review) {
      return { success: false, error: 'Review tidak ditemukan.' }
    }

    // Prepare update data
    const updateData: any = {}
    if (data.rating !== undefined) updateData.rating = data.rating
    if (data.comment !== undefined) updateData.comment = data.comment.trim()

    // Update review
    const { error: updateError } = await adminClient
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)

    if (updateError) throw updateError

    // Recalculate mitra's average rating
    const { data: reviews } = await adminClient
      .from('reviews')
      .select('rating')
      .eq('mitra_id', review.mitra_id)

    if (reviews) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      const totalReviews = reviews.length

      await adminClient
        .from('mitras')
        .update({
          average_rating: Math.round(avgRating * 100) / 100,
          total_reviews: totalReviews
        })
        .eq('id', review.mitra_id)
    }

    revalidatePath('/user/dashboard')
    revalidatePath('/admin/reviews')

    return { success: true }
  } catch (err: any) {
    console.error('Update Review Error:', err)
    return { success: false, error: err.message || 'Gagal memperbarui review.' }
  }
}

/**
 * Delete a review
 */
export async function deleteReviewAction(reviewId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    // Verify review ownership
    const { data: review, error: reviewError } = await adminClient
      .from('reviews')
      .select('id, user_id, mitra_id')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single()

    if (reviewError || !review) {
      return { success: false, error: 'Review tidak ditemukan.' }
    }

    // Delete review
    const { error: deleteError } = await adminClient
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (deleteError) throw deleteError

    // Recalculate mitra's average rating
    const { data: reviews } = await adminClient
      .from('reviews')
      .select('rating')
      .eq('mitra_id', review.mitra_id)

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      const totalReviews = reviews.length

      await adminClient
        .from('mitras')
        .update({
          average_rating: Math.round(avgRating * 100) / 100,
          total_reviews: totalReviews
        })
        .eq('id', review.mitra_id)
    } else {
      // No reviews left, reset rating
      await adminClient
        .from('mitras')
        .update({
          average_rating: 0,
          total_reviews: 0
        })
        .eq('id', review.mitra_id)
    }

    revalidatePath('/user/dashboard')
    revalidatePath('/admin/reviews')

    return { success: true }
  } catch (err: any) {
    console.error('Delete Review Error:', err)
    return { success: false, error: err.message || 'Gagal menghapus review.' }
  }
}

/**
 * Get user's reviews
 */
export async function getUserReviewsAction(limit: number = 10, offset: number = 0) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, data: null, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    const { data: reviews, error, count } = await adminClient
      .from('reviews')
      .select(
        `
        id,
        rating,
        comment,
        created_at,
        order_id,
        mitra_id,
        mitras:mitra_id (
          id,
          users:user_id (full_name, phone)
        ),
        orders:order_id (
          id,
          order_number,
          patient_name
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      success: true,
      data: {
        reviews: reviews || [],
        total: count || 0,
        limit,
        offset
      }
    }
  } catch (err: any) {
    console.error('Get User Reviews Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Get a specific review
 */
export async function getReviewDetailAction(reviewId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, data: null, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    const { data: review, error } = await adminClient
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        user_id,
        order_id,
        mitra_id,
        orders:order_id (
          id,
          order_number,
          patient_name
        )
      `)
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single()

    if (error || !review) {
      return { success: false, data: null, error: 'Review tidak ditemukan.' }
    }

    return { success: true, data: review }
  } catch (err: any) {
    console.error('Get Review Detail Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Respond to a review (Admin/Owner only)
 */
export async function respondToReviewAction(
  reviewId: string,
  response: string
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
      return { success: false, error: 'Anda tidak memiliki wewenang untuk menanggapi ulasan.' }
    }

    if (!response || response.trim().length === 0) {
      return { success: false, error: 'Tanggapan tidak boleh kosong.' }
    }

    if (response.trim().length > 500) {
      return { success: false, error: 'Tanggapan maksimal 500 karakter.' }
    }

    const { error: updateError } = await adminClient
      .from('reviews')
      .update({
        admin_response: response.trim(),
        admin_response_at: new Date().toISOString()
      })
      .eq('id', reviewId)

    if (updateError) throw updateError

    revalidatePath('/admin/reviews')
    revalidatePath('/user/orders/[id]', 'layout')

    return { success: true }
  } catch (err: any) {
    console.error('Respond to Review Error:', err)
    return { success: false, error: err.message || 'Gagal menanggapi ulasan.' }
  }
}
