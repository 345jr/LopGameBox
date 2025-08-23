export interface UserData {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}
export interface UpdateInfo {
  update: boolean;
  message: string;
  latest: string;
}
export interface VersionInfo {
  id: number;
  version: string;
  release_date: string;
  notes: string;
}
