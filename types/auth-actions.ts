export interface AuthActionState {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Partial<Record<"fullName" | "email" | "password" | "avatarUrl", string>>;
}

export const initialAuthState: AuthActionState = {
  status: "idle",
  message: "",
};
