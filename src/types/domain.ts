export type FeedbackCategory = "positive" | "negative" | "thanks" | "action";

export type AppStep = "entry" | "avatar" | "party";

export type SessionStatus = "open" | "review" | "closed";

export type RetroSession = {
  id: string;
  title: string;
  status: SessionStatus;
};

export type Avatar = {
  outfit: string;
  accessory: string;
  color: string;
};

export type Participant = {
  id: string;
  displayName: string;
  avatar: Avatar;
};

export type FeedbackItem = {
  id: string;
  category: FeedbackCategory;
  text: string;
  authorName: string;
  createdAt: string;
};

export type RetroStation = {
  category: FeedbackCategory;
  title: string;
  description: string;
  cta: string;
};
