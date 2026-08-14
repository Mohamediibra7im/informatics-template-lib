export type Tab = "overview" | "templates" | "contributions" | "liked" | "collections" | "progress" | "settings";

export interface ProgressItem {
  id: number;
  templateId: number;
  templateTitle: string;
  templateSlug: string;
  status: "learning" | "implemented" | "mastered";
  updatedAt: string;
}

export interface UserTemplate {
  id: number;
  templateId: number;
  templateTitle: string;
  templateSlug: string;
  customCode: string;
  language: string;
  updatedAt: string;
}

export interface CollectionMember {
  memberId?: number;
  userId: number;
  username: string;
  email: string;
  role: string;
  addedAt?: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  itemCount: number;
  isOwner?: boolean;
  ownerId?: number;
  ownerUsername?: string;
  memberCount?: number;
}

export interface CollectionItem {
  id: number;
  templateId: number;
  templateTitle: string;
  templateSlug: string;
  addedAt: string;
}

export interface Contribution {
  id: number;
  type: string;
  status: string;
  title: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  templateSlug: string | null;
  templateTitle: string | null;
}

export interface LikedTemplate {
  id: number;
  templateId: number;
  templateTitle: string;
  templateSlug: string;
  categoryName: string | null;
  likedAt: string;
  likeCount: number;
}

export interface Profile {
  id: number;
  userId: number;
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  codeforcesHandle: string | null;
  atcoderHandle: string | null;
  leetcodeHandle: string | null;
  codechefHandle: string | null;
  ratingGoal: string | number | null;
  verificationToken: string;
  isVerified: boolean;
  calendarToken?: string | null;
}

export interface PlatformData {
  active: boolean;
  handle: string;
  rating: number | null;
  maxRating: number | null;
  rank: string | null;
  solved: number | null;
  contests: number | null;
  verified?: boolean;
}

export interface HandlesStats {
  codeforces?: PlatformData;
  atcoder?: PlatformData;
  leetcode?: PlatformData;
  codechef?: PlatformData;
}
