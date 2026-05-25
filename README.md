# VibeCheck 🗳️

> Real-time social polling — create polls, vote instantly, watch live results update for everyone simultaneously.

![React Native](https://img.shields.io/badge/React_Native-Expo-blue?logo=expo)
![Firebase](https://img.shields.io/badge/Backend-Firebase-orange?logo=firebase)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-green)

---

## What is VibeCheck?

VibeCheck is a real-time social polling app where users post quick questions, friends vote, and everyone sees live percentage results. Think Twitter polls meets Reddit voting — fast, visual, and addictive.

**Core loop:**
1. Sign up with email or Google
2. Create a poll with 2-4 options
3. Share with friends — they vote in one tap
4. Watch live results animate in real time for all viewers simultaneously

---

## Features

- 🔐 **Authentication** — Email/password + Google OAuth sign-in
- 📊 **Create Polls** — 2-4 options, custom duration (30 mins / 2 hours / 1 day)
- ✅ **Multiple Choice** — Toggle to allow voters to select more than one option
- 🔄 **Change Your Vote** — Tap another option anytime while the poll is live
- 📡 **Live Results** — Real-time vote counts via Firestore listeners — no refresh needed
- 🎬 **Animated Vote Bars** — Spring physics animations on every vote
- 🌊 **Splash Screen** — Animated logo pulse on app launch
- 📱 **Trending Feed** — Home feed ordered by most votes
- 👤 **Profile Screen** — Your polls, total votes received, stats
- ⏱️ **Poll Expiry** — Polls auto-lock after the chosen duration
- 🔒 **Security Rules** — Server-side Firestore rules block double voting, impersonation, and data tampering

---

## Tech Stack

### Frontend
| Package | Purpose |
|---------|---------|
| Expo SDK 56 | Managed workflow — iOS and Android from one codebase |
| React Native | Core mobile UI framework |
| expo-router | File-based navigation |
| react-native-reanimated | Spring animations for vote bars |
| NativeWind | Tailwind utility classes for React Native |
| Zod | Schema validation before every Firestore write |
| TanStack Query | Server state and caching |

### Backend
| Service | Purpose |
|---------|---------|
| Firebase Auth | Email/password + Google OAuth |
| Firestore | Real-time polls, votes, user profiles |
| Firestore Security Rules | Server-side authorization — no custom backend needed |
| Expo EAS Build | Cloud APK builds — no Android Studio needed |

---

## Architecture Highlights

### Double-vote prevention
Votes are stored as sub-documents keyed by the voter's UID. Firestore rules enforce that the document ID must match the authenticated user UID — making double voting impossible at the database layer with zero backend code.

### Race condition safety
All vote counts use Firestore's atomic `increment()` operator. When 15 friends vote simultaneously, every vote is counted exactly once regardless of concurrent writes.

### No custom backend
Firebase Security Rules run on Google's servers and cannot be bypassed even with direct REST API calls. The entire authorization layer is configuration, not code.

---

## Project Structure

```
vibecheck/
  app/
    (auth)/
      login.tsx          # Login screen
      signup.tsx         # Signup screen
    (tabs)/
      index.tsx          # Home feed
      create.tsx         # Create poll
      profile.tsx        # User profile
    poll/[id].tsx        # Poll detail + voting
    _layout.tsx          # Root layout with auth guard + splash
    splash.tsx           # Animated splash screen
  components/
    polls/PollCard.tsx   # Poll preview card
  hooks/
    useAuth.ts           # Auth state hook
  lib/
    firebase.ts          # Firebase singleton init
    firestore.ts         # All Firestore CRUD functions
    validation.ts        # Zod schemas
  types/index.ts         # TypeScript interfaces
  firestore.rules        # Deployed security rules
  .env.local             # Firebase config keys — never committed
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- Expo Go app on your phone (for development)
- Firebase project (free Spark plan)

### Installation

```bash
git clone https://github.com/Prrashanthpkp/Vibecheck-test-app-.git
cd Vibecheck-test-app-
npm install
```

### Environment Setup

Create a `.env.local` file in the root:

```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Run the app

```bash
# Web browser
npx expo start --web

# Android (requires Expo Go or emulator)
npx expo start

# Build Android APK
eas build --platform android --profile preview
```

### Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

---

## Security

- Firebase config keys stored in `.env.local` — never committed to Git
- Firestore rules enforce auth, ownership, and vote integrity server-side
- Input validation with Zod before every database write
- Generic error messages — never reveals which field failed
- Email stored only in Firebase Auth — never written to Firestore

---

## Firebase Free Tier Usage

| Resource | Free Quota | Estimated Usage (15 users) |
|----------|-----------|---------------------------|
| Firestore reads | 50,000/day | ~5,000/day |
| Firestore writes | 20,000/day | ~500/day |
| Auth users | Unlimited | 15 users |
| Storage | 1 GB | Under 1 MB |

---

## Roadmap

- [ ] Push notifications when someone votes on your poll
- [ ] Share poll via deep link
- [ ] Poll categories and tags
- [ ] Anonymous voting option
- [ ] Comment on polls
- [ ] Play Store / App Store release

---

## License

MIT

---

*Built with React Native + Expo + Firebase | May 2026*
