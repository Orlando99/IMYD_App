import { getStoreState } from './store';
import { getMomentFromTimestamp } from './index';

export function getThreads() {
  const storeState = getStoreState();
  return storeState.threads || false;
}

export function countTotalUnread(threads) {
  threads = threads || getThreads() || [];
  let totalUnread = 0;
  threads.forEach((thread) => {
    totalUnread += thread.unreadCount;
  });
  return totalUnread;
}

export function sortThreads(a, b) {
  let aTime = getMomentFromTimestamp(a.lastMessage.timestamp || a.createdAt || new Date());
  let bTime = getMomentFromTimestamp(b.lastMessage.timestamp || b.createdAt || new Date());
  if (aTime.diff(bTime) < 0) {
    return 1;
  }
  else if (aTime.diff(bTime) > 0) {
    return -1;
  }
  return 0;
}