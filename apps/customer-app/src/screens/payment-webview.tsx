import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api';

type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export default function PaymentWebViewScreen() {
  const { url, orderId } = useLocalSearchParams<{ url: string; orderId: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = useCallback((navState: any) => {
    const { url } = navState;
    
    // Check if we've been redirected to the callback URL
    if (url.includes('/payment/callback')) {
      setLoading(true);
      
      // Parse the URL to determine the payment status
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const reference = urlParams.get('reference');
      const trxref = urlParams.get('trxref');
      
      if (reference || trxref) {
        // Payment was completed - verify with our backend
        verifyPayment(orderId);
      } else {
        // Payment was cancelled or failed
        setStatus('cancelled');
        setTimeout(() => router.back(), 1500);
      }
    }
  }, [orderId, router]);

  const verifyPayment = async (orderId: string) => {
    try {
      // Poll the order status to verify payment
      const order = await api.orders.get(orderId);
      
      if (order.status === 'paid' || order.status === 'confirmed') {
        setStatus('success');
        setTimeout(() => {
          router.replace({
            pathname: '/order/[id]',
            params: { id: orderId },
          });
        }, 1500);
      } else if (order.status === 'payment_failed' || order.status === 'cancelled') {
        setStatus('failed');
        setTimeout(() => router.back(), 1500);
      } else {
        // Still processing, poll again after a delay
        setTimeout(() => verifyPayment(orderId), 2000);
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      setStatus('failed');
      setTimeout(() => router.back(), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadStart = () => {
    setLoading(true);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setStatus('failed');
    setLoading(false);
    setTimeout(() => router.back(), 1500);
  };

  const renderStatusOverlay = () => {
    if (status === 'pending' && loading) {
      return (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#0036B6" />
          <Text style={styles.statusText}>Processing payment...</Text>
        </View>
      );
    }

    if (status === 'success') {
      return (
        <View style={[styles.overlay, styles.successOverlay]}>
          <Text style={styles.successText}>✓ Payment Successful</Text>
          <Text style={styles.successSubtext}>Redirecting to order...</Text>
        </View>
      );
    }

    if (status === 'failed') {
      return (
        <View style={[styles.overlay, styles.errorOverlay]}>
          <Text style={styles.errorText}>✕ Payment Failed</Text>
          <Text style={styles.errorSubtext}>Redirecting back...</Text>
        </View>
      );
    }

    if (status === 'cancelled') {
      return (
        <View style={[styles.overlay, styles.errorOverlay]}>
          <Text style={styles.errorText}>Payment Cancelled</Text>
          <Text style={styles.errorSubtext}>Redirecting back...</Text>
        </View>
      );
    }

    return null;
  };

  if (!url) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Payment URL not provided</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        style={styles.webview}
        startInLoadingState
        scalesPageToFit
      />
      {renderStatusOverlay()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#4b5768',
    marginTop: 12,
  },
  successOverlay: {
    backgroundColor: 'rgba(16, 191, 65, 0.1)',
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10BF41',
  },
  successSubtext: {
    fontSize: 14,
    color: '#4b5768',
  },
  errorOverlay: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#4b5768',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
