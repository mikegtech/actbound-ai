export interface User {
  id: number | string;
  name: string;
  email: string;
  avatar: null | string;
  type?: string;
  designation?: string;
}

export interface LoginResponse {
  authToken: string;
  user: User;
}

export interface RegisterResponse {
  authToken: string;
  user: User;
}

export interface SetPasswordResponse {
  data: { message: string };
}
