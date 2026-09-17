import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useToast } from '@/src/state/ToastProvider';
import { supabase } from '@/src/lib/supabase';
import { SUPPORT_TICKET_CATEGORY_LABELS, type SupportTicketCategory } from '@pharmago/shared';
import { useTheme } from '@/src/theme';
import { Screen, ScreenHeader } from '@/src/components';

const CATEGORIES: { value: SupportTicketCategory; label: string }[] = [
  { value: 'order_issue', label: 'Order Issue' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'delivery_issue', label: 'Delivery Issue' },
  { value: 'product_issue', label: 'Product Issue' },
  { value: 'other', label: 'Other' },
];

export default function CreateSupportTicketScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const toast = useToast();
  const { colors } = useTheme();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory>('order_issue');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!orderId) {
      toast.error('Order ID is required');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          order_id: orderId,
          subject: subject.trim(),
          category,
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.show('Support ticket created successfully');
        router.replace('/(app)/support');
      } else {
        toast.error(data.error || 'Failed to create support ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.gutter}>
        <ScreenHeader
          title="Get Help"
          subtitle="Create a support ticket"
          onBack={() => router.back()}
        />
      </View>

      <View style={styles.scrollContent}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.categoryButton, category === cat.value ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setCategory(cat.value)}
              >
                <Text style={[styles.categoryText, category === cat.value ? { color: colors.onPrimary } : { color: colors.text }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Subject</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Brief description of your issue"
            placeholderTextColor={colors.faintText}
            value={subject}
            onChangeText={setSubject}
            maxLength={100}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Provide more details about your issue..."
            placeholderTextColor={colors.faintText}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            maxLength={1000}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, (!subject.trim() || loading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!subject.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Ticket</Text>
            )}
          </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: 20, paddingTop: 8 },
  scrollContent: { paddingBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    height: 120,
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
