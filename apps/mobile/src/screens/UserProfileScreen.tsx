import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import Button from '../components/Button';
import { supabase } from '../utils/supabase';

interface UserProfileScreenProps {
  userId: string;
  onLogout: () => void;
}

export default function UserProfileScreen({ userId, onLogout }: UserProfileScreenProps) {
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [profileName, setProfileName] = useState('Budi Santoso');
  const [profileEmail, setProfileEmail] = useState('budi.santoso@email.com');

  // Load profil & riwayat pesanan dari Supabase
  useEffect(() => {
    async function loadUserData() {
      try {
        // 1. Ambil data profil
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', userId)
          .single();

        if (!profileError && userProfile) {
          setProfileName(userProfile.full_name || 'Pengguna');
          setProfileEmail(userProfile.email || '');
        }

        // 2. Ambil data riwayat pesanan (completed atau cancelled)
        setIsLoadingHistory(true);
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, created_at, status, total_price, patient_name, hospitals(name)')
          .eq('user_id', userId)
          .in('status', ['completed', 'cancelled'])
          .order('created_at', { ascending: false });

        if (!ordersError && orders) {
          setHistoryOrders(orders);
        }
        setIsLoadingHistory(false);
      } catch (err) {
        setIsLoadingHistory(false);
        console.warn('Gagal memuat profil/riwayat:', err);
      }
    }
    loadUserData();
  }, [userId]);

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari akun Anda?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: onLogout }
      ]
    );
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Profil Header */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#CBD5E1" />
        </View>
        <Text style={styles.profileName}>{profileName}</Text>
        <Text style={styles.profileEmail}>{profileEmail}</Text>
        <Text style={styles.profileRole}>Keluarga Pasien (User)</Text>
      </View>

      {/* Akun menu */}
      <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="person-outline" size={20} color={colors.textLight} />
          <Text style={styles.menuText}>Detail Profil</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} />
          <Text style={styles.menuText}>Keamanan & Sandi</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={20} color={colors.textLight} />
          <Text style={styles.menuText}>Notifikasi</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Order History */}
      <Text style={styles.sectionTitle}>Riwayat Layanan Anda</Text>
      
      {isLoadingHistory ? (
        <ActivityIndicator color={colors.primary} size="small" style={{ marginVertical: 20 }} />
      ) : historyOrders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Belum ada riwayat pesanan.</Text>
        </View>
      ) : (
        historyOrders.map((order) => (
          <View key={order.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyHospital}>{order.hospitals?.name || 'Rumah Sakit'}</Text>
              <Text style={styles.historyDate}>
                {new Date(order.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </View>
            <Text style={styles.historyDesc}>Pasien: {order.patient_name}</Text>
            <View style={styles.historyFooter}>
              <Text style={[
                styles.statusBadge,
                order.status === 'completed' ? styles.statusSelesai : styles.statusBatal
              ]}>
                {order.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
              </Text>
              <Text style={styles.historyPrice}>{formatRupiah(order.total_price)}</Text>
            </View>
          </View>
        ))
      )}

      <Button
        title="Keluar dari Akun"
        type="outline"
        onPress={handleLogout}
        iconName="log-out-outline"
        style={styles.logoutBtn}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeaderCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  profileRole: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    marginLeft: 12,
    fontWeight: 'medium',
  },
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
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
    color: colors.textDark,
  },
  historyDate: {
    fontSize: 11,
    color: colors.textLight,
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
  statusBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  statusSelesai: {
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
  },
  statusBatal: {
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  historyPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textLight,
  },
  logoutBtn: {
    marginTop: 20,
    borderColor: '#EF4444',
  },
});
