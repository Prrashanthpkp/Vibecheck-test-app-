import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { subscribeToPoll, castVote, getUserVote } from '../../lib/firestore';
import { db } from '../../lib/firebase';
import { Poll } from '../../types';

function AnimatedVoteBar({ percentage }: { percentage: number }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(width, {
      toValue: percentage,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [percentage]);

  return (
    <Animated.View
      style={[
        styles.voteBar,
        {
          width: width.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        },
      ]}
    />
  );
}

export default function PollScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const voteScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToPoll(id, (pollData) => {
      setPoll(pollData);
      setLoading(false);
    });
    return unsubscribe;
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;

    // Load single choice vote
    getUserVote(id, user.uid).then((vote) => {
      setUserVote(vote);
    });

    // Load multiple choice selections
    const voteRef = doc(db, 'polls', id, 'votes', user.uid);
    getDoc(voteRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.selectedOptions) {
          setSelectedOptions(data.selectedOptions);
        }
      }
    });
  }, [id, user]);

  function animateVote(callback: () => void) {
    Animated.sequence([
      Animated.spring(voteScale, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 5,
      }),
      Animated.spring(voteScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 5,
      }),
    ]).start(callback);
  }

  async function handleVote(optionIndex: number) {
    if (!user || !poll || voting) return;

    const isExpired = new Date() > new Date(poll.expiresAt);
    if (isExpired) return;

    // Single choice — ignore tap on same option
    if (!poll.allowMultiple && userVote === optionIndex) return;

    setVoting(true);
    setError('');

    animateVote(async () => {
      try {
        await castVote(
          poll.pollId,
          optionIndex,
          user.uid,
          poll.allowMultiple ? null : userVote,
          poll.allowMultiple
        );

        if (poll.allowMultiple) {
          // Toggle selection on/off
          setSelectedOptions((prev) =>
            prev.includes(optionIndex)
              ? prev.filter((i) => i !== optionIndex)
              : [...prev, optionIndex]
          );
        } else {
          setUserVote(optionIndex);
        }
      } catch (err) {
        setError('Failed to cast vote. Please try again.');
      } finally {
        setVoting(false);
      }
    });
  }

  function getPercentage(optionIndex: number): number {
    if (!poll || poll.totalVotes === 0) return 0;
    const counts = poll.voteCounts;
    const count = Array.isArray(counts)
      ? counts[optionIndex] || 0
      : (counts as any)[String(optionIndex)] || 0;
    return Math.round((count / poll.totalVotes) * 100);
  }

  function getTimeLeft(): string {
    if (!poll) return '';
    const diff = new Date(poll.expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m left`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h left`;
    return `${Math.floor(hours / 24)}d left`;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  if (!poll) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Poll not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isExpired = poll.status === 'expired' || new Date() > new Date(poll.expiresAt);

  // Compute hasVoted based on poll type
  const hasVoted = poll.allowMultiple
    ? selectedOptions.length > 0
    : userVote !== null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.pollHeader}>
        <Text style={styles.author}>@{poll.authorName}</Text>
        <Text style={[styles.timeLeft, isExpired && styles.expired]}>
          {getTimeLeft()}
        </Text>
      </View>

      <Text style={styles.question}>{poll.question}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.voteCount}>{poll.totalVotes} votes</Text>
        {poll.allowMultiple && (
          <Text style={styles.multipleTag}>Multiple choice</Text>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Animated.View style={{ transform: [{ scale: voteScale }] }}>
        {poll.options.map((option, index) => {
          const percentage = getPercentage(index);

          // Correct selection check per poll type
          const isSelected = poll.allowMultiple
            ? selectedOptions.includes(index)
            : userVote === index;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                isSelected && styles.optionSelected,
              ]}
              onPress={() => handleVote(index)}
              disabled={isExpired || voting}
              activeOpacity={0.8}
            >
              {hasVoted && <AnimatedVoteBar percentage={percentage} />}

              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  {/* Square checkbox for multiple, circle for single */}
                  <View style={[
                    poll.allowMultiple ? styles.optionCheckbox : styles.optionDot,
                    isSelected && styles.optionDotSelected,
                  ]}>
                    {poll.allowMultiple && isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}>
                    {option}
                  </Text>
                </View>
                {hasVoted && (
                  <Text style={styles.percentage}>{percentage}%</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {isExpired && (
        <Text style={styles.expiredText}>This poll has expired</Text>
      )}

      {hasVoted && !isExpired && (
        <Text style={styles.votedText}>
          {poll.allowMultiple
            ? '✓ Tap options to select or deselect'
            : '✓ Tap another option to change your vote'}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  inner: { padding: 24, paddingTop: 60 },
  centered: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center' },
  backButton: { marginBottom: 24 },
  backLink: { color: '#6366f1', fontSize: 16 },
  pollHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  author: { color: '#71717a', fontSize: 14 },
  timeLeft: { color: '#22c55e', fontSize: 13, fontWeight: '600' },
  expired: { color: '#ef4444' },
  question: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8, lineHeight: 32 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  voteCount: { color: '#71717a', fontSize: 14 },
  multipleTag: { backgroundColor: '#1e1b4b', color: '#818cf8', fontSize: 12, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  optionButton: { borderWidth: 1, borderColor: '#27272a', borderRadius: 12, marginBottom: 12, overflow: 'hidden', position: 'relative', minHeight: 56 },
  optionSelected: { borderColor: '#6366f1' },
  voteBar: { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: '#1e1b4b' },
  optionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  optionDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#52525b' },
  optionCheckbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#52525b', justifyContent: 'center', alignItems: 'center' },
  optionDotSelected: { borderColor: '#6366f1', backgroundColor: '#6366f1' },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  optionText: { color: '#fff', fontSize: 16, flex: 1 },
  optionTextSelected: { color: '#818cf8', fontWeight: '600' },
  percentage: { color: '#a1a1aa', fontSize: 14, fontWeight: '600' },
  expiredText: { color: '#ef4444', textAlign: 'center', marginTop: 16 },
  votedText: { color: '#71717a', textAlign: 'center', marginTop: 16, fontSize: 13 },
  errorText: { color: '#ef4444', textAlign: 'center', marginBottom: 16 },
});