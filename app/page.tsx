import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createSupabaseServerComponentClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "adult") {
    redirect("/adult");
  }

  redirect("/kid");
}
