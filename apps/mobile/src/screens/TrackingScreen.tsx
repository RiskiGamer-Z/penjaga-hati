import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

interface TrackingScreenProps {
  activeOrder: any;
  onContactWhatsApp: () => void;
}

export default function TrackingScreen({ activeOrder, onContactWhatsApp }: TrackingScreenProps) {
  const [subTab, setSubTab] = useState<'map' | 'care_log'>('map');

  if (!activeOrder) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="map-outline" size={64} color={colors.textLight} />
        <Text style={styles.emptyTitle}>Tidak Ada Layanan Aktif</Text>
        <Text style={styles.emptyDesc}>Anda belum memiliki pesanan pendamping yang sedang berjalan saat ini.</Text>
      </View>
    );
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'Menunggu konfirmasi bukti pembayaran oleh admin';
      case 'waiting_mitra':
        return 'Sistem sedang mencarikan Mitra siaga di sekitar lokasi';
      case 'accepted':
        return 'Mitra telah menyetujui dan sedang bersiap';
      case 'transit':
        return 'Mitra sedang dalam perjalanan menuju rumah sakit';
      case 'arrived':
        return 'Mitra telah sampai di rumah sakit tujuan';
      case 'in_progress':
        return 'Pendampingan pasien sedang berjalan di lokasi';
      default:
        return 'Pesanan Anda sedang diproses';
    }
  };

  const getEtaValue = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'Belum Bayar';
      case 'waiting_mitra':
        return 'Mencari...';
      case 'accepted':
        return 'Persiapan';
      case 'transit':
        return '10 Menit';
      case 'arrived':
        return 'Tiba';
      case 'in_progress':
        return 'Siaga';
      default:
        return '--';
    }
  };

  const mitraName = activeOrder.mitras?.users?.full_name || 'Mencari Mitra';
  const mitraRating = activeOrder.mitras?.rating ? Number(activeOrder.mitras.rating).toFixed(1) : '5.0';

  return (
    <View style={styles.flexContainer}>
      
      {/* Tab Selector di atas khusus saat pendampingan berjalan (in_progress) */}
      {activeOrder.status === 'in_progress' && (
        <View style={styles.tabSelector}>
          <TouchableOpacity 
            style={[styles.tabBtn, subTab === 'map' && styles.tabBtnActive]}
            onPress={() => setSubTab('map')}
          >
            <Ionicons name="map" size={16} color={subTab === 'map' ? colors.primary : colors.textLight} />
            <Text style={[styles.tabBtnText, subTab === 'map' && styles.tabBtnTextActive]}>Peta Lokasi</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, subTab === 'care_log' && styles.tabBtnActive]}
            onPress={() => setSubTab('care_log')}
          >
            <Ionicons name="medical" size={16} color={subTab === 'care_log' ? colors.primary : colors.textLight} />
            <Text style={[styles.tabBtnText, subTab === 'care_log' && styles.tabBtnTextActive]}>Laporan Vitals</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RENDER PETA ATAU LAPORAN VITALITAS */}
      {subTab === 'map' || activeOrder.status !== 'in_progress' ? (
        <View style={styles.flexContainer}>
          {/* Mock Map Vector */}
          <View style={styles.mockMapContainer}>
            <View style={[styles.mapRoad, { top: '30%', left: 0, width: '100%', height: 20 }]} />
            <View style={[styles.mapRoad, { top: 0, left: '60%', width: 20, height: '100%' }]} />
            
            <View style={styles.mapRoutePath} />

            {/* Destination Marker */}
            <View style={[styles.mapMarker, { top: '25%', left: '57%' }]}>
              <View style={styles.markerPulse} />
              <View style={[styles.markerIcon, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="hospital" size={14} color="#FFF" />
              </View>
              <Text style={styles.markerLabel}>{activeOrder.hospitals?.name || 'Rumah Sakit'}</Text>
            </View>

            {/* Companion Marker */}
            {activeOrder.status !== 'pending_payment' && activeOrder.status !== 'waiting_mitra' && (
              <View style={[styles.mapMarker, { top: activeOrder.status === 'transit' ? '65%' : '27%', left: activeOrder.status === 'transit' ? '57%' : '63%' }]}>
                <View style={[styles.markerIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="car" size={14} color="#FFF" />
                </View>
                <Text style={styles.markerLabel}>Mitra ({mitraName.split(' ')[0]})</Text>
              </View>
            )}
          </View>

          {/* Bottom Sheet Card */}
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            
            <View style={styles.mitraRow}>
              <View style={styles.avatarPlaceholderLarge}>
                <Ionicons name="person" size={32} color="#64748B" />
              </View>
              <View style={styles.mitraMeta}>
                <Text style={styles.companionName}>{mitraName}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}> {mitraRating} (Terverifikasi)</Text>
                </View>
              </View>
              <View style={styles.etaContainerLarge}>
                <Text style={styles.etaLabelLarge}>Status</Text>
                <Text style={styles.etaValueLarge}>{getEtaValue(activeOrder.status)}</Text>
              </View>
            </View>

            <View style={styles.trackingStatusRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.trackingStatusText}>{getStatusDescription(activeOrder.status)}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.btnHalf, styles.btnOutline]} onPress={onContactWhatsApp}>
                <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                <Text style={[styles.btnHalfText, styles.textPrimary]}>Kirim Pesan</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btnHalf, styles.btnPrimary]} 
                onPress={() => Alert.alert('Hubungi', `Menghubungi nomor telepon ${mitraName}...`)}
                disabled={!activeOrder.mitras}
              >
                <Ionicons name="call" size={18} color="#FFF" />
                <Text style={styles.btnHalfText}>Telepon</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* DAILY VITALITY LOG SCREEN (LoveCare inspired) */
        <ScrollView style={styles.careLogContainer} showsVerticalScrollIndicator={false}>
          {/* Card Vitals */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tanda-tanda Vital Pasien</Text>
            <Text style={styles.sectionSubtitle}>Pembaruan terakhir: Baru saja oleh {mitraName}</Text>
          </View>

          <View style={styles.vitalsGrid}>
            <View style={styles.vitalCard}>
              <Ionicons name="heart" size={24} color="#EF4444" />
              <Text style={styles.vitalLabel}>Detak Jantung</Text>
              <Text style={styles.vitalValue}>78 <Text style={styles.vitalUnit}>bpm</Text></Text>
              <Text style={styles.vitalStatus}>Normal</Text>
            </View>

            <View style={styles.vitalCard}>
              <Ionicons name="git-commit" size={24} color="#3B82F6" />
              <Text style={styles.vitalLabel}>Tekanan Darah</Text>
              <Text style={styles.vitalValue}>120/80 <Text style={styles.vitalUnit}>mmHg</Text></Text>
              <Text style={styles.vitalStatus}>Normal</Text>
            </View>

            <View style={styles.vitalCard}>
              <Ionicons name="thermometer" size={24} color="#F59E0B" />
              <Text style={styles.vitalLabel}>Suhu Tubuh</Text>
              <Text style={styles.vitalValue}>36.5 <Text style={styles.vitalUnit}>°C</Text></Text>
              <Text style={styles.vitalStatus}>Normal</Text>
            </View>

            <View style={styles.vitalCard}>
              <Ionicons name="water" size={24} color="#10B981" />
              <Text style={styles.vitalLabel}>SpO2 (Oksigen)</Text>
              <Text style={styles.vitalValue}>98 <Text style={styles.vitalUnit}>%</Text></Text>
              <Text style={styles.vitalStatus}>Sangat Baik</Text>
            </View>
          </View>

          {/* Card Aktivitas */}
          <Text style={styles.sectionTitle}>Log Aktivitas & Kebutuhan</Text>
          <View style={styles.activitiesCard}>
            <View style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <View style={styles.activityMeta}>
                <Text style={styles.activityName}>Makan Pagi (Bubur Halus + Sup)</Text>
                <Text style={styles.activityTime}>Selesai • 08:00 WIB</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <View style={styles.activityMeta}>
                <Text style={styles.activityName}>Pemberian Obat Hipertensi</Text>
                <Text style={styles.activityTime}>Selesai • 08:30 WIB</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <View style={styles.activityMeta}>
                <Text style={styles.activityName}>Personal Hygiene (Diseka & Ganti Popok)</Text>
                <Text style={styles.activityTime}>Selesai • 09:15 WIB</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <Ionicons name="ellipse-outline" size={20} color={colors.textLight} />
              <View style={styles.activityMeta}>
                <Text style={[styles.activityName, { color: colors.textLight }]}>Makan Siang Pasien</Text>
                <Text style={styles.activityTime}>Jadwal • 12:30 WIB</Text>
              </View>
            </View>
          </View>

          {/* Catatan Pendamping */}
          <Text style={styles.sectionTitle}>Catatan Perkembangan</Text>
          <View style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Ionicons name="document-text" size={18} color={colors.primary} />
              <Text style={styles.noteTitle}>Catatan Perkembangan Pendamping</Text>
            </View>
            <Text style={styles.noteContent}>
              "Pasien pagi ini kooperatif dan mau sarapan habis setengah porsi bubur. Kondisi vitalitas stabil. Pasien sudah bisa duduk bersandar di kasur dengan nyaman."
            </Text>
            <Text style={styles.noteAuthor}>— Ditulis oleh {mitraName}</Text>
          </View>

          {/* Quick CS Call for Vitals Log */}
          <TouchableOpacity style={styles.csCtaRow} onPress={onContactWhatsApp}>
            <Ionicons name="logo-whatsapp" size={16} color={colors.primaryDark} />
            <Text style={styles.csCtaRowText}>Ada instruksi khusus? Hubungi Mitra via WhatsApp</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  tabSelector: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: 'medium',
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  mockMapContainer: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  mapRoad: {
    backgroundColor: '#CBD5E1',
    position: 'absolute',
  },
  mapRoutePath: {
    position: 'absolute',
    left: '58%',
    top: '30%',
    width: 6,
    height: '35%',
    backgroundColor: '#10B981',
  },
  mapMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    top: -9,
  },
  markerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  markerLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0F172A',
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    marginTop: 4,
  },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  mitraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPlaceholderLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  mitraMeta: {
    flex: 1,
    marginLeft: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#475569',
  },
  etaContainerLarge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  etaLabelLarge: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.primaryDark,
    textTransform: 'uppercase',
  },
  etaValueLarge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  trackingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  trackingStatusText: {
    fontSize: 12,
    color: '#475569',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnHalf: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnHalfText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  textPrimary: {
    color: colors.primary,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },

  /* Care Log Styles */
  careLogContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
    marginTop: 16,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textLight,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  vitalCard: {
    width: (width - 44) / 2,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vitalLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 8,
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
    marginTop: 4,
  },
  vitalUnit: {
    fontSize: 10,
    fontWeight: 'normal',
    color: colors.textLight,
  },
  vitalStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginTop: 6,
  },
  activitiesCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityMeta: {
    marginLeft: 12,
    flex: 1,
  },
  activityName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  activityTime: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  noteCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  noteContent: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  noteAuthor: {
    fontSize: 11,
    fontWeight: 'semibold',
    color: colors.textLight,
    marginTop: 10,
    textAlign: 'right',
  },
  csCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 24,
  },
  csCtaRowText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: 'semibold',
  },
});
