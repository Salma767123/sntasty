import { NextResponse } from "next/server";
import { getCustomersWithStats, getCustomerByPhone } from "@/lib/admin-data";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (phone) {
      const customer = await getCustomerByPhone(phone);
      if (!customer) return NextResponse.json(null);
      return NextResponse.json(customer);
    }

    // Get all customers (and standard users)
    const customersWithStats = await getCustomersWithStats();
    return NextResponse.json(customersWithStats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
