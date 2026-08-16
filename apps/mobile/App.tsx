import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import Screens, Theme, Supabase Client & Components
import { colors } from './src/theme/colors';
import { supabase } from './src/utils/supabase';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import UserHomeScreen from './src/screens/UserHomeScreen';
import BookingScreen from './src/screens/BookingScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import MitraHomeScreen from './src/screens/MitraHomeScreen';
import MitraDirectoryScreen from './src/screens/MitraDirectoryScreen';
import ReviewModal from './src/components/ReviewModal';

type UserRole = 'user' | 'mitra' | 'admin' | 'owner';
type UserTabType = 'user_home' | 'booking' | 'tracking' | 'profile';
type MitraTabType = 'mitra_home' | 'profile';

interface Session {
  id: string;
  email: string;
  role: UserRole;
}

export default function App() {
  // Session State
  const [session, setSession] = useState<Session | null>(null);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  // Navigation Tabs State
  const [userTab, setUserTab] = useState<UserTabType>('user_home');
  const [mitraTab, setMitraTab] = useState<MitraTabType>('mitra_home');
  const [showMitraDirectory, setShowMitraDirectory] = useState(false);

  // Booking Form State
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [selectedHospital, setSelectedHospital] = useState('RS Cipto Mangunkusumo');
  const [conditionNotes, setConditionNotes] = useState('');

  // Mitra Dashboard State
  const [isOnline, setIsOnline] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Real-time Active Order State
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrderInfo, setReviewOrderInfo] = useState<any>(null);

  // Formatter Rupiah
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Efek memantau pesanan aktif secara real-time dari database
  useEffect(() => {
    if (!session || session.role !== 'user') {
      setActiveOrder(null);
      return;
    }

    const fetchActiveOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, mitras(id, user_id, users(full_name, phone)), hospitals(name)')
          .eq('user_id', session.id)
          .in('status', ['pending_payment', 'waiting_mitra', 'accepted', 'transit', 'arrived', 'in_progress', 'completed'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const latestOrder = data[0];

          // Deteksi secara real-time jika pesanan baru saja diubah ke status 'completed'
          if (latestOrder.status === 'completed') {
            setReviewOrderInfo({
              orderId: latestOrder.id,
              mitraId: latestOrder.mitra_id,
              mitraName: latestOrder.mitras?.users?.full_name || 'Mitra Pendamping'
            });
            setShowReviewModal(true);
            
            // Tandai status pesanan di database agar tidak men-trigger modal berulang kali
            await supabase
              .from('orders')
              .update({ status: 'reviewed' }) // update to reviewed
              .eq('id', latestOrder.id);

            setActiveOrder(null);
          } else if (latestOrder.status !== 'reviewed') {
            setActiveOrder(latestOrder);
          }
        } else {
          setActiveOrder(null);
        }
      } catch (err) {
        console.warn('Gagal memuat pesanan aktif:', err);
      }
    };

    fetchActiveOrder();

    // Berlangganan (Subscribe) realtime ke tabel orders
    const channel = supabase
      .channel(`user-orders-${session.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${session.id}` },
        (payload) => {
          console.log('Update realtime diterima:', payload);
          fetchActiveOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleBookingSubmit = () => {
    setUserTab('tracking');
    // Reset form pemesanan
    setPatientName('');
    setPatientAge('');
    setConditionNotes('');
  };

  const handleAcceptOrder = () => {
    setShowOrderModal(false);
    Alert.alert('Pesanan Diterima', 'Segera bersiap menuju lokasi rumah sakit tujuan pasien.');
  };

  const handleContactWhatsApp = () => {
    Alert.alert(
      'Hubungi Customer Service',
      'Anda akan diarahkan ke WhatsApp kami untuk berkonsultasi secara gratis.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hubungi', onPress: () => Linking.openURL('https://wa.me/628123456789') }
      ]
    );
  };

  const handleLoginSuccess = (userId: string, email: string, role: UserRole) => {
    setSession({ id: userId, email, role });
    setUserTab('user_home');
    setMitraTab('mitra_home');
  };

  const handleRegisterSuccess = (role: 'user' | 'mitra') => {
    setAuthScreen('login');
  };

  const handleLogout = () => {
    setSession(null);
    setAuthScreen('login');
  };

  // 1. RENDER AUTHENTICATION SCREENS (BELUM LOGIN)
  if (!session) {
    if (authScreen === 'register') {
      return (
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setAuthScreen('register')}
      />
    );
  }

  // 2. RENDER USER DIRECTORY SCREEN (Katalog Mitra)
  if (session.role === 'user' && showMitraDirectory) {
    return (
      <MitraDirectoryScreen
        onBack={() => setShowMitraDirectory(false)}
      />
    );
  }

  // 3. RENDER USER DASHBOARD LAYOUT (LOGIN SEBAGAI USER)
  if (session.role === 'user') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        
        {/* HEADER UTAMA */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerBrand}>penjaga hati</Text>
            <Text style={styles.headerSubtitle}>Pendamping Pasien Profesional</Text>
          </View>
          <TouchableOpacity style={styles.profileBadge} onPress={() => setUserTab('profile')}>
            <Ionicons name="person-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* SCREEN CONTAINER */}
        <View style={styles.contentContainer}>
          {userTab === 'user_home' && (
            <UserHomeScreen
              activeOrder={activeOrder}
              onNavigateToBooking={() => setUserTab('booking')}
              onNavigateToTracking={() => setUserTab('tracking')}
              onNavigateToWhatsApp={handleContactWhatsApp}
              onNavigateToDirectory={() => setShowMitraDirectory(true)}
            />
          )}

          {userTab === 'booking' && (
            <BookingScreen
              userId={session.id}
              patientName={patientName}
              setPatientName={setPatientName}
              patientAge={patientAge}
              setPatientAge={setPatientAge}
              patientGender={patientGender}
              setPatientGender={setPatientGender}
              selectedHospital={selectedHospital}
              setSelectedHospital={setSelectedHospital}
              conditionNotes={conditionNotes}
              setConditionNotes={setConditionNotes}
              onSubmit={handleBookingSubmit}
            />
          )}

          {userTab === 'tracking' && (
            <TrackingScreen
              activeOrder={activeOrder}
              onContactWhatsApp={handleContactWhatsApp}
            />
          )}

          {userTab === 'profile' && (
            <UserProfileScreen
              userId={session.id}
              onLogout={handleLogout}
            />
          )}
        </View>

        {/* USER BOTTOM NAVIGATION BAR */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setUserTab('user_home')}>
            <Ionicons 
              name={userTab === 'user_home' ? 'home' : 'home-outline'} 
              size={22} 
              color={userTab === 'user_home' ? colors.primary : colors.textLight} 
            />
            <Text style={[styles.navText, userTab === 'user_home' && styles.navTextActive]}>Beranda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setUserTab('booking')}>
            <Ionicons 
              name={userTab === 'booking' ? 'add-circle' : 'add-circle-outline'} 
              size={22} 
              color={userTab === 'booking' ? colors.primary : colors.textLight} 
            />
            <Text style={[styles.navText, userTab === 'booking' && styles.navTextActive]}>Pesan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setUserTab('tracking')}>
            <Ionicons 
              name={userTab === 'tracking' ? 'map' : 'map-outline'} 
              size={22} 
              color={userTab === 'tracking' ? colors.primary : colors.textLight} 
            />
            <Text style={[styles.navText, userTab === 'tracking' && styles.navTextActive]}>Lacak</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setUserTab('profile')}>
            <Ionicons 
              name={userTab === 'profile' ? 'person' : 'person-outline'} 
              size={22} 
              color={userTab === 'profile' ? colors.primary : colors.textLight} 
            />
            <Text style={[styles.navText, userTab === 'profile' && styles.navTextActive]}>Profil</Text>
          </TouchableOpacity>
        </View>

        {/* REVIEW MODAL (REAL-TIME POPUP ON COMPLETION) */}
        {reviewOrderInfo && (
          <ReviewModal
            visible={showReviewModal}
            orderId={reviewOrderInfo.orderId}
            mitraId={reviewOrderInfo.mitraId}
            userId={session.id}
            mitraName={reviewOrderInfo.mitraName}
            onClose={() => setShowReviewModal(false)}
            onSubmitSuccess={() => {
              setShowReviewModal(false);
              setUserTab('profile'); // Buka riwayat pesanan selesai
            }}
          />
        )}
      </SafeAreaView>
    );
  }

  // 4. RENDER MITRA DASHBOARD LAYOUT (LOGIN SEBAGAI MITRA)
  if (session.role === 'mitra') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        
        {/* HEADER UTAMA */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerBrand}>penjaga hati</Text>
            <Text style={styles.headerSubtitle}>Portal Mitra Pendamping</Text>
          </View>
          <TouchableOpacity style={styles.profileBadge} onPress={() => setMitraTab('profile')}>
            <Ionicons name="person-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* SCREEN CONTAINER */}
        <View style={styles.contentContainer}>
          {mitraTab === 'mitra_home' && (
            <MitraHomeScreen
              isOnline={isOnline}
              setIsOnline={setIsOnline}
              showOrderModal={showOrderModal}
              setShowOrderModal={setShowOrderModal}
              onAcceptOrder={handleAcceptOrder}
              formatRupiah={formatRupiah}
            />
          )}

          {mitraTab === 'profile' && (
            <UserProfileScreen
              userId={session.id}
              onLogout={handleLogout}
            />
          )}
        </View>

        {/* MITRA BOTTOM NAVIGATION BAR */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setMitraTab('mitra_home')}>
            <Ionicons 
              name={mitraTab === 'mitra_home' ? 'shield-checkmark' : 'shield-checkmark-outline'} 
              size={22} 
              color={mitraTab === 'mitra_home' ? colors.primary : colors.textLight} 
            />
            <Text style={[styles.navText, mitraTab === 'mitra_home' && styles.navTextActive]}>Tugas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setMitraTab('profile')}>
            <Ionicons 
              name={mitraTab === 'profile' ? 'person' : 'person-outline'} 
              size={22} 
              color={mitraTab === 'profile' ? colors.primary : colors.textLight} 
            />
            <Text style={[styles.navText, mitraTab === 'profile' && styles.navTextActive]}>Profil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Fallback (for admin / owner)
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Role {session.role} saat ini hanya tersedia di versi Web Admin Dashboard.</Text>
        <TouchableOpacity style={styles.fallbackBtn} onPress={handleLogout}>
          <Text style={styles.fallbackBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  headerBrand: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  profileBadge: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
  },
  bottomNav: {
    height: 64,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 4,
    fontWeight: 'medium',
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  fallbackBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  fallbackBtnText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
