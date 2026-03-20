import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Switch,
} from 'react-native';
import { getApprovals } from '../../services/approvalService';

const POLL_INTERVAL = 5000;

const STATUS_COLORS = {
  PENDING: '#d97706',
  APPROVED: '#16a34a',
  REJECTED: '#dc2626',
  EXPIRED: '#6b7280',
};

const getActionLabel = (item) => {
  switch (item.type) {
    case 'LOGIN': return 'Pokušaj prijave';
    case 'PAYMENT': return item.payload?.toAccount
      ? `Plaćanje ka ${item.payload.toAccount}`
      : 'Plaćanje';
    case 'TRANSFER': return 'Transfer između računa';
    case 'LIMIT_CHANGE': return 'Promena limita računa';
    case 'CARD_REQUEST': return 'Zahtev za karticu';
    default: return item.type;
  }
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function ApprovalsScreen({ navigation }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const intervalRef = useRef(null);

  const fetchApprovals = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getApprovals();
      setApprovals(data);
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
    intervalRef.current = setInterval(() => fetchApprovals(true), POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchApprovals]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApprovals();
  };

  const displayed = showAll
    ? approvals
    : approvals.filter((a) => a.status === 'PENDING');

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ApprovalDetail', { approvalId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardRow}>
        <Text style={styles.cardTitle}>{getActionLabel(item)}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Prikaži sve zahteve</Text>
        <Switch value={showAll} onValueChange={setShowAll} trackColor={{ true: '#1a3c6e' }} />
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={displayed.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Nema aktivnih zahteva</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  filterLabel: { fontSize: 14, color: '#444' },
  list: { padding: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: '#999', fontSize: 15 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 10, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', flex: 1, marginRight: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 12, color: '#888' },
});
