import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { User } from "@/types";

// GET /api/users/managers/[id] - Get single manager
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const managerId = parseInt(id);
    
    if (isNaN(managerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid manager ID" },
        { status: 400 }
      );
    }

    const managers = await executeQuery<User>(
      "SELECT id, username, role, full_name, email, phone, is_active, created_at, updated_at FROM users WHERE id = ? AND role = 'manager'",
      [managerId]
    );

    if (managers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Manager not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: managers[0],
    });
  } catch (error) {
    console.error("Error fetching manager:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/users/managers/[id] - Update manager
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const managerId = parseInt(id);
    
    if (isNaN(managerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid manager ID" },
        { status: 400 }
      );
    }

    // Check if manager exists
    const existingManager = await executeQuery(
      "SELECT id FROM users WHERE id = ? AND role = 'manager'",
      [managerId]
    );

    if (existingManager.length === 0) {
      return NextResponse.json(
        { success: false, error: "Manager not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { username, password, full_name, email, phone, is_active } = body;

    // Validate required fields
    if (!username || !full_name || !email) {
      return NextResponse.json(
        { success: false, error: "Username, full name, and email are required" },
        { status: 400 }
      );
    }

    // Check if username or email already exists (excluding current manager)
    const conflictQuery = await executeQuery(
      "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?",
      [username, email, managerId]
    );

    if (conflictQuery.length > 0) {
      return NextResponse.json(
        { success: false, error: "Username or email already exists" },
        { status: 409 }
      );
    }

    // Prepare update query
    let updateQuery = `
      UPDATE users 
      SET username = ?, full_name = ?, email = ?, phone = ?, is_active = ?, updated_at = NOW()
      WHERE id = ? AND role = 'manager'
    `;
    let updateParams = [username, full_name, email, phone || null, is_active, managerId];

    // If password is provided, include it in the update
    if (password && password.trim() !== "") {
      const hashedPassword = await hashPassword(password);
      updateQuery = `
        UPDATE users 
        SET username = ?, password = ?, full_name = ?, email = ?, phone = ?, is_active = ?, updated_at = NOW()
        WHERE id = ? AND role = 'manager'
      `;
      updateParams = [username, hashedPassword, full_name, email, phone || null, is_active, managerId];
    }

    await executeQuery(updateQuery, updateParams);

    // Fetch updated manager data
    const updatedManager = await executeQuery<User>(
      "SELECT id, username, role, full_name, email, phone, is_active, created_at, updated_at FROM users WHERE id = ?",
      [managerId]
    );

    return NextResponse.json({
      success: true,
      message: "Manager updated successfully",
      data: updatedManager[0],
    });
  } catch (error) {
    console.error("Error updating manager:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/managers/[id] - Delete manager
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const managerId = parseInt(id);
    
    if (isNaN(managerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid manager ID" },
        { status: 400 }
      );
    }

    // Check if manager exists
    const existingManager = await executeQuery(
      "SELECT id FROM users WHERE id = ? AND role = 'manager'",
      [managerId]
    );

    if (existingManager.length === 0) {
      return NextResponse.json(
        { success: false, error: "Manager not found" },
        { status: 404 }
      );
    }

    // Check if manager is assigned to any buildings
    const assignedBuildings = await executeQuery(
      "SELECT id FROM buildings WHERE manager_id = ?",
      [managerId]
    );

    if (assignedBuildings.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot delete manager. Manager is assigned to one or more buildings. Please reassign buildings first." 
        },
        { status: 409 }
      );
    }

    // Delete the manager
    await executeQuery(
      "DELETE FROM users WHERE id = ? AND role = 'manager'",
      [managerId]
    );

    return NextResponse.json({
      success: true,
      message: "Manager deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting manager:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 