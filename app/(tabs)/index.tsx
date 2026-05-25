import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { subscribeToPollFeed } from '../../lib/firestore';
import { Poll } from '../../types';
import PollCard from '../../components/polls/PollCard';
export default function HomeScreen() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Real-time listener — feed updates automatically
    const unsubscribe = subscribeToPollFeed((data) => {
      setPolls(data);
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  }, []);

  async function handleLogout() {
    await signOut(auth);
  }

  function handleRefresh() {
    setRefreshing(true);
    // Firestore listener handles the refresh automatically
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>VibeCheck</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        data={polls}
        keyExtractor={(item) => item.pollId}
        renderItem={({ item }) => <PollCard poll={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No polls yet</Text>
            <Text style={styles.emptySubtext}>
              Create the first poll!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  centered: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  logout: { color: '#71717a', fontSize: 14 },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { color: '#71717a', fontSize: 14 },
});