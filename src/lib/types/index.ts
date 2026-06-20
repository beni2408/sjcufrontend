export interface MemberSeo {
  metaTitle?:         string;
  metaDescription?:   string;
  ogTitle?:           string;
  ogDescription?:     string;
  ogImage?:           string;
  primaryKeywords?:   string[];
  secondaryKeywords?: string[];
}

export interface Member {
  _id: string;
  name: string;
  photo: string;
  position: string;
  teamCategory: ('Leadership' | 'Choir Member' | 'Media Team')[];
  gender: 'Male' | 'Female';
  description: string;
  socialLinks: { instagram?: string; facebook?: string; twitter?: string; youtube?: string };
  order: number;
  slug?: string;
  seo?: MemberSeo;
  createdAt: string;
}

export interface Production {
  _id: string;
  title: string;
  youtubeLink: string;
  thumbnail: string;
  description: string;
  releaseDate: string;
  category: 'General Songs' | 'Special Songs' | 'Christmas Songs' | 'Church Dedication Songs' | 'Wedding Songs' | 'Lent Days Song';
  featured: boolean;
  hidden: boolean;
  createdAt: string;
}

export interface Event {
  _id: string;
  title: string;
  date: string;
  time?: string;
  description: string;
  venue: string;
  bannerImage: string;
  gallery: string[];
  featured: boolean;
  createdAt: string;
}

export interface GalleryItem {
  _id: string;
  type: 'image' | 'video';
  image: string;
  videoUrl: string;
  category: 'Productions' | 'Events' | 'Choir Practice' | 'Behind The Scenes' | 'Team Moments';
  caption: string;
  order: number;
  createdAt: string;
}

export interface Testimonial {
  _id: string;
  name: string;
  email: string;
  photo: string;
  designation: string;
  message: string;
  rating: number;
  featured: boolean;
  status: 'pending' | 'approved';
  createdAt: string;
}

export interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'Pending' | 'Contacted' | 'Completed';
  createdAt: string;
}

export interface Settings {
  _id: string;
  logo: string;
  email: string;
  phone: string;
  address: string;
  socialLinks: { instagram?: string; facebook?: string; youtube?: string; twitter?: string };
  footerText: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  dob?: string;
  gender?: 'male' | 'female' | 'other' | '';
  avatar?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface GalleryMediaItem {
  url: string;
  type: 'image' | 'video';
}

export interface MemorableEvent {
  _id: string;
  name: string;
  description: string;
  date: string;
  venue: string;
  coverImage: string;
  gallery: (GalleryMediaItem | string)[];
  youtubeLink: string;
  order: number;
  createdAt: string;
}

export interface Partner {
  _id: string;
  name: string;
  logo: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  order: number;
  createdAt: string;
}

export interface Contact {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface StageInfo {
  description: string;
  images: string[];
  completedAt?: string;
}

export interface UpcomingProject {
  _id: string;
  name: string;
  featureImage: string;
  description: string;
  currentStage: 'discussion' | 'pre_production' | 'audio_recording' | 'video_recording' | 'post_production' | 'released';
  discussion: StageInfo;
  pre_production: StageInfo;
  audio_recording: StageInfo;
  video_recording: StageInfo;
  post_production: StageInfo;
  released: StageInfo;
  order: number;
  createdAt: string;
}

export interface Audition {
  _id: string;
  auditionId: string;
  title: string;
  featureImage: string;
  description: string;
  date: string;
  venue: string;
  applicationStart: string;
  applicationEnd: string;
  minAge: number;
  maxAge: number;
  status: 'active' | 'closed';
  isOpen: boolean;
  order: number;
  createdAt: string;
}

export interface AuditionApplication {
  _id: string;
  audition: string | { _id: string; title: string; auditionId: string };
  applicationId: string;
  name: string;
  mobile: string;
  age: number;
  dob: string;
  fatherName: string;
  motherName: string;
  email: string;
  photo: string;
  termsAccepted: boolean;
  status: 'Pending' | 'Shortlisted' | 'Rejected' | 'Selected';
  createdAt: string;
}
