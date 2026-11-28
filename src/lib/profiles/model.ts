export const themeStyles = {
  violet: "from-[#43217c] via-[#26163e] to-[#0f0b16]",
  rose: "from-[#6c214b] via-[#35142d] to-[#160d18]",
  midnight: "from-[#234875] via-[#192945] to-[#0c121e]",
};

export type Theme = keyof typeof themeStyles;

export type Profile = {
  handle: string;
  display_name: string;
  bio: string;
  avatar_member_id: string | null;
  bias_member_id: string | null;
  favorite_era_id: string | null;
  theme: Theme;
  is_public: boolean;
};

export type Sharing = {
  share_favorites: boolean;
  share_history: boolean;
};

export function validHandle(handle: string) {
  return /^[a-z0-9][a-z0-9_]{2,23}$/.test(handle);
}
