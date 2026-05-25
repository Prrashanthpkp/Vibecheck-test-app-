import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Poll, Vote } from '../types';

// ─── CREATE POLL ────────────────────────────────────────────────
export async function createPoll(
  authorUid: string,
  authorName: string,
  question: string,
  options: string[],
  durationMinutes: number,
  allowMultiple: boolean = false
): Promise<string> {
  const pollRef = doc(collection(db, 'polls'));

  await setDoc(pollRef, {
    pollId: pollRef.id,
    authorUid,
    authorName,
    question,
    options,
    voteCounts: new Array(options.length).fill(0),
    totalVotes: 0,
    allowMultiple,
    status: 'active',
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(
      new Date(Date.now() + durationMinutes * 60 * 1000)
    ),
  });

  return pollRef.id;
}

// ─── CAST VOTE (supports vote change) ───────────────────────────
// ─── CAST VOTE (supports single + multiple choice + vote change) ──
export async function castVote(
  pollId: string,
  optionIndex: number,
  voterUid: string,
  previousVoteIndex: number | null = null,
  allowMultiple: boolean = false
): Promise<void> {
  const voteRef = doc(db, 'polls', pollId, 'votes', voterUid);
  const pollRef = doc(db, 'polls', pollId);

  if (allowMultiple) {
    // Get existing vote doc to see what's already selected
    const existingSnap = await getDoc(voteRef);
    const existingOptions: number[] = existingSnap.exists()
      ? existingSnap.data().selectedOptions || []
      : [];

    const alreadySelected = existingOptions.includes(optionIndex);
    let newOptions: number[];

    if (alreadySelected) {
      // Deselect — remove from array
      newOptions = existingOptions.filter((i) => i !== optionIndex);
      await updateDoc(pollRef, {
        [`voteCounts.${optionIndex}`]: increment(-1),
        // Only reduce totalVotes if no options remain selected
        ...(newOptions.length === 0 && { totalVotes: increment(-1) }),
      });
    } else {
      // Select — add to array
      newOptions = [...existingOptions, optionIndex];
      await updateDoc(pollRef, {
        [`voteCounts.${optionIndex}`]: increment(1),
        // Only increment totalVotes on first selection
        ...(existingOptions.length === 0 && { totalVotes: increment(1) }),
      });
    }

    // Save updated selections
    await setDoc(voteRef, {
      selectedOptions: newOptions,
      votedAt: serverTimestamp(),
    });

  } else {
    // Single choice
    await setDoc(voteRef, {
      optionIndex,
      votedAt: serverTimestamp(),
    });

    if (previousVoteIndex !== null && previousVoteIndex !== optionIndex) {
      // Moving vote from one option to another
      await updateDoc(pollRef, {
        [`voteCounts.${previousVoteIndex}`]: increment(-1),
        [`voteCounts.${optionIndex}`]: increment(1),
      });
    } else if (previousVoteIndex === null) {
      // First time voting
      await updateDoc(pollRef, {
        totalVotes: increment(1),
        [`voteCounts.${optionIndex}`]: increment(1),
      });
    }
  }
}
// ─── CHECK IF USER ALREADY VOTED ────────────────────────────────
export async function getUserVote(
  pollId: string,
  voterUid: string
): Promise<number | null> {
  const voteRef = doc(db, 'polls', pollId, 'votes', voterUid);
  const voteSnap = await getDoc(voteRef);

  if (voteSnap.exists()) {
    return (voteSnap.data() as Vote).optionIndex;
  }
  return null;
}

// ─── REAL-TIME POLL LISTENER ─────────────────────────────────────
export function subscribeToPoll(
  pollId: string,
  callback: (poll: Poll | null) => void
): () => void {
  const pollRef = doc(db, 'polls', pollId);

  return onSnapshot(pollRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({
        ...data,
        pollId: snap.id,
        createdAt: data.createdAt?.toDate(),
        expiresAt: data.expiresAt?.toDate(),
      } as Poll);
    } else {
      callback(null);
    }
  });
}

// ─── FEED: GET ALL POLLS ─────────────────────────────────────────
export function subscribeToPollFeed(
  callback: (polls: Poll[]) => void
): () => void {
  const q = query(
    collection(db, 'polls'),
    orderBy('totalVotes', 'desc'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snap) => {
    const polls = snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        pollId: d.id,
        createdAt: data.createdAt?.toDate(),
        expiresAt: data.expiresAt?.toDate(),
      } as Poll;
    });
    callback(polls);
  });
}