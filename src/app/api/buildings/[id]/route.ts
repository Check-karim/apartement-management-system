import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { Building } from "@/types";

// GET /api/buildings/[id] - Get building by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const buildingId = parseInt(id);

    if (isNaN(buildingId)) {
      return NextResponse.json(
        { success: false, error: "Invalid building ID" },
        { status: 400 }
      );
    }

    const buildings = await executeQuery<Building & { manager_name?: string; manager_email?: string }>(
      `SELECT b.*, u.full_name as manager_name, u.email as manager_email 
       FROM buildings b 
       LEFT JOIN users u ON b.manager_id = u.id 
       WHERE b.id = ?`,
      [buildingId]
    );

    if (buildings.length === 0) {
      return NextResponse.json(
        { success: false, error: "Building not found" },
        { status: 404 }
      );
    }

    const building = buildings[0];

    // Format response to include manager object
    const formattedBuilding = {
      ...building,
      manager: building.manager_name ? {
        id: building.manager_id,
        full_name: building.manager_name,
        email: building.manager_email,
      } : null,
    };

    return NextResponse.json({
      success: true,
      data: formattedBuilding,
    });
  } catch (error) {
    console.error("Error fetching building:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/buildings/[id] - Update building
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
    const buildingId = parseInt(id);

    if (isNaN(buildingId)) {
      return NextResponse.json(
        { success: false, error: "Invalid building ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, address, manager_id } = body;

    // Validate required fields
    if (!name || !address) {
      return NextResponse.json(
        { success: false, error: "Name and address are required" },
        { status: 400 }
      );
    }

    // Check if building exists
    const existingBuildings = await executeQuery(
      "SELECT id FROM buildings WHERE id = ?",
      [buildingId]
    );

    if (existingBuildings.length === 0) {
      return NextResponse.json(
        { success: false, error: "Building not found" },
        { status: 404 }
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

    // Update building
    await executeQuery(
      "UPDATE buildings SET name = ?, address = ?, manager_id = ? WHERE id = ?",
      [name, address, manager_id || null, buildingId]
    );

    return NextResponse.json({
      success: true,
      message: "Building updated successfully",
    });
  } catch (error) {
    console.error("Error updating building:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/buildings/[id] - Delete building
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
    const buildingId = parseInt(id);

    if (isNaN(buildingId)) {
      return NextResponse.json(
        { success: false, error: "Invalid building ID" },
        { status: 400 }
      );
    }

    // Check if building exists
    const existingBuildings = await executeQuery(
      "SELECT id FROM buildings WHERE id = ?",
      [buildingId]
    );

    if (existingBuildings.length === 0) {
      return NextResponse.json(
        { success: false, error: "Building not found" },
        { status: 404 }
      );
    }

    // Delete building (will cascade delete apartments due to foreign key constraint)
    await executeQuery("DELETE FROM buildings WHERE id = ?", [buildingId]);

    return NextResponse.json({
      success: true,
      message: "Building deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting building:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

