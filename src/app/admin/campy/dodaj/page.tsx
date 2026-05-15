import { redirect } from "next/navigation";

export default function AdminCampLiveEditor() {
  redirect("/admin/campy/dodaj/dane-podstawowe");
  return null;
}
