import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("savedAddresses");
    return NextResponse.json(user?.savedAddresses || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { label, fullName, email, phone, street, city, pincode, state, isDefault } = body;

    if (!fullName || !phone || !street || !city || !pincode || !state) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    // Ensure savedAddresses array exists on the user document
    await User.findByIdAndUpdate(
      session.user.id,
      { $setOnInsert: { savedAddresses: [] } },
      { upsert: false },
    );
    // Initialize if missing (for users created before this field existed)
    await User.updateOne(
      { _id: session.user.id, savedAddresses: { $exists: false } },
      { $set: { savedAddresses: [] } },
    );

    // If this is set as default, unset all others first
    if (isDefault) {
      const user = await User.findById(session.user.id);
      if (user?.savedAddresses && user.savedAddresses.length > 0) {
        await User.findByIdAndUpdate(session.user.id, {
          $set: { "savedAddresses.$[].isDefault": false },
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        $push: {
          savedAddresses: {
            label: label || "Home",
            fullName,
            email: email || "",
            phone,
            street,
            city,
            pincode,
            state,
            isDefault: isDefault || false,
          },
        },
      },
      { new: true },
    );

    return NextResponse.json(user?.savedAddresses || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, label, fullName, email, phone, street, city, pincode, state } = body;

    if (!id || !fullName || !phone || !street || !city || !pincode || !state) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOneAndUpdate(
      { _id: session.user.id, "savedAddresses._id": id },
      {
        $set: {
          "savedAddresses.$.label": label || "Home",
          "savedAddresses.$.fullName": fullName,
          "savedAddresses.$.email": email || "",
          "savedAddresses.$.phone": phone,
          "savedAddresses.$.street": street,
          "savedAddresses.$.city": city,
          "savedAddresses.$.pincode": pincode,
          "savedAddresses.$.state": state,
        },
      },
      { new: true },
    );

    return NextResponse.json(user?.savedAddresses || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get("id");
    if (!addressId) {
      return NextResponse.json({ error: "Address ID required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $pull: { savedAddresses: { _id: addressId } } },
      { new: true },
    );

    return NextResponse.json(user?.savedAddresses || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
