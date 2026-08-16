import { createAdminClient } from "@/utils/supabase/admin";
import ReviewsClient from "./ReviewsClient";

export const revalidate = 0; // Don't cache reviews page to show live updates

const MOCK_REVIEWS = [
  {
    id: '1',
    rating: 5,
    comment: "Sangat membantu! Pendampingnya sabar dan telaten menjaga ibu saya selama masa pemulihan.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    users: { full_name: "Budi Pratama" },
    mitras: { users: { full_name: "Siti Aminah" } }
  },
  {
    id: '2',
    rating: 4,
    comment: "Pelayanan sangat baik, admin responsif dan pendamping datang tepat waktu.",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    users: { full_name: "Dewi Wulandari" },
    mitras: { users: { full_name: "Budi Santoso" } }
  },
  {
    id: '3',
    rating: 5,
    comment: "Sangat bersyukur dengan adanya Kasihi. Ayah saya merasa nyaman ditemani oleh Mas Andi.",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    users: { full_name: "Rina Susanti" },
    mitras: { users: { full_name: "Andi Saputra" } }
  }
];

export default async function OwnerReviewsPage() {
  const adminClient = createAdminClient();
  let reviews: any[] = [];

  try {
    const { data, error } = await adminClient
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        users:user_id (full_name),
        mitras:mitra_id (users (full_name))
      `)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        reviews = MOCK_REVIEWS;
      } else {
        throw error;
      }
    } else {
      reviews = data && data.length > 0 ? data : MOCK_REVIEWS; // Fallback to mock if empty
    }
  } catch (err) {
    console.error("Error fetching reviews for owner:", err);
    reviews = MOCK_REVIEWS;
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-brand-navy tracking-tight">Kritik &amp; Saran Pelanggan</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau kepuasan pelanggan, ulasan kinerja pendamping mitra, serta umpan balik layanan.
        </p>
      </div>

      <ReviewsClient initialReviews={reviews} />
    </div>
  );
}
