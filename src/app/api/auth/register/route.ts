import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { name, email, password, phone } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
        }

        await connectDB();

        const userExists = await User.findOne({ email });
        if (userExists) {
            return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role: "customer", // Default role
        });

        return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
