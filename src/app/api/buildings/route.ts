import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { Building, CreateBuildingData } from "@/types";

// GET /api/buildings - Get all buildings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let query = `
      SELECT b.*, u.full_name as manager_name, u.email as manager_email 
      FROM buildings b 
      LEFT JOIN users u ON b.manager_id = u.id 
      ORDER BY b.created_at DESC
    `;

    // If user is a manager, only show their buildings
    if (session.user.role === "manager") {
      query = `
        SELECT b.*, u.full_name as manager_name, u.email as manager_email 
        FROM buildings b 
        LEFT JOIN users u ON b.manager_id = u.id 
        WHERE b.manager_id = ?
        ORDER BY b.created_at DESC
      `;
    }

    const buildings = await executeQuery<Building & { manager_name?: string; manager_email?: string }>(
      query,
      session.user.role === "manager" ? [session.user.id] : []
    );

    // Format the response to include manager object
    const formattedBuildings = buildings.map(building => ({
      ...building,
      manager: building.manager_name ? {
        id: building.manager_id,
        full_name: building.manager_name,
        email: building.manager_email,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedBuildings,
    });
  } catch (error) {
    console.error("Error fetching buildings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/buildings - Create new building
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: CreateBuildingData = await request.json();
    const { name, address, manager_id } = body;

    // Validate required fields
    if (!name || !address) {
      return NextResponse.json(
        { success: false, error: "Name and address are required" },
        { status: 400 }
      );
    }

    // Validate manager if provided
    if (manager_id) {
      const manager = await executeQuery(
        "SELECT id FROM users WHERE id = ? AND role = 'manager' AND is_active = TRUE",
        [manager_id]
      );

      if (manager.length === 0) {
        return NextResponse.json(
          { success: false, error: "Invalid manager selected" },
          { status: 400 }
        );
      }
    }

    // Insert new building
    const result = await executeQuery(
      "INSERT INTO buildings (name, address, manager_id) VALUES (?, ?, ?)",
      [name, address, manager_id || null]
    );

    return NextResponse.json({
      success: true,
      message: "Building created successfully",
      data: { id: (result as any).insertId },
    });
  } catch (error) {
    console.error("Error creating building:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 