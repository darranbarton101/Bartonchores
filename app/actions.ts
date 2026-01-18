"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export async function addToTodayList(
  kidId: string,
  choreId: string,
  date: string
) {
  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase.from("kid_today_list").insert({
    kid_id: kidId,
    chore_id: choreId,
    date
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/kid");
  return { error: null };
}

export async function requestCompletion(
  kidId: string,
  choreId: string,
  date: string
) {
  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase.from("completion_requests").upsert(
    {
      kid_id: kidId,
      chore_id: choreId,
      date,
      status: "pending"
    },
    { onConflict: "kid_id,date,chore_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/kid");
  return { error: null };
}

export async function approveCompletion(requestId: string) {
  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase.rpc("approve_completion_request", {
    request_id: requestId
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/adult");
  return { error: null };
}

export async function denyCompletion(requestId: string) {
  const supabase = createSupabaseServerActionClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("completion_requests")
    .update({
      status: "denied",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id ?? null
    })
    .eq("id", requestId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/adult");
  return { error: null };
}

export async function createPayout(kidId: string, note: string) {
  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase.rpc("create_payout", {
    target_kid_id: kidId,
    note
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/adult");
  return { error: null };
}

export async function createChore(
  title: string,
  valuePence: number
) {
  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase.from("chores").insert({
    title,
    value_pence: valuePence,
    active: true
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/adult");
  return { error: null };
}

export async function updateChore(
  choreId: string,
  title: string,
  valuePence: number,
  active: boolean
) {
  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase
    .from("chores")
    .update({ title, value_pence: valuePence, active })
    .eq("id", choreId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/adult");
  return { error: null };
}

export async function setSchedule(choreId: string, days: number[]) {
  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase.from("chore_schedules").upsert(
    {
      chore_id: choreId,
      days_of_week: days
    },
    { onConflict: "chore_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/adult");
  return { error: null };
}

export async function signOut() {
  const supabase = createSupabaseServerActionClient();
  await supabase.auth.signOut();
  revalidatePath("/");
}
