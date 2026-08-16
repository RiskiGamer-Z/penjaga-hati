import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { supabase } from '../utils/supabase';

interface MitraDirectoryScreenProps {
  onBack: () => void;
}

interface Mitra {
  id: string;
  bio: string;
  experience: number;
  specialization: string;
  rating: number;
  total_orders_completed: number;
  users: {
    full_name: string;
    avatar_url: string | null;
  };
}

const STATIC_MITRAS: Mitra[] = [
  {
    id: 'mitra1',
    bio: 'Perawat profesional berpengalaman merawat lansia pasca stroke.',
    experience: 8,
    specialization: 'Perawatan Lansia',
    rating: 4.9,
    total_orders_completed: 42,
    users: { full_name: 'Dr. Bambang Setiawan', avatar_url: null }
  },
  {
    id: 'mitra2',
    bio: 'Sabar, telaten, dan ahli dalam pendampingan pasien kanker/kemoterapi.',
    experience: 5,
    specialization: 'Pendampingan Khusus',
    rating: 4.8,
    total_orders_completed: 28,
    users: { full_name: 'Ibu Nurdin Pratiwi', avatar_url: null }
  }
];

export default function MitraDirectoryScreen({ onBack }: MitraDirectoryScreenProps) {
  const [mitras, setMitras] = useState<Mitra[]>(STATIC_MITRAS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadMitras() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('mitras')
          .select('id, bio, experience, specialization, rating, total_orders_completed, users(full_name, avatar_url)')
          .eq('is_verified', true);

        if (!error && data && data.length > 0) {
          // Map database types
          const mapped = data.map((m: any) => ({
            id: m.id,
            bio: m.bio || 'Pendamping berdedikasi tinggi.',
            experience: m.experience || 2,
            specialization: m.specialization || 'Perawatan Umum',
            rating: m.rating ? Number(m.rating) : 5.0,
            total_orders_completed: m.total_orders_completed || 0,
            users: {
              full_name: m.users?.full_name || 'Mitra Pendamping',
              avatar_url: m.users?.avatar_url || null
            }
          }));
          setMitras(mapped);
        }
      } catch (err) {
        console.warn('Gagal memuat katalog mitra:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMitras();
  }, []);

  const filteredMitras = mitras.filter((m) =>
    m.users.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header Halaman */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Katalog Mitra Pendamping</Text>
        <View style={{ width: 24 }} /> {/* Balancing spacer */}
      </View>

      {/* Bar Pencarian */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama atau spesialisasi (misal: Lansia)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Daftar Mitra */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Memuat Mitra terlatih...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionSubtitle}>
            Menampilkan {filteredMitras.length} Mitra Pendamping Terverifikasi
          </Text>

          {filteredMitras.map((mitra) => (
            <View key={mitra.id} style={styles.mitraCard}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                  <Ionicons name="person" size={28} color="#94A3B8" />
                </View>
                <View style={styles.metaContainer}>
                  <View style={styles.nameRow}>
                    <Text style={styles.mitraName}>{mitra.users.full_name}</Text>
                    <Ionicons name="shield-checkmark" size={16} color={colors.primary} style={styles.verifyIcon} />
                  </View>
                  <Text style={styles.specialtyText}>{mitra.specialization}</Text>
                </View>
              </View>

              <Text style={styles.bioText}>"{mitra.bio}"</Text>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <View style={styles.statItem}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.statValue}> {mitra.rating.toFixed(1)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="briefcase" size={16} color={colors.textLight} />
                  <Text style={styles.statValue}> {mitra.experience} Th Pengalaman</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={styles.statValue}> {mitra.total_orders_completed} Selesai</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  searchBarContainer: {
    margin: 16,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 16,
    marginLeft: 2,
  },
  mitraCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContainer: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mitraName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  verifyIcon: {
    marginLeft: 6,
  },
  specialtyText: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: 'bold',
    marginTop: 2,
  },
  bioText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 11,
    fontWeight: 'semibold',
    color: colors.textDark,
    marginLeft: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 12,
  },
});
