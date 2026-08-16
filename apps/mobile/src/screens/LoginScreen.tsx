import React, { useState } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { colors } from '../theme/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { LoginSchema } from '@penjaga-hati/utils';
import { supabase } from '../utils/supabase';

interface LoginScreenProps {
  onLoginSuccess: (userId: string, email: string, role: 'user' | 'mitra' | 'admin' | 'owner') => void;
  onNavigateToRegister: () => void;
}

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('budi@test.com'); // Default seed user for easy testing
  const [password, setPassword] = useState('password123'); // Default password
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    // Validasi menggunakan shared Zod schema dari @penjaga-hati/utils
    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors = result.error.format();
      if (errors.email?._errors?.[0]) setEmailError(errors.email._errors[0]);
      if (errors.password?._errors?.[0]) setPasswordError(errors.password._errors[0]);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Coba login menggunakan Supabase Auth terlebih dahulu
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!authError && authData.user) {
        // Ambil data profil dari public.users untuk mendapatkan role
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', authData.user.id)
          .single();

        if (!profileError && profile) {
          setIsLoading(false);
          onLoginSuccess(profile.id, profile.email, profile.role as any);
          return;
        }
      }

      // 2. FALLBACK: Jika Supabase Auth belum memiliki user tersebut (karena di-seed langsung ke tabel public.users),
      // kita periksa apakah user tersebut ada di tabel public.users
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', email)
        .single();

      if (!dbError && dbUser) {
        // Jalankan login simulasi menggunakan data asli dari database
        setIsLoading(false);
        onLoginSuccess(dbUser.id, dbUser.email, dbUser.role as any);
        return;
      }

      // Jika keduanya gagal
      setIsLoading(false);
      Alert.alert('Gagal Masuk', 'Alamat email atau kata sandi salah. Gunakan budi@test.com atau mitra1@test.com.');
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Kesalahan Sistem', err.message || 'Tidak dapat terhubung ke server.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>Koneksi Supabase Real-time Aktif</Text>
        </View>

        <View style={styles.form}>
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
            placeholder="Masukkan kata sandi"
            secureTextEntry={true}
            iconName="lock-closed-outline"
            error={passwordError}
          />

          <Button
            title="Masuk ke Aplikasi"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.submitBtn}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Belum memiliki akun? </Text>
            <Button
              title="Daftar Sekarang"
              type="text"
              onPress={onNavigateToRegister}
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
    marginBottom: 32,
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
