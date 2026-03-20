import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { getApprovalById, rejectRequest } from '../../services/approvalService';
import { useAuth } from '../../context/AuthContext';

const ACTION_LABELS = {
  LOGIN: 'Pokušaj prijave',
  PAYMENT: 'Plaćanje',
  TRANSFER: 'Transfer između računa',
  LIMIT_CHANGE: 'Promena limita računa',
  CARD_REQUEST: 'Zahtev za karticu',
};

const POLL_INTERVAL = 5000;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minuta

export default function PendingApprovalScreen({ navigation, route }) {
  const { approvalRequestId, actionType } = route.params;
  const { loginWithTokens } = useAuth();
  const [cancelling, setCancelling] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    startPolling();
    timeoutRef.current = setTimeout(handleExpire, TIMEOUT_MS);
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const startPolling = () => {
    intervalRef.current = setInterval(async () => {
      try {
        const approval = await getApprovalById(approvalRequestId);
        if (approval.status === 'APPROVED') {
          handleApproved(approval);
        } else if (approval.status === 'REJECTED') {
          handleRejected();
        } else if (approval.status === 'EXPIRED') {
          handleExpire();
        }
      } catch {
        // network error — keep polling
      }
    }, POLL_INTERVAL);
  };

  const stopPolling = () => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
  };

  const handleApproved = async (approval) => {
    stopPolling();
    if (actionType === 'LOGIN' && approval?.payload?.access_token) {
      // Backend returns tokens in approval payload on login approval
      await loginWithTokens(approval.payload.access_token, approval.payload.refresh_token);
      // AppNavigator detects user state change and switches to MainTabs automatically
    } else {
      navigation.goBack();
    }
  };

  const handleRejected = () => {
    stopPolling();
    Alert.alert('Odbijeno', 'Akcija je odbijena.', [
      { text: 'U redu', onPress: () => navigation.goBack() },
    ]);
  };

  const handleExpire = () => {
    stopPolling();
    Alert.alert('Isteklo', 'Vreme za potvrdu je isteklo. Pokušajte ponovo.', [
      { text: 'U redu', onPress: () => navigation.goBack() },
    ]);
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await rejectRequest(approvalRequestId);
    } catch {
      // proceed regardless
    } finally {
      stopPolling();
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1a3c6e" style={styles.spinner} />

      <Text style={styles.title}>Čeka se odobrenje</Text>
      <Text style={styles.subtitle}>Potvrdite akciju na mobilnom uređaju</Text>

      <View style={styles.actionBox}>
        <Text style={styles.actionLabel}>Tip akcije</Text>
        <Text style={styles.actionValue}>{ACTION_LABELS[actionType] ?? actionType}</Text>
      </View>

      <Text style={styles.hint}>
        Otvorite mobilnu aplikaciju i odobrite ili odbijte zahtev.{'\n'}
        Zahtev ističe za 5 minuta.
      </Text>

      <TouchableOpacity
        style={[styles.cancelBtn, cancelling && styles.btnDisabled]}
        onPress={handleCancel}
        disabled={cancelling}
      >
        {cancelling
          ? <ActivityIndicator color="#e53e3e" />
          : <Text style={styles.cancelText}>Otkaži</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  spinner: { marginBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a3c6e', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 32 },
  actionBox: {
    backgroundColor: '#f0f4ff', borderRadius: 12,
    padding: 16, width: '100%', marginBottom: 24,
  },
  actionLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  actionValue: { fontSize: 16, fontWeight: '600', color: '#1a3c6e' },
  hint: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 40 },
  cancelBtn: {
    borderWidth: 1.5, borderColor: '#e53e3e', borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  btnDisabled: { opacity: 0.5 },
  cancelText: { color: '#e53e3e', fontWeight: '600', fontSize: 15 },
});
