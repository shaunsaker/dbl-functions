export interface FirebaseFunctionResponse<T> {
  error: boolean;
  message: string;
  data?: T | undefined;
}
