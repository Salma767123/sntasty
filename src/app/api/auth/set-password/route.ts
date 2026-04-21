import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Set the password securely on the server using Better Auth
    await auth.api.setPassword({
      body: {
        newPassword: password,
      },
      headers: await headers(),
    });

    return NextResponse.json(
      { message: "Password set successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error setting password:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
