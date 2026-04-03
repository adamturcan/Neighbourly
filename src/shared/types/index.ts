export type User = {
  id: string;
  name: string;
  photoUrl?: string;
  skills: string[];
  rating: number;
  jobsDone: number;
  lat: number;
  lng: number;
};

export type Service = {
  id: string;
  providerId: string;
  title: string;
  categories: string[];
  photoUrl: string;
  priceFrom: number;
  lat: number;
  lng: number;
  rating: number;
  jobsDone: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  photos?: string[];
  status: 'open' | 'matched' | 'in_progress' | 'disputed' | 'completed';
  requesterId: string;
  helperId?: string;
  lat: number;
  lng: number;
  when: string;
  createdAt: string;
  categories?: string[];
  image?: string;
};

export type Offer = {
  id: string;
  taskId: string;
  helperId: string;
  amount: number;
  message?: string;
  createdAt: string;
};

export type Review = {
  id: string;
  taskId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewerName?: string;
  reviewerAvatarUrl?: string;
  taskTitle?: string;
};

export type SavedAddress = {
  id: string;
  label: string;
  line1: string;
  city?: string;
  note?: string;
};
