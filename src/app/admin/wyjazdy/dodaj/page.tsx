import { redirect } from "next/navigation";

export default function AdminCampLiveEditor() {
  redirect("/admin/wyjazdy/dodaj/dane-podstawowe");
  return null;
}
