export type User = {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  access_token?: string;
}

export type NewUser = {
  username: string;
  firstname?: string;
  lastname?: string;
  newPassword: string;
}
