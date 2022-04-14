export type UserId = string;

export type Username = string;

export interface UserProfileData {
  dateCreated: string;
  username: Username;
  email: string;
  hasCompletedOnboarding: boolean;
}
