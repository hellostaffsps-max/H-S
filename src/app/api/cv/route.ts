import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path");
    if (!path) {
      return new NextResponse("Missing path parameter", { status: 400 });
    }

    const supabase = createClient();
    
    // Require authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Generate a signed URL valid for 1 hour (3600 seconds)
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(path, 3600);

    if (error || !data?.signedUrl) {
      console.error("Error generating signed URL for CV:", error);
      return new NextResponse("Failed to generate secure CV URL", { status: 500 });
    }

    // Redirect the user to the temporary secure URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("CV access error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
