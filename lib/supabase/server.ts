import { cookies } from "next/headers";
import {
  createServerActionClient,
  createServerComponentClient
} from "@supabase/auth-helpers-nextjs";

export const createSupabaseServerComponentClient = () =>
  createServerComponentClient({ cookies });

export const createSupabaseServerActionClient = () =>
  createServerActionClient({ cookies });
