import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { Poll } from '../../types';
import PollCard from '../../components/polls/PollCard';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Real-time listener for user's own polls
    const q = query(
      collection(db, 'polls'),
      where('authorUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const poll = d.data();
        return {
          ...poll,
          pollId: d.id,
          createdAt: poll.createdAt?.toDate(),
          expiresAt: poll.expiresAt?.toDate(),
        } as Poll;
      });
      setPolls(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  async function handleLogout() {
    await signOut(auth);
  }

  const totalVotes = polls.reduce((sum, poll) => sum + poll.totalVotes, 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={polls}
        keyExtractor={(item) => item.pollId}
        renderItem={({ item }) => <PollCard poll={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {/* Profile Header */}
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <Text style={styles.displayName}>{user?.displayName}</Text>
              <Text style={styles.email}>{user?.email}</Text>

              {/* Stats */}
              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{polls.length}</Text>
                  <Text style={styles.statLabel}>Polls</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{totalVotes}</Text>
                  <Text style={styles.statLabel}>Total Votes</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Your Polls</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No polls yet</Text>
            <Text style={styles.emptySubtext}>Create your first poll!</Text>
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
  list: { padding: 16 },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  displayName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: { color: '#71717a', fontSize: 14, marginBottom: 24 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statItem: { alignItems: 'center', paddingHorizontal: 32 },
  statNumber: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#71717a', fontSize: 13, marginTop: 4 },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#27272a',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  logoutText: { color: '#ef4444', fontSize: 15 },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { color: '#71717a', fontSize: 14 },
});