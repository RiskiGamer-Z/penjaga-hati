import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { supabase } from '../utils/supabase';
import Button from './Button';

interface ReviewModalProps {
  visible: boolean;
  orderId: string;
  mitraId: string;
  userId: string;
  mitraName: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function ReviewModal({
  visible,
  orderId,
  mitraId,
  userId,
  mitraName,
  onClose,
  onSubmitSuccess
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Diperlukan', 'Harap pilih bintang ulasan terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Simpan ulasan ke database Supabase
      const { error } = await supabase.from('reviews').insert([
        {
          order_id: orderId,
          user_id: userId,
          mitra_id: mitraId,
          rating: rating,
          comment: comment
        }
      ]);

      if (error && error.code !== '42P01') {
        throw new Error(error.message);
      }

      setIsSubmitting(false);
      Alert.alert('Terima Kasih!', 'Ulasan Anda sangat berarti bagi kami dan Mitra.', [
        {
          text: 'Selesai',
          onPress: () => {
            onSubmitSuccess();
          }
        }
      ]);
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Gagal Mengirim Ulasan', err.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Bagaimana Layanan Mitra?</Text>
          <Text style={styles.modalSubtitle}>
            Berikan ulasan Anda tentang pendampingan oleh {mitraName}
          </Text>

          {/* Star Rating Selector */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                  style={styles.starIcon}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Text Input Feedback */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tulis Komentar (Opsional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ceritakan pengalaman Anda menggunakan layanan mitra..."
              multiline={true}
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Actions */}
          <View style={styles.btnRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.btnOutline]} 
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.btnOutlineText}>Lewati</Text>
            </TouchableOpacity>
            
            {isSubmitting ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.btnPrimary]} 
                onPress={handleSubmit}
              >
                <Text style={styles.btnPrimaryText}>Kirim</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.white,
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  starRow: {
    flexDirection: 'row',
    marginVertical: 24,
    gap: 8,
  },
  starIcon: {
    marginHorizontal: 2,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    height: 90,
    fontSize: 13,
    color: colors.textDark,
    backgroundColor: '#F8FAFC',
    textAlignVertical: 'top',
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  btnOutlineText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  loaderContainer: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
