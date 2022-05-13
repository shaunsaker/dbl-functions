import { LotId } from '../lots/models';

export type UserId = string;

export type Username = string;

export interface UserWinning {
  link: string;
  hasSeenLink: boolean;
}
export interface UserWinnings {
  [key: LotId]: UserWinning;
}

export interface UserTestimonial {
  dateCreated: string;
  testimonial: string;
}

export interface UserTestimonials {
  [key: LotId]: UserTestimonial;
}

export interface UserProfileData {
  dateCreated: string;
  username: Username;
  email: string;
  winnings?: UserWinnings;
  testimonials?: UserTestimonials;
}

export interface UserProfileState {
  data: UserProfileData | undefined;
  loading: boolean;
}
