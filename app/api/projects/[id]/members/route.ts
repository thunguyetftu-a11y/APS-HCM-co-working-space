import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userClient = await createUserClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

    const { data: membership } = await userClient.from("project_members")
      .select("can_edit").eq("project_id", params.id).eq("user_id", user.id).maybeSingle();
    if (!membership?.can_edit) return NextResponse.json({ error: "Only project admins can add members." }, { status: 403 });

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "Server setup is incomplete. Add SUPABASE_SERVICE_ROLE_KEY to Vercel Project Environment Variables." }, { status: 500 });
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: profile } = await admin.from("profiles").select("id,display_name,email").ilike("email", email).maybeSingle();
    let memberId = profile?.id as string | undefined;
    let invited = false;

    if (!memberId) {
      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: new URL("/login", request.url).toString(),
        data: { invited_to_project: params.id }
      });
      if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });
      memberId = inviteData.user?.id;
      invited = true;
      if (!memberId) return NextResponse.json({ error: "Supabase did not return the invited user." }, { status: 500 });
      await admin.from("profiles").upsert({ id: memberId, email, display_name: email.split("@")[0] }, { onConflict: "id" });
    }

    const { error: memberError } = await admin.from("project_members").upsert({
      project_id: params.id, user_id: memberId, role: "viewer",
      can_view: true, can_create: false, can_edit: false
    }, { onConflict: "project_id,user_id" });
    if (memberError) return NextResponse.json({ error: memberError.message }, { status: 400 });

    await admin.from("notifications").insert({
      user_id: memberId, project_id: params.id, actor_id: user.id,
      kind: invited ? "project_invite" : "project_added",
      message: invited ? "You have been invited to a project. Accept the email invitation to create your account." : "You have been added to a project."
    });
    return NextResponse.json({ ok: true, invited, email, userId: memberId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not add member." }, { status: 500 });
  }
}
