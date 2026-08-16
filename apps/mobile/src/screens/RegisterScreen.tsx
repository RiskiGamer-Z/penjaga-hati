import React, { useState } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../utils/supabase';

interface RegisterScreenProps {
  onRegisterSuccess: (role: 'user' | 'mitra') => void;
  onNavigateToLogin: () => void;
}

export default function RegisterScreen({ onRegisterSuccess, onNavigateToLogin }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'mitra'>('user');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!fullName) {
      setNameError('Nama lengkap wajib diisi');
      hasError = true;
    }
    if (!email || !email.includes('@')) {
      setEmailError('Format email tidak valid');
      hasError = true;
    }
    if (!password || password.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      // 1. Buat user di Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error('Gagal mendapatkan ID pengguna baru.');
      }

      // 2. Hubungkan data profil ke tabel public.users
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email,
            full_name: fullName,
            role: selectedRole,
            is_active: true
          }
        ]);

      // Jika error karena profile sudah dibuat oleh trigger database, abaikan saja
      if (dbError && !dbError.message.includes('duplicate key')) {
        console.warn('DB Insert Warning:', dbError.message);
      }

      // Jika role adalah Mitra, inisialisasi baris kosong di tabel public.mitras
      if (selectedRole === 'mitra') {
        await supabase
          .from('mitras')
          .insert([
            {
              user_id: userId,
              is_verified: false,
              total_orders_completed: 0,
              rating: 5.0
            }
          ]);
      }

      setIsLoading(false);
      Alert.alert(
        'Pendaftaran Sukses',
        `Akun Anda sebagai ${selectedRole === 'user' ? 'Keluarga Pasien' : 'Mitra Pendamping'} berhasil dibuat.`,
        [
          {
            text: 'Mulai Masuk',
            onPress: () => onRegisterSuccess(selectedRole)
          }
        ]
      );
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Gagal Daftar', err.message || 'Terjadi kesalahan sistem saat mendaftar.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <Text style={styles.title}>Buat Akun Baru</Text>
          <Text style={styles.subtitle}>Terintegrasi Supabase Real-time</Text>
        </View>

        <View style={styles.form}>
          {/* Role Selector */}
          <Text style={styles.roleLabel}>Daftar Sebagai *</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleChip,
                selectedRole === 'user' && styles.roleChipActive
              ]}
              onPress={() => setSelectedRole('user')}
            >
              <Text style={[
                styles.roleChipText,
                selectedRole === 'user' && styles.roleChipTextActive
              ]}>Keluarga Pasien</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleChip,
                selectedRole === 'mitra' && styles.roleChipActive
              ]}
              onPress={() => setSelectedRole('mitra')}
            >
              <Text style={[
                styles.roleChipText,
                selectedRole === 'mitra' && styles.roleChipTextActive
              ]}>Mitra Pendamping</Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Nama Lengkap"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Masukkan nama lengkap Anda"
            iconName="person-outline"
            error={nameError}
          />

          <Input
            label="Alamat Email"
            value={email}
            onChangeText={setEmail}
            placeholder="nama@email.com"
            keyboardType="email-address"
            iconName="mail-outline"
            error={emailError}
          />

          <Input
            label="Kata Sandi"
            value={password}
            onChangeText={setPassword}
            placeholder="Minimal 6 karakter"
            secureTextEntry={true}
            iconName="lock-closed-outline"
            error={passwordError}
          />

          <Button
            title="Daftar Sekarang"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.submitBtn}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Sudah memiliki akun? </Text>
            <Button
              title="Masuk"
              type="text"
              onPress={onNavigateToLogin}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  roleChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  roleChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleChipText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: 'medium',
  },
  roleChipTextActive: {
    color: colors.primaryDark,
    fontWeight: 'bold',
  },
  submitBtn: {
    marginTop: 8,
    height: 50,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: colors.textLight,
  },
});
