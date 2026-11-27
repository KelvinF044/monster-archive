let pendingWrite: Promise<void> | undefined;

export function queueHistoryWrite(write: () => Promise<void>) {
  pendingWrite = (pendingWrite ?? Promise.resolve()).then(write);
}

export function getPendingHistoryWrites() {
  return pendingWrite;
}
