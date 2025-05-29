// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\utils\chatNotificationStore.ts
import { Timestamp } from 'firebase/firestore';

const SEEN_CHAT_TIMESTAMPS_KEY = 'kinklink_seenChatTimestamps';

interface SeenTimestamps {
  [cardId: string]: string; // ISO string do timestamp
}

function getSeenTimestamps(): SeenTimestamps {
  try {
    const stored = localStorage.getItem(SEEN_CHAT_TIMESTAMPS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error reading seen timestamps from localStorage:", error);
    return {};
  }
}

export function markChatAsSeen(cardId: string, timestamp: Timestamp): void {
  const currentSeen = getSeenTimestamps();
  currentSeen[cardId] = timestamp.toDate().toISOString();
  try {
    localStorage.setItem(SEEN_CHAT_TIMESTAMPS_KEY, JSON.stringify(currentSeen));
  } catch (error) {
    console.error("Error saving seen timestamp to localStorage:", error);
  }
}

export function getLastSeenTimestampForCard(cardId: string): string | null {
  return getSeenTimestamps()[cardId] || null;
}