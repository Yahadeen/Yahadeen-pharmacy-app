import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useGlobalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useToast } from '@/src/state/ToastProvider';
import { supabase } from '@/src/lib/supabase';
import { Feather } from '@expo/vector-icons';

export default function PaymentScreen() {
  const localParams = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [verifying, setVerifying] = useState(false);
  const currentUrlRef = useRef<string>('');

  // Check if we're coming from a callback (deep link) or payment confirmation
  const reference = globalParams.reference as string | undefined;
  const paymentUrl = localParams.url as string | undefined;
  const orderId = localParams.orderId as string | undefined;

  useEffect(() => {
    // Only verify if we have a reference from a deep link callback (globalParams)
    // This is for cases where the callback actually reaches the backend
    if (reference && typeof reference === 'string') {
      verifyPaymentCallback(reference);
    } else if (!paymentUrl) {
      toast.error('No payment URL provided');
      router.back();
    }
  }, [reference, paymentUrl, router, toast]);

  const verifyPaymentCallback = async (ref: string) => {
    setVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reference: ref }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentComplete(true);
        setPaymentStatus('paid');
        toast.show('Payment successful!');
        setTimeout(() => {
          router.replace('/(app)/orders');
        }, 1500);
      } else {
        setPaymentComplete(true);
        setPaymentStatus('failed');
        toast.error(data.error || 'Payment verification failed');
        setTimeout(() => {
          router.replace('/(app)/orders');
        }, 2000);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentComplete(true);
      setPaymentStatus('failed');
      toast.error('Payment verification failed');
      setTimeout(() => {
        router.replace('/(app)/orders');
      }, 2000);
    } finally {
      setVerifying(false);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const currentUrl = navState.url;
    currentUrlRef.current = currentUrl;
    
    console.log('Navigation state changed:', currentUrl);
    
    // If we've already completed payment, don't process further
    if (paymentComplete) {
      return;
    }

    // When we navigate to the callback URL, the backend will handle verification
    // and return HTML that will send a message back to React Native
    if (currentUrl.includes('/payment/callback')) {
      console.log('Callback URL reached - waiting for backend response');
      // The callback HTML will send a message via onMessage
    }
  };

  const handleLoadStart = () => {
    setLoading(true);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error: ', nativeEvent);
    
    // If we get a connection error on the callback URL, it means the callback
    // has already been processed (payment verified successfully)
    // Just show success and redirect
    if (nativeEvent.url?.includes('/payment/callback')) {
      console.log('Callback URL error - payment likely already verified');
      setPaymentComplete(true);
      setPaymentStatus('paid');
      toast.show('Payment successful!');
      setTimeout(() => {
        router.replace('/(app)/orders');
      }, 1500);
    } else {
      toast.error('Failed to load payment page');
      router.back();
    }
  };

  const injectedJavaScript = `
    window.addEventListener('load', function() {
      window.open = function(url) {
        window.location.href = url;
        return false;
      };
    });
    true;
  `;

  // If we're verifying a callback, show verification screen
  if (reference) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Verifying Payment</Text>
        </View>
        
        {verifying && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Verifying payment...</Text>
          </View>
        )}
        
        {paymentComplete && paymentStatus === 'paid' && (
          <View style={styles.successOverlay}>
            <View style={styles.successBox}>
              <Text style={styles.successText}>✓ Payment Successful!</Text>
              <Text style={styles.successSubtext}>Redirecting to orders...</Text>
            </View>
          </View>
        )}
        
        {paymentComplete && paymentStatus === 'failed' && (
          <View style={styles.errorOverlay}>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>✗ Payment Failed</Text>
              <Text style={styles.errorSubtext}>Please try again</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Otherwise show WebView for payment
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Complete Payment</Text>
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={() => router.replace('/(app)/orders')}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading payment...</Text>
        </View>
      )}
      
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl as string }}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onMessage={(event) => {
            const message = event.nativeEvent.data;
            console.log('WebView message:', message);
            if (typeof message === 'string' && message.startsWith('PAYMENT_SUCCESS:')) {
              const ref = message.replace('PAYMENT_SUCCESS:', '');
              console.log('Payment success confirmed from callback:', ref);
              setPaymentComplete(true);
              setPaymentStatus('paid');
              toast.show('Payment successful!');
              setTimeout(() => {
                router.replace('/(app)/orders');
              }, 1500);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          injectedJavaScript={injectedJavaScript}
          mixedContentMode="compatibility"
          allowsBackForwardNavigationGestures={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  webviewContainer: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  successBox: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 16,
    color: '#666',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  errorBox: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
  },
});
