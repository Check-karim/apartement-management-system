import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { User, CreateUserData } from "@/types";

// GET /api/users/managers - Get all managers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const managers = await executeQuery<User>(
      "SELECT id, username, role, full_name, email, phone, is_active, created_at, updated_at FROM users WHERE role = 'manager' ORDER BY created_at DESC"
    );

    return NextResponse.json({
      success: true,
      data: managers,
    });
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/users/managers - Create new manager
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: CreateUserData = await request.json();
    const { username, password, full_name, email, phone } = body;

    // Validate required fields
    if (!username || !password || !full_name || !email) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existingUser = await executeQuery(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: "Username or email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert new manager
    const result = await executeQuery(
      "INSERT INTO users (username, password, role, full_name, email, phone) VALUES (?, ?, 'manager', ?, ?, ?)",
      [username, hashedPassword, full_name, email, phone || null]
    );

    return NextResponse.json({
      success: true,
      message: "Manager created successfully",
      data: { id: (result as any).insertId },
    });
  } catch (error) {
    console.error("Error creating manager:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 