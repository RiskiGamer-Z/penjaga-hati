import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../utils/supabase';

interface BookingScreenProps {
  userId: string;
  patientName: string;
  setPatientName: (name: string) => void;
  patientAge: string;
  setPatientAge: (age: string) => void;
  patientGender: 'Laki-laki' | 'Perempuan';
  setPatientGender: (gender: 'Laki-laki' | 'Perempuan') => void;
  selectedHospital: string;
  setSelectedHospital: (hospital: string) => void;
  conditionNotes: string;
  setConditionNotes: (notes: string) => void;
  onSubmit: () => void;
}

type BookingStep = 1 | 2 | 3;

interface Package {
  id: string;
  name: string;
  duration: string;
  price: number;
  description: string;
}

const STATIC_PACKAGES: Package[] = [
  {
    id: 'siaga_8',
    name: 'Paket Siaga',
    duration: '8 Jam',
    price: 150000,
    description: 'Pendampingan dasar untuk pemeriksaan jalan atau kontrol rutin.'
  },
  {
    id: 'tenang_12',
    name: 'Paket Tenang',
    duration: '12 Jam',
    price: 180000,
    description: 'Cocok untuk menemani pasien rawat inap pasca-operasi minor.'
  },
  {
    id: 'penuh_24',
    name: 'Paket Siaga Penuh',
    duration: '24 Jam',
    price: 320000,
    description: 'Pendampingan penuh siang & malam dengan pelaporan berkala.'
  }
];

const STATIC_HOSPITALS = [
  'RS Cipto Mangunkusumo',
  'RS Dharmais Jakarta',
  'RS Sardjito Yogyakarta',
  'RS Hasan Sadikin Bandung',
  'RS Dr. Soetomo Surabaya'
];

export default function BookingScreen({
  userId,
  patientName,
  setPatientName,
  patientAge,
  setPatientAge,
  patientGender,
  setPatientGender,
  selectedHospital,
  setSelectedHospital,
  conditionNotes,
  setConditionNotes,
  onSubmit
}: BookingScreenProps) {
  const [step, setStep] = useState<BookingStep>(1);
  const [packages, setPackages] = useState<Package[]>(STATIC_PACKAGES);
  const [hospitals, setHospitals] = useState<string[]>(STATIC_HOSPITALS);
  const [dbHospitals, setDbHospitals] = useState<{ id: string; name: string }[]>([]);

  const [selectedPackage, setSelectedPackage] = useState<Package>(STATIC_PACKAGES[1]);
  const [selectedDate, setSelectedDate] = useState('Besok, 2 Juli 2026');
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data secara real-time dari Supabase
  useEffect(() => {
    async function loadDbData() {
      try {
        // 1. Ambil data Paket Layanan
        const { data: dbPkgs, error: pkgError } = await supabase
          .from('service_packages')
          .select('id, name, duration_hours, base_price, description')
          .order('duration_hours');

        if (!pkgError && dbPkgs && dbPkgs.length > 0) {
          const mapped = dbPkgs.map((p: any) => ({
            id: p.id,
            name: p.name || `Paket ${p.duration_hours} Jam`,
            duration: `${p.duration_hours} Jam`,
            price: Number(p.base_price),
            description: p.description || `Layanan pendampingan selama ${p.duration_hours} jam.`
          }));
          setPackages(mapped);
          setSelectedPackage(mapped[1] || mapped[0]);
        }

        // 2. Ambil data Rumah Sakit
        const { data: dbHosps, error: hospError } = await supabase
          .from('hospitals')
          .select('id, name')
          .order('name');

        if (!hospError && dbHosps && dbHosps.length > 0) {
          setDbHospitals(dbHosps);
          setHospitals(dbHosps.map((h: any) => h.name));
          setSelectedHospital(dbHosps[0].name);
        }
      } catch (err) {
        console.warn('Gagal memuat data dari Supabase:', err);
      }
    }
    loadDbData();
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!patientName || !patientAge) {
        Alert.alert('Form Belum Lengkap', 'Nama pasien dan usia wajib diisi untuk melanjutkan.');
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as BookingStep);
    }
  };

  const simulateUploadProof = () => {
    Alert.alert(
      'Unggah Bukti Transfer',
      'Pilih gambar bukti transfer Anda dari galeri ponsel (simulasi).',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Pilih Bukti_Bayar.jpg', 
          onPress: () => {
            setProofUploaded(true);
            Alert.alert('Berhasil', 'Bukti transfer berhasil diunggah.');
          } 
        }
      ]
    );
  };

  const handleFinalSubmit = async () => {
    if (!proofUploaded) {
      Alert.alert('Bukti Belum Diunggah', 'Harap unggah bukti transfer pembayaran terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Dapatkan UUID rumah sakit
      const matchedHosp = dbHospitals.find(h => h.name === selectedHospital);
      const hospitalId = matchedHosp?.id || null;

      // Dapatkan UUID paket layanan
      const matchedPkgId = selectedPackage.id;

      // 1. Simpan data pesanan ke Supabase
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: userId,
            package_id: matchedPkgId.includes('_') ? null : matchedPkgId, // Jika masih memakai dummy, gunakan null agar tak langgar foreign key
            hospital_id: hospitalId,
            patient_name: patientName,
            patient_age: parseInt(patientAge) || 60,
            patient_condition: conditionNotes || 'Pemulihan umum',
            status: 'pending_payment',
            total_price: selectedPackage.price
          }
        ])
        .select()
        .single();

      if (orderError) {
        throw new Error(orderError.message);
      }

      // 2. Simpan rincian pembayaran ke Supabase
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            order_id: newOrder.id,
            user_id: userId,
            amount: selectedPackage.price,
            status: 'pending',
            method: 'bank_transfer',
            reference: 'PAY-' + Date.now()
          }
        ]);

      if (paymentError) {
        console.warn('Gagal menyimpan record pembayaran:', paymentError.message);
      }

      setIsSubmitting(false);
      Alert.alert(
        'Pesanan Sukses!',
        'Pesanan telah terkirim ke database. Admin akan memverifikasi bukti transfer Anda.',
        [{ text: 'Lacak Sekarang', onPress: onSubmit }]
      );
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Gagal Membuat Pesanan', err.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Progress Stepper */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperHeader}>
          <Text style={styles.stepperText}>Langkah {step} dari 3</Text>
          <Text style={styles.stepperTitle}>
            {step === 1 && 'Pilih Paket & Jadwal'}
            {step === 2 && 'Detail Informasi Pasien'}
            {step === 3 && 'Pembayaran & Konfirmasi'}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill, 
            { width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }
          ]} />
        </View>
      </View>

      {/* STEP 1: PILIH PAKET DAN JADWAL */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.sectionLabel}>Pilih Paket Layanan</Text>
          {packages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[
                styles.packageCard,
                selectedPackage.id === pkg.id && styles.packageCardActive
              ]}
              onPress={() => setSelectedPackage(pkg)}
            >
              <View style={styles.packageHeader}>
                <Text style={styles.packageName}>{pkg.name} ({pkg.duration})</Text>
                <Text style={styles.packagePrice}>{formatRupiah(pkg.price)}</Text>
              </View>
              <Text style={styles.packageDesc}>{pkg.description}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionLabel}>Pilih Tanggal Mulai</Text>
          <View style={styles.datePickerRow}>
            {['Hari Ini', 'Besok, 2 Juli 2026', 'Jumat, 3 Juli 2026'].map((date) => (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateChip,
                  selectedDate === date && styles.dateChipActive
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dateChipText,
                  selectedDate === date && styles.dateChipTextActive
                ]}>{date}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Lanjutkan"
            onPress={handleNextStep}
            iconName="arrow-forward"
            style={styles.actionBtn}
          />
        </View>
      )}

      {/* STEP 2: DETAIL INFORMASI PASIEN */}
      {step === 2 && (
        <View style={styles.stepContainer}>
          <View style={styles.formCard}>
            <Input
              label="Nama Lengkap Pasien *"
              value={patientName}
              onChangeText={setPatientName}
              placeholder="Masukkan nama lengkap pasien"
              iconName="person-outline"
            />

            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Usia Pasien *"
                  value={patientAge}
                  onChangeText={setPatientAge}
                  placeholder="Contoh: 65"
                  keyboardType="numeric"
                  iconName="calendar-outline"
                />
              </View>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.formLabel}>Jenis Kelamin *</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderChip,
                      patientGender === 'Laki-laki' && styles.genderChipActive
                    ]}
                    onPress={() => setPatientGender('Laki-laki')}
                  >
                    <Text style={[
                      styles.genderChipText,
                      patientGender === 'Laki-laki' && styles.genderChipTextActive
                    ]}>Laki-laki</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderChip,
                      patientGender === 'Perempuan' && styles.genderChipActive
                    ]}
                    onPress={() => setPatientGender('Perempuan')}
                  >
                    <Text style={[
                      styles.genderChipText,
                      patientGender === 'Perempuan' && styles.genderChipTextActive
                    ]}>Perempuan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Rumah Sakit Tujuan *</Text>
              <TouchableOpacity 
                style={styles.formDropdownDummy}
                onPress={() => setShowHospitalDropdown(!showHospitalDropdown)}
              >
                <Text style={styles.formDropdownText}>{selectedHospital}</Text>
                <Ionicons name={showHospitalDropdown ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
              </TouchableOpacity>

              {showHospitalDropdown && (
                <View style={styles.dropdownMenu}>
                  {hospitals.map((hospital) => (
                    <TouchableOpacity
                      key={hospital}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedHospital(hospital);
                        setShowHospitalDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{hospital}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Input
              label="Kondisi Khusus & Catatan Tambahan *"
              value={conditionNotes}
              onChangeText={setConditionNotes}
              placeholder="Tulis kondisi klinis pasien (misal: pasca operasi, memerlukan bantuan ke toilet, dll.)"
              multiline={true}
              numberOfLines={4}
            />

            <View style={styles.btnNavRow}>
              <Button
                title="Kembali"
                type="outline"
                onPress={handlePrevStep}
                style={{ flex: 1 }}
              />
              <Button
                title="Lanjutkan"
                onPress={handleNextStep}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      )}

      {/* STEP 3: PEMBAYARAN DAN KONFIRMASI */}
      {step === 3 && (
        <View style={styles.stepContainer}>
          {/* Invoice Summary */}
          <Text style={styles.sectionLabel}>Ringkasan Pesanan</Text>
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Layanan</Text>
              <Text style={styles.invoiceValue}>{selectedPackage.name} ({selectedPackage.duration})</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Tanggal Mulai</Text>
              <Text style={styles.invoiceValue}>{selectedDate}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Pasien</Text>
              <Text style={styles.invoiceValue}>{patientName} ({patientAge} th, {patientGender})</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Rumah Sakit</Text>
              <Text style={styles.invoiceValue}>{selectedHospital}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Pembayaran</Text>
              <Text style={styles.totalPrice}>{formatRupiah(selectedPackage.price)}</Text>
            </View>
          </View>

          {/* Bank Transfer Details */}
          <Text style={styles.sectionLabel}>Transfer Rekening</Text>
          <View style={styles.bankCard}>
            <View style={styles.bankRow}>
              <View>
                <Text style={styles.bankName}>Bank Central Asia (BCA)</Text>
                <Text style={styles.bankAccount}>8720-199-201</Text>
                <Text style={styles.bankHolder}>a.n. PT Penjaga Hati Utama</Text>
              </View>
              <TouchableOpacity onPress={() => Alert.alert('Tersalin', 'Nomor rekening BCA berhasil disalin.')}>
                <Ionicons name="copy-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Proof Upload Area */}
          <Text style={styles.sectionLabel}>Unggah Bukti Transfer *</Text>
          <TouchableOpacity 
            style={[
              styles.uploadCard,
              proofUploaded && styles.uploadCardUploaded
            ]}
            onPress={simulateUploadProof}
            disabled={isSubmitting}
          >
            {proofUploaded ? (
              <View style={styles.uploadContent}>
                <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
                <Text style={styles.uploadTextUploaded}>Bukti_Transfer.jpg Berhasil Diunggah</Text>
                <Text style={styles.uploadSubtext}>Ketuk untuk mengganti gambar</Text>
              </View>
            ) : (
              <View style={styles.uploadContent}>
                <Ionicons name="cloud-upload-outline" size={32} color={colors.textLight} />
                <Text style={styles.uploadText}>Klik di sini untuk Unggah Bukti</Text>
                <Text style={styles.uploadSubtext}>Format JPG atau PNG maks 5MB</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={[styles.btnNavRow, { marginTop: 24 }]}>
            <Button
              title="Kembali"
              type="outline"
              onPress={handlePrevStep}
              style={{ flex: 1 }}
              disabled={isSubmitting}
            />
            {isSubmitting ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loaderText}>Menyimpan...</Text>
              </View>
            ) : (
              <Button
                title="Konfirmasi & Bayar"
                onPress={handleFinalSubmit}
                style={{ flex: 1.5 }}
              />
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  stepperContainer: {
    marginBottom: 20,
  },
  stepperHeader: {
    flexDirection: 'column',
  },
  stepperText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  stepperTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepContainer: {
    gap: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 8,
    marginBottom: 2,
  },
  packageCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  packageCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  packageName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  packagePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  packageDesc: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 16,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateChip: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  dateChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  dateChipText: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: 'medium',
    textAlign: 'center',
  },
  dateChipTextActive: {
    color: colors.primaryDark,
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formRow: {
    flexDirection: 'row',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
  },
  formGroup: {
    marginBottom: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  genderChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  genderChipText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: 'medium',
  },
  genderChipTextActive: {
    color: colors.primaryDark,
    fontWeight: 'bold',
  },
  formDropdownDummy: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formDropdownText: {
    fontSize: 14,
    color: colors.textDark,
  },
  dropdownMenu: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.textDark,
  },
  btnNavRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    marginTop: 16,
    height: 50,
  },
  invoiceCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  invoiceLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  invoiceValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'right',
    maxWidth: '65%',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  bankCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  bankAccount: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  bankHolder: {
    fontSize: 12,
    color: colors.textDark,
    marginTop: 2,
  },
  uploadCard: {
    height: 120,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCardUploaded: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 8,
  },
  uploadTextUploaded: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 3,
  },
  loaderContainer: {
    flex: 1.5,
    height: 48,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
});
