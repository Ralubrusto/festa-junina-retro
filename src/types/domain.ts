export type FeedbackCategory = "positive" | "negative" | "thanks" | "action";

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