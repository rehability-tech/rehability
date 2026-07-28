import { redirect } from "next/navigation";

export default function AdminCampLiveEditor() {
  redirect("/admin/wydarzenia/dodaj/dane-podstawowe");
  return null;
}
