import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface MitraHomeScreenProps {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  showOrderModal: boolean;
  setShowOrderModal: (show: boolean) => void;
  onAcceptOrder: () => void;
  formatRupiah: (val: number) => string;
}

export default function MitraHomeScreen({
  isOnline,
  setIsOnline,
  showOrderModal,
  setShowOrderModal,
  onAcceptOrder,
  formatRupiah
}: MitraHomeScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Mitra Header with online switch */}
      <View style={[styles.mitraProfileCard, isOnline ? styles.cardOnline : styles.cardOffline]}>
        <View style={styles.mitraProfileHeader}>
          <View style={styles.avatarPlaceholderLarge}>
            <Ionicons name="person" size={32} color="#64748B" />
          </View>
          <View style={styles.mitraProfileInfo}>
            <Text style={styles.mitraProfileName}>Agus Prasetyo</Text>
            <Text style={styles.mitraProfileRole}>Mitra Pendamping</Text>
          </View>
        </View>
        <View style={styles.statusToggleContainer}>
          <Text style={styles.statusToggleLabel}>
            {isOnline ? 'Siap Menerima Pesanan (Online)' : 'Status Sedang Istirahat (Offline)'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
            thumbColor={isOnline ? '#10B981' : '#64748B'}
          />
        </View>
      </View>

      {/* Earnings Section */}
      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Pendapatan Hari Ini</Text>
        <Text style={styles.earningsAmount}>{formatRupiah(450000)}</Text>
        
        {/* Mock Earnings Sparkline Chart */}
        <View style={styles.chartMockContainer}>
          <View style={styles.chartMockBarContainer}>
            <View style={[styles.chartBar, { height: '30%' }]} />
            <View style={[styles.chartBar, { height: '50%' }]} />
            <View style={[styles.chartBar, { height: '40%' }]} />
            <View style={[styles.chartBar, { height: '80%' }]} />
            <View style={[styles.chartBar, { height: '70%' }]} />
            <View style={[styles.chartBar, { height: '90%', backgroundColor: '#10B981' }]} />
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabelText}>Sen</Text>
            <Text style={styles.chartLabelText}>Sel</Text>
            <Text style={styles.chartLabelText}>Rab</Text>
            <Text style={styles.chartLabelText}>Kam</Text>
            <Text style={styles.chartLabelText}>Jum</Text>
            <Text style={[styles.chartLabelText, { color: '#10B981', fontWeight: 'bold' }]}>Sab</Text>
          </View>
        </View>
      </View>

      {/* Simulation Trigger */}
      <TouchableOpacity 
        style={styles.simulationBtn}
        onPress={() => {
          if (!isOnline) {
            Alert.alert('Status Offline', 'Aktifkan status online terlebih dahulu untuk menerima pesanan simulasi.');
            return;
          }
          setShowOrderModal(true);
        }}
      >
        <Ionicons name="notifications-outline" size={20} color="#047857" />
        <Text style={styles.simulationBtnText}>Simulasikan Pesanan Masuk</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Riwayat Pekerjaan Terbaru</Text>

      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyHospital}>RS Cipto Mangunkusumo</Text>
          <Text style={styles.historyDate}>28 Juni 2026</Text>
        </View>
        <Text style={styles.historyDesc}>Paket 12 Jam • Pasien Bp. Achmad (Lansia)</Text>
        <View style={styles.historyFooter}>
          <Text style={styles.historyStatus}>Selesai</Text>
          <Text style={styles.historyPayout}>+ {formatRupiah(180000)}</Text>
        </View>
      </View>

      {/* POPUP SIMULASI PESANAN MASUK MITRA */}
      <Modal
        visible={showOrderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <Ionicons name="notifications" size={24} color="#FFF" />
              </View>
              <Text style={styles.modalTitle}>Pesanan Pendampingan Baru!</Text>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Lokasi Tujuan</Text>
                <Text style={styles.modalInfoValue}>RS Cipto Mangunkusumo</Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Lama Layanan</Text>
                <Text style={styles.modalInfoValue}>Paket 12 Jam (Mulai 20.00 WIB)</Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Kondisi Klinis Pasien</Text>
                <Text style={styles.modalInfoDesc}>
                  Pasien lansia pemulihan pasca operasi empedu. Membutuhkan bantuan ke toilet dan pendampingan di bangsal.
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Estimasi Pendapatan Anda</Text>
                <Text style={styles.payoutValue}>{formatRupiah(180000)}</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.btnOutline]}
                onPress={() => setShowOrderModal(false)}
              >
                <Text style={[styles.modalBtnText, styles.textRed]}>Tolak</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.btnPrimary]}
                onPress={onAcceptOrder}
              >
                <Text style={styles.modalBtnText}>Terima Pesanan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  mitraProfileCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  cardOnline: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  cardOffline: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  mitraProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarPlaceholderLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mitraProfileInfo: {
    marginLeft: 12,
  },
  mitraProfileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  mitraProfileRole: {
    fontSize: 12,
    color: '#059669',
    fontWeight: 'bold',
  },
  statusToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  statusToggleLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: 'semibold',
  },
  earningsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  earningsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  chartMockContainer: {
    marginTop: 20,
  },
  chartMockBarContainer: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  chartBar: {
    width: 24,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  chartLabelText: {
    fontSize: 10,
    color: '#64748B',
  },
  simulationBtn: {
    height: 48,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  simulationBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#047857',
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyHospital: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  historyDate: {
    fontSize: 11,
    color: '#64748B',
  },
  historyDesc: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 8,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  historyStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  historyPayout: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalInfoRow: {
    marginBottom: 12,
  },
  modalInfoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  modalInfoValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 2,
  },
  modalInfoDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 13,
    color: '#475569',
  },
  payoutValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  textRed: {
    color: '#EF4444',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FFF',
  },
  btnPrimary: {
    backgroundColor: '#10B981',
  },
});
