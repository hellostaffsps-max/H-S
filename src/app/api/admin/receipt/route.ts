import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path");
    if (!path) {
      return new NextResponse("Missing path parameter", { status: 400 });
    }

    const supabase = createClient();

    // Generate a signed URL valid for 1 hour (3600 seconds)
    const { data, error } = await supabase.storage
      .from("payment_receipts")
      .createSignedUrl(path, 3600);

    if (error || !data?.signedUrl) {
      console.error("Error generating signed URL:", error);
      return new NextResponse("Failed to generate secure receipt URL", { status: 500 });
    }

    // Redirect the user to the temporary secure URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("Receipt error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
