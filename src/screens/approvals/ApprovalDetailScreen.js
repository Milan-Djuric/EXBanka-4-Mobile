import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { getApprovalById, approveRequest, rejectRequest } from '../../services/approvalService';

const STATUS_COLORS = {
  PENDING: '#d97706',
  APPROVED: '#16a34a',
  REJECTED: '#dc2626',
  EXPIRED: '#6b7280',
};

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value ?? '—'}</Text>
  </View>
);

const PaymentPayload = ({ payload }) => (
  <>
    <Row label="Iznos" value={`${payload.amount} ${payload.currency}`} />
    <Row label="Račun pošiljaoca" value={payload.fromAccount} />
    <Row label="Račun primaoca" value={payload.toAccount} />
    <Row label="Naziv primaoca" value={payload.recipientName} />
    <Row label="Svrha" value={payload.purpose} />
    <Row label="Poziv na broj" value={payload.referenceNumber} />
    <Row label="Šifra plaćanja" value={payload.paymentCode} />
  </>
);

const TransferPayload = ({ payload }) => (
  <>
    <Row label="Sa računa" value={payload.fromAccount} />
    <Row label="Na račun" value={payload.toAccount} />
    <Row label="Iznos" value={`${payload.amount} ${payload.currency}`} />
    {payload.exchangeRate && <Row label="Kurs" value={payload.exchangeRate} />}
    {payload.fee != null && <Row label="Provizija" value={`${payload.fee} ${payload.currency}`} />}
  </>
);

const LoginPayload = ({ payload }) => (
  <>
    <Row label="Datum i vreme" value={payload.timestamp} />
    {payload.device && <Row label="Uređaj" value={payload.device} />}
    {payload.location && <Row label="Lokacija" value={payload.location} />}
  </>
);

const LimitChangePayload = ({ payload }) => (
  <>
    <Row label="Račun" value={payload.accountNumber} />
    {payload.dailyLimit != null && (
      <Row label="Dnevni limit" value={`${payload.oldDailyLimit} → ${payload.dailyLimit} RSD`} />
    )}
    {payload.monthlyLimit != null && (
      <Row label="Mesečni limit" value={`${payload.oldMonthlyLimit} → ${payload.monthlyLimit} RSD`} />
    )}
  </>
);

const PAYLOAD_COMPONENTS = {
  PAYMENT: PaymentPayload,
  TRANSFER: TransferPayload,
  LOGIN: LoginPayload,
  LIMIT_CHANGE: LimitChangePayload,
};

const ACTION_LABELS = {
  LOGIN: 'Pokušaj prijave',
  PAYMENT: 'Plaćanje',
  TRANSFER: 'Transfer između računa',
  LIMIT_CHANGE: 'Promena limita računa',
  CARD_REQUEST: 'Zahtev za karticu',
};

export default function ApprovalDetailScreen({ navigation, route }) {
  const { approvalId } = route.params;
  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // 'approve' | 'reject' | null

  const fetchApproval = useCallback(async () => {
    try {
      const data = await getApprovalById(approvalId);
      setApproval(data);
    } catch {
      Alert.alert('Greška', 'Nije moguće učitati detalje zahteva.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [approvalId]);

  useEffect(() => { fetchApproval(); }, [fetchApproval]);

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await approveRequest(approvalId);
      await fetchApproval();
      Alert.alert('Uspešno', 'Akcija uspešno odobrena.');
    } catch {
      Alert.alert('Greška', 'Odobravanje nije uspelo. Pokušajte ponovo.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    Alert.alert('Potvrda', 'Da li ste sigurni da želite da odbijete ovu akciju?', [
      { text: 'Ne', style: 'cancel' },
      {
        text: 'Odbij', style: 'destructive',
        onPress: async () => {
          setActionLoading('reject');
          try {
            await rejectRequest(approvalId);
            await fetchApproval();
            Alert.alert('Odbijeno', 'Akcija je odbijena.');
          } catch {
            Alert.alert('Greška', 'Odbijanje nije uspelo. Pokušajte ponovo.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;
  }

  const isPending = approval.status === 'PENDING';
  const PayloadComponent = PAYLOAD_COMPONENTS[approval.type];
  const statusColor = STATUS_COLORS[approval.status] ?? '#888';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.actionTitle}>{ACTION_LABELS[approval.type] ?? approval.type}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{approval.status}</Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(approval.createdAt).toLocaleString('sr-RS')}
        </Text>
      </View>

      {/* Payload details */}
      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Detalji akcije</Text>
        {PayloadComponent
          ? <PayloadComponent payload={approval.payload ?? {}} />
          : <Text style={styles.noPayload}>Nema dodatnih podataka.</Text>}
      </View>

      {/* Actions */}
      {isPending && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, actionLoading && styles.btnDisabled]}
            onPress={handleReject}
            disabled={!!actionLoading}
          >
            {actionLoading === 'reject'
              ? <ActivityIndicator color="#dc2626" />
              : <Text style={styles.rejectText}>Odbij</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.approveBtn, actionLoading && styles.btnDisabled]}
            onPress={handleApprove}
            disabled={!!actionLoading}
          >
            {actionLoading === 'approve'
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.approveText}>Odobri</Text>}
          </TouchableOpacity>
        </View>
      )}

      {!isPending && (
        <Text style={styles.resolvedNote}>
          Ovaj zahtev je već {approval.status === 'APPROVED' ? 'odobren' : approval.status === 'REJECTED' ? 'odbijen' : 'istekao'}.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    alignItems: 'center', marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  actionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  dateText: { fontSize: 12, color: '#888' },
  detailCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel: { fontSize: 14, color: '#666', flex: 1 },
  rowValue: { fontSize: 14, color: '#111', fontWeight: '500', flex: 1, textAlign: 'right' },
  noPayload: { color: '#aaa', fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  rejectBtn: {
    flex: 1, borderWidth: 2, borderColor: '#dc2626', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  rejectText: { color: '#dc2626', fontWeight: '700', fontSize: 16 },
  approveBtn: {
    flex: 1, backgroundColor: '#16a34a', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  approveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.5 },
  resolvedNote: { textAlign: 'center', color: '#888', fontSize: 14, marginTop: 16 },
});
