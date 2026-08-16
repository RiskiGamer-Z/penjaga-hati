import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

interface UserHomeScreenProps {
  activeOrder: any;
  onNavigateToBooking: () => void;
  onNavigateToTracking: () => void;
  onNavigateToWhatsApp: () => void;
  onNavigateToDirectory: () => void;
}

export default function UserHomeScreen({
  activeOrder,
  onNavigateToBooking,
  onNavigateToTracking,
  onNavigateToWhatsApp,
  onNavigateToDirectory
}: UserHomeScreenProps) {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return '⚠️ Selesaikan Pembayaran Anda';
      case 'waiting_mitra':
        return '🔍 Sedang Mencari Mitra Pendamping';
      case 'accepted':
        return '✅ Mitra Ditemukan & Siap Meluncur';
      case 'transit':
        return '🚗 Mitra Sedang Menuju Rumah Sakit';
      case 'arrived':
        return '📍 Mitra Sudah Tiba di Lokasi';
      case 'in_progress':
        return '🏥 Pendampingan Sedang Berjalan';
      default:
        return 'Pesanan Aktif Sedang Diproses';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* 1. HERO SECTION (BANNER UTAMA) */}
      <View style={styles.heroCard}>
        <Text style={styles.heroBadge}>Solusi Keluarga Terpercaya</Text>
        <Text style={styles.heroTitle}>Tenang & Nyaman Selama di Rumah Sakit</Text>
        <Text style={styles.heroDesc}>
          Kami menjembatani keluarga pasien dengan mitra pendamping terlatih untuk menemani kerabat tercinta 24/7 secara profesional.
        </Text>
        
        <View style={styles.heroBtnRow}>
          <TouchableOpacity 
            style={styles.heroBtnPrimary}
            onPress={onNavigateToBooking}
          >
            <Text style={styles.heroBtnPrimaryText}>Mulai Pesan</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.heroBtnOutline}
            onPress={onNavigateToWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#059669" />
            <Text style={styles.heroBtnOutlineText}>Tanya CS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. FLOATING ACTIVE ORDER NOTICE */}
      {activeOrder && (
        <View style={styles.activeOrderNotice}>
          <View style={styles.activeNoticeLeft}>
            <View style={styles.pulseDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeNoticeText}>{getStatusText(activeOrder.status)}</Text>
              <Text style={styles.activeNoticeSubtext}>
                {activeOrder.hospitals?.name} • Pasien: {activeOrder.patient_name}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.activeNoticeBtn}
            onPress={onNavigateToTracking}
          >
            <Text style={styles.activeNoticeBtnText}>Lacak</Text>
            <Ionicons name="chevron-forward" size={14} color="#059669" />
          </TouchableOpacity>
        </View>
      )}

      {/* 3. HALODOC-STYLE QUICK SERVICES MENU */}
      <View style={styles.quickMenuCard}>
        <Text style={styles.sectionLabel}>Layanan Pintar</Text>
        <View style={styles.quickMenuGrid}>
          <TouchableOpacity style={styles.quickMenuItem} onPress={onNavigateToBooking}>
            <View style={[styles.quickIconContainer, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickMenuLabel}>Pesan Jaga</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickMenuItem} onPress={onNavigateToDirectory}>
            <View style={[styles.quickIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="search" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.quickMenuLabel}>Cari Mitra</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickMenuItem} onPress={onNavigateToWhatsApp}>
            <View style={[styles.quickIconContainer, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#EC4899" />
            </View>
            <Text style={styles.quickMenuLabel}>Tanya CS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. LAYANAN KAMI (SERVICES) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Layanan Lengkap Kami</Text>
        <Text style={styles.sectionSubtitle}>Didesain khusus untuk setiap tipe kebutuhan pasien</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
        <View style={styles.serviceBox}>
          <Text style={styles.serviceEmoji}>🏥</Text>
          <Text style={styles.serviceBoxTitle}>Rawat Inap</Text>
          <Text style={styles.serviceBoxDesc}>Mitra siaga mendampingi di kamar rawat inap rumah sakit 24 jam.</Text>
        </View>

        <View style={styles.serviceBox}>
          <Text style={styles.serviceEmoji}>👶</Text>
          <Text style={styles.serviceBoxTitle}>Rawat Lansia</Text>
          <Text style={styles.serviceBoxDesc}>Perawatan lansia mencakup nutrisi, kebersihan diri, dan terapi fisik.</Text>
        </View>

        <View style={styles.serviceBox}>
          <Text style={styles.serviceEmoji}>🧠</Text>
          <Text style={styles.serviceBoxTitle}>Mental Support</Text>
          <Text style={styles.serviceBoxDesc}>Dukungan psikososial agar pasien tetap optimis selama pemulihan.</Text>
        </View>

        <View style={styles.serviceBox}>
          <Text style={styles.serviceEmoji}>🚑</Text>
          <Text style={styles.serviceBoxTitle}>Respon Cepat</Text>
          <Text style={styles.serviceBoxDesc}>Penugasan darurat cepat untuk kebutuhan pendampingan darurat.</Text>
        </View>
      </ScrollView>

      {/* 5. CARA MEMESAN (4 LANGKAH TIMELINE) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cara Kerja (4 Langkah Mudah)</Text>
        <Text style={styles.sectionSubtitle}>Proses kami dirancang cepat dan transparan untuk keluarga</Text>
      </View>

      <View style={styles.timelineCard}>
        <View style={styles.timelineItem}>
          <View style={styles.timelineCircle}>
            <Text style={styles.timelineNum}>1</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineItemTitle}>Konsultasi Awal</Text>
            <Text style={styles.timelineItemDesc}>Hubungi kami melalui WhatsApp atau aplikasi. Tim kami akan mendengarkan kebutuhan Anda secara gratis.</Text>
          </View>
        </View>
        <View style={styles.timelineLine} />

        <View style={styles.timelineItem}>
          <View style={styles.timelineCircle}>
            <Text style={styles.timelineNum}>2</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineItemTitle}>Asesmen Kebutuhan</Text>
            <Text style={styles.timelineItemDesc}>Koordinator kami melakukan penilaian kondisi pasien untuk menyusun rencana perawatan yang tepat.</Text>
          </View>
        </View>
        <View style={styles.timelineLine} />

        <View style={styles.timelineItem}>
          <View style={styles.timelineCircle}>
            <Text style={styles.timelineNum}>3</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineItemTitle}>Penugasan Penjaga Profesional</Text>
            <Text style={styles.timelineItemDesc}>Kami mencocokkan pasien dengan Mitra yang paling sesuai berdasarkan keahlian, kepribadian, dan lokasi.</Text>
          </View>
        </View>
        <View style={styles.timelineLine} />

        <View style={styles.timelineItem}>
          <View style={styles.timelineCircle}>
            <Text style={styles.timelineNum}>4</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineItemTitle}>Pemantauan Berkelanjutan</Text>
            <Text style={styles.timelineItemDesc}>Supervisor memantau kualitas layanan secara rutin dan keluarga dapat memantau perkembangan pasien di aplikasi.</Text>
          </View>
        </View>
      </View>

      {/* 6. MENGAPA MEMILIH KAMI (FEATURES HIGHLIGHT) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Keunggulan Kami</Text>
        <Text style={styles.sectionSubtitle}>Memberikan kenyamanan terbaik untuk kerabat Anda</Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="shield-checkmark" size={24} color="#059669" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Mitra Medis Terlatih</Text>
            <Text style={styles.featureDesc}>Semua mitra telah melewati seleksi ketat, KTP background check, dan sertifikasi.</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="navigate" size={24} color="#059669" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Pelacakan GPS Real-time</Text>
            <Text style={styles.featureDesc}>Pantau lokasi kedatangan Mitra langsung dari peta di handphone Anda.</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="chatbubbles" size={24} color="#059669" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Laporan Harian Rutin</Text>
            <Text style={styles.featureDesc}>Dapatkan pembaruan kondisi vitalitas dan aktivitas pasien secara real-time.</Text>
          </View>
        </View>
      </View>

      {/* 7. TESTIMONI KELUARGA */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Testimoni Keluarga</Text>
        <Text style={styles.sectionSubtitle}>Kepercayaan yang kami jaga dengan penuh tanggung jawab</Text>
      </View>

      <View style={styles.testiCard}>
        <View style={styles.ratingStars}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Ionicons name="star" size={16} color="#F59E0B" />
        </View>
        <Text style={styles.testiText}>
          "Proses pendaftarannya sangat cepat dan tanggap. Dalam 2 jam sudah ada Mitra pendamping yang datang ke bangsal ibu saya di RS. Sangat menenangkan."
        </Text>
        <Text style={styles.testiAuthor}>— Budi Santoso (Yogyakarta)</Text>
      </View>

      {/* Bottom CS Contact CTA */}
      <View style={styles.csCtaCard}>
        <Text style={styles.csCtaTitle}>Ada Pertanyaan Tambahan?</Text>
        <Text style={styles.csCtaDesc}>Hubungi customer service kami yang bersedia melayani konsultasi gratis 24 jam.</Text>
        <TouchableOpacity 
          style={styles.csCtaBtn}
          onPress={onNavigateToWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
          <Text style={styles.csCtaBtnText}>Hubungi CS Sekarang</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  heroBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 28,
  },
  heroDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
    lineHeight: 18,
  },
  heroBtnRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  heroBtnPrimary: {
    flex: 1.2,
    height: 44,
    backgroundColor: '#10B981',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroBtnPrimaryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  heroBtnOutline: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroBtnOutlineText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  activeOrderNotice: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  activeNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  activeNoticeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#047857',
  },
  activeNoticeSubtext: {
    fontSize: 10,
    color: '#065F46',
    marginTop: 2,
  },
  activeNoticeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  activeNoticeBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
  quickMenuCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
  },
  quickMenuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickMenuItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickMenuLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  horizontalScroll: {
    paddingRight: 16,
    marginBottom: 24,
  },
  serviceBox: {
    backgroundColor: colors.white,
    width: width * 0.55,
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  serviceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceBoxTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  serviceBoxDesc: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 6,
    lineHeight: 16,
  },
  timelineCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNum: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },
  timelineItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  timelineItemDesc: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
    lineHeight: 16,
  },
  timelineLine: {
    width: 2,
    height: 18,
    backgroundColor: '#A7F3D0',
    marginLeft: 13,
    marginVertical: 4,
  },
  featuresContainer: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  featureDesc: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 3,
    lineHeight: 15,
  },
  testiCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    alignItems: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 10,
  },
  testiText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  testiAuthor: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 12,
  },
  csCtaCard: {
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  csCtaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065F46',
    textAlign: 'center',
  },
  csCtaDesc: {
    fontSize: 11,
    color: '#047857',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  csCtaBtn: {
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  csCtaBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.white,
  },
});
