import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Poll } from '../../types';

function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function PollCard({ poll }: { poll: Poll }) {
  const isExpired = new Date() > new Date(poll.expiresAt);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/poll/${poll.pollId}`)}
    >
      <View style={styles.header}>
        <Text style={styles.author}>@{poll.authorName}</Text>
        <Text style={styles.time}>
          {poll.createdAt ? timeAgo(new Date(poll.createdAt)) : ''}
        </Text>
      </View>

      <Text style={styles.question}>{poll.question}</Text>

      <View style={styles.footer}>
        <Text style={styles.votes}>{poll.totalVotes} votes</Text>
        {isExpired ? (
          <Text style={styles.expired}>Expired</Text>
        ) : (
          <Text style={styles.active}>Active</Text>
        )}
      </View>

      {/* Preview options */}
      <View style={styles.optionsPreview}>
        {poll.options.slice(0, 2).map((option, index) => (
          <View key={index} style={styles.optionChip}>
            <Text style={styles.optionText} numberOfLines={1}>
              {option}
            </Text>
          </View>
        ))}
        {poll.options.length > 2 && (
          <View style={styles.optionChip}>
            <Text style={styles.optionText}>+{poll.options.length - 2}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  author: { color: '#71717a', fontSize: 13 },
  time: { color: '#52525b', fontSize: 13 },
  question: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  votes: { color: '#71717a', fontSize: 13 },
  active: { color: '#22c55e', fontSize: 13 },
  expired: { color: '#ef4444', fontSize: 13 },
  optionsPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 120,
  },
  optionText: { color: '#a1a1aa', fontSize: 12 },
});