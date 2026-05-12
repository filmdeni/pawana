"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AuthResult = { error: string } | { success: true };

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/";

  if (!email || !password) return { error: "กรุณากรอกข้อมูลให้ครบ" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Invalid login")) return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    if (error.message.includes("Email not confirmed")) return { error: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ" };
    return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  if (!email || !password || !username) return { error: "กรุณากรอกข้อมูลให้ครบ" };
  if (username.length < 3) return { error: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร" };
  if (password.length < 8) return { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" };

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: username },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
    return { error: "เกิดข้อผิดพลาด: " + error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getSessionUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export type UpdateProfileResult = { error: string } | { success: true; avatarUrl?: string };

export async function updateProfileAction(formData: FormData): Promise<UpdateProfileResult> {
  const display_name = (formData.get("display_name") as string)?.trim();
  const avatarFile = formData.get("avatar") as File | null;

  if (!display_name) return { error: "กรุณากรอกชื่อที่แสดง" };
  if (display_name.length > 50) return { error: "ชื่อที่แสดงต้องไม่เกิน 50 ตัวอักษร" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  let avatar_url: string | undefined;

  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > 2 * 1024 * 1024) return { error: "รูปต้องไม่เกิน 2MB" };
    const ext = avatarFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
    if (uploadError) return { error: "อัปโหลดรูปไม่สำเร็จ" };
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    avatar_url = publicUrl + `?t=${Date.now()}`;
  }

  const update: Record<string, string> = { display_name };
  if (avatar_url) update.avatar_url = avatar_url;

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  revalidatePath("/profile");
  return { success: true, avatarUrl: avatar_url };
}
