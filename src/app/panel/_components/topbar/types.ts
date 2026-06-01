export interface UserTopbarUser {
  name?: string | null;
  image?: string | null;
  email?: string | null;
}

export interface UserTopbarProps {
  user?: UserTopbarUser;
}

export const getInitials = (name?: string | null) => {
  if (!name) return "UC";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
