type StorageFailure = { message: string; status?: number; statusCode?: string; code?: string };

export function coverStorageResult(error: StorageFailure) {
  const status = error.statusCode || String(error.status ?? "");
  const code = error.code ?? "";
  const message = error.message.toLowerCase();
  const duplicate = /^(keyalreadyexists|resourcealreadyexists|alreadyexists)$/i.test(code) || /already exists|duplicate/.test(message);
  if (duplicate && (["400", "409", "Duplicate", "KeyAlreadyExists", "ResourceAlreadyExists"].includes(status) || error.status === 409)) return "existing";
  if (/^(nosuchbucket|bucketnotfound)$/i.test(code || status) || /bucket (not found|does not exist)/.test(message)) return "cover_bucket_missing";
  if (["401", "403"].includes(status) || [401, 403].includes(error.status ?? 0) || /row.level security|permission denied|unauthorized/i.test(message)) {
    return "cover_storage_access";
  }
  if (status === "404" || error.status === 404) return "cover_storage_not_found";
  return "cover_storage";
}
