import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, ScrollView, Image, Dimensions, Pressable, PanResponder } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { useToast } from '@/src/state/ToastProvider';
import { supabase } from '@/src/lib/supabase';
import { SUPPORT_TICKET_STATUS_LABELS, SUPPORT_TICKET_STATUS_COLORS, SENDER_ROLE_LABELS, type SupportTicket, type SupportMessage } from '@pharmago/shared';
import { useTheme } from '@/src/theme';
import { Screen, ScreenHeader } from '@/src/components';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SupportChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const toast = useToast();
  const { colors } = useTheme();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<{ uri: string; type: string; fileName: string }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [attachmentPreviewVisible, setAttachmentPreviewVisible] = useState(false);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Get current user ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });

    loadTicket();
    loadMessages();
    subscribeToMessages();
    requestPermissions();

    return () => {
      supabase.channel(`support_messages:${id}`).unsubscribe();
    };
  }, [id]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to attach images');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 0,
        orderedSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        // Store full asset objects instead of just URIs
        const imageAssets = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || `image-${Date.now()}.jpg`,
        }));
        setSelectedImages(prev => [...prev, ...imageAssets]);
        setAttachmentModalVisible(false);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      toast.error('Failed to pick images');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImages(prev => [...prev, {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || `photo-${Date.now()}.jpg`,
        }]);
        setAttachmentModalVisible(false);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      toast.error('Failed to open camera');
    }
  };

  const uploadImage = async (image: { uri: string; type: string; fileName: string }): Promise<string | null> => {
    try {
      const { uri, fileName } = image;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Use modern Expo File API
      const file = new File(uri);

      const formData = new FormData();
      formData.append('file', file, fileName);

      const uploadResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/upload/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT manually set Content-Type - let fetch generate multipart boundary
        },
        body: formData,
      });

      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        return data.url;
      } else {
        const text = await uploadResponse.text();
        console.error('Upload failed:', uploadResponse.status, text);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const clearAttachment = () => {
    setSelectedImages([]);
  };

  const loadTicket = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/support/tickets/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTicket(data.ticket);
      } else {
        toast.error('Failed to load ticket');
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Failed to load ticket');
    }
  };

  const loadMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/support/tickets/${id}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`support_messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${id}`,
        },
        (payload) => {
          const newMessage = payload.new as SupportMessage;
          // Check if message already exists to avoid duplicates
          setMessages((prev) => {
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    if ((!messageText.trim() && selectedImages.length === 0) || sending) return;

    const tempId = `temp-${Date.now()}`;
    const attachmentUrls: string[] = [];

    // Upload all selected images
    if (selectedImages.length > 0) {
      setUploadingImage(true);
      for (const image of selectedImages) {
        const url = await uploadImage(image);
        if (url) {
          attachmentUrls.push(url);
        }
      }
      setUploadingImage(false);

      if (attachmentUrls.length === 0) {
        return; // All uploads failed
      }
    }

    const optimisticMessage: SupportMessage = {
      id: tempId,
      ticket_id: id as string,
      sender_id: currentUserId || '',
      sender_role: 'customer',
      message: messageText.trim() || (selectedImages.length > 0 ? 'Image attachment' : ''),
      attachment_url: attachmentUrls[0] || null, // First image as primary
      is_internal: false,
      created_at: new Date().toISOString(),
    };

    // Optimistically add message
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText('');
    setSelectedImages([]);
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/support/tickets/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          message: messageText.trim() || 'Image attachment',
          attachment_url: attachmentUrls[0] || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic message with real one
        setMessages((prev) => prev.map(m => m.id === tempId ? data.message : m));
      } else {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter(m => m.id !== tempId));
        setMessageText(messageText);
        setSelectedImages(selectedImages);
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      setMessageText(messageText);
      setSelectedImages(selectedImages);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const loadOrderDetails = async () => {
    if (!ticket?.order_id) return;
    
    setLoadingOrder(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${ticket.order_id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (response.ok) {
        setOrderDetails(data);
        setOrderModalVisible(true);
      } else {
        toast.error('Failed to load order details');
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoadingOrder(false);
    }
  };

  const renderMessage = ({ item }: { item: SupportMessage }) => {
    const isOwnMessage = item.sender_id === currentUserId;
    const roleLabel = SENDER_ROLE_LABELS[item.sender_role] || item.sender_role;

    return (
      <View style={[styles.messageBubble, isOwnMessage ? styles.ownMessage : styles.otherMessage, isOwnMessage ? { backgroundColor: colors.primary } : { backgroundColor: colors.surfaceAlt }]}>
        <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText, { color: isOwnMessage ? colors.onPrimary : colors.text }]}>
          {item.message}
        </Text>
        {item.attachment_url && (
          <TouchableOpacity onPress={() => {
            setPreviewImageUrl(item.attachment_url);
            setImagePreviewVisible(true);
          }}>
            <Image 
              source={{ uri: item.attachment_url }} 
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        <Text style={[styles.messageTime, isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime, { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.faintText }]}>
          {roleLabel} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.gutter}>
          <ScreenHeader
            title="Support Chat"
            subtitle="Loading messages…"
            onBack={() => router.back()}
          />
        </View>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.gutter}>
        <ScreenHeader
          title={ticket?.ticket_number || 'Support Chat'}
          subtitle={ticket?.subject}
          onBack={() => router.back()}
          right={
            ticket?.order_id && (
              <TouchableOpacity onPress={loadOrderDetails} style={styles.orderButton}>
                <Feather name="package" size={20} color={colors.primary} />
              </TouchableOpacity>
            )
          }
        />
        <View style={[styles.statusRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.statusBadge, { backgroundColor: SUPPORT_TICKET_STATUS_COLORS[ticket?.status || 'open'] }]}>
            <Text style={styles.statusText}>{SUPPORT_TICKET_STATUS_LABELS[ticket?.status || 'open']}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.messagesContainer, { backgroundColor: colors.background }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedText }]}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item: SupportMessage) => item.id}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={[styles.emptyText, { color: colors.text }]}>No messages yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.mutedText }]}>Start the conversation</Text>
              </View>
            }
          />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[styles.inputWrapper, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
      >
        {selectedImages.length > 0 && (
          <View style={[styles.imagePreviewContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
              {selectedImages.map((image, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.imagePreviewItem}
                  onPress={() => {
                    setAttachmentPreviewUrl(image.uri);
                    setAttachmentPreviewVisible(true);
                  }}
                >
                  <Image source={{ uri: image.uri }} style={[styles.imagePreview, { borderColor: colors.border }]} />
                  <TouchableOpacity 
                    style={styles.removeImageButton} 
                    onPress={(e) => {
                      e.stopPropagation();
                      const newImages = selectedImages.filter((_, i) => i !== index);
                      setSelectedImages(newImages);
                    }}
                  >
                    <Feather name="x" size={18} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={[styles.addImageButton, { borderColor: colors.border }]}
                onPress={() => setAttachmentModalVisible(true)}
              >
                <Feather name="plus" size={24} color={colors.mutedText} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setAttachmentModalVisible(true)}
            style={styles.attachButton}
          >
            <Feather name="paperclip" size={20} color={colors.mutedText} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Type your message..."
            placeholderTextColor={colors.faintText}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }, ((!messageText.trim() && selectedImages.length === 0) || sending || uploadingImage) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={(!messageText.trim() && selectedImages.length === 0) || sending || uploadingImage}
          >
            {sending || uploadingImage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={orderModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Order Details</Text>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)} style={styles.modalCloseButton}>
                <Feather name="x" size={24} color={colors.mutedText} />
              </TouchableOpacity>
            </View>
            
            {loadingOrder ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.modalLoadingText, { color: colors.mutedText }]}>Loading order details...</Text>
              </View>
            ) : orderDetails ? (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.mutedText }]}>Order Code</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{orderDetails.code}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.mutedText }]}>Status</Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]}>{orderDetails.status?.replace(/_/g, ' ').toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.mutedText }]}>Total</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>₦{(orderDetails.total_kobo / 100).toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.mutedText }]}>Created</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{new Date(orderDetails.created_at).toLocaleString()}</Text>
                </View>
                {orderDetails.notes && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.mutedText }]}>Notes</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{orderDetails.notes}</Text>
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={styles.modalEmpty}>
                <Text style={[styles.modalEmptyText, { color: colors.mutedText }]}>No order details available</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={attachmentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAttachmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.attachmentModalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Attach Image</Text>
              <TouchableOpacity onPress={() => setAttachmentModalVisible(false)} style={styles.modalCloseButton}>
                <Feather name="x" size={24} color={colors.mutedText} />
              </TouchableOpacity>
            </View>
            <View style={styles.attachmentOptions}>
              <TouchableOpacity style={[styles.attachmentOption, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} onPress={pickImage}>
                <Feather name="image" size={32} color={colors.primary} />
                <Text style={[styles.attachmentOptionText, { color: colors.text }]}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.attachmentOption, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} onPress={takePhoto}>
                <Feather name="camera" size={32} color={colors.primary} />
                <Text style={[styles.attachmentOptionText, { color: colors.text }]}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={imagePreviewVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setImagePreviewVisible(false)}
      >
        <TouchableOpacity 
          style={styles.imagePreviewModalOverlay} 
          activeOpacity={1}
          onPress={() => setImagePreviewVisible(false)}
        >
          <Image 
            source={{ uri: previewImageUrl || '' }} 
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          <TouchableOpacity 
            style={styles.closePreviewButton}
            onPress={() => setImagePreviewVisible(false)}
          >
            <Feather name="x" size={32} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={attachmentPreviewVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAttachmentPreviewVisible(false)}
      >
        <TouchableOpacity 
          style={styles.imagePreviewModalOverlay} 
          activeOpacity={1}
          onPress={() => setAttachmentPreviewVisible(false)}
        >
          <Image 
            source={{ uri: attachmentPreviewUrl || '' }} 
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          <TouchableOpacity 
            style={styles.closePreviewButton}
            onPress={() => setAttachmentPreviewVisible(false)}
          >
            <Feather name="x" size={32} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: 10, paddingTop: 8 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  chatContainer: {
    flex: 1,
  },
  orderButton: {
    padding: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    // Color handled by theme
  },
  otherMessageText: {
    // Color handled by theme
  },
  ownMessageTime: {
    // Color handled by theme
  },
  otherMessageTime: {
    // Color handled by theme
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  messagesContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  inputWrapper: {
    borderTopWidth: 1,
  },
  flex: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  modalLoading: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  modalEmpty: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  attachButton: {
    padding: 12,
    marginRight: 8,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  imagePreviewScroll: {
    flex: 1,
  },
  imagePreviewItem: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  attachmentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  attachmentOption: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
  },
  attachmentOptionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  imagePreviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  closePreviewButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
});
