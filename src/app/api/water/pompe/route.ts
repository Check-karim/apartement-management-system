import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

// GET /api/water/pompe - Get pompe settings for buildings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const building_id = searchParams.get("building_id");

    let query = `
      SELECT 
        ps.*,
        b.name as building_name,
        b.address as building_address
      FROM pompe_settings ps
      LEFT JOIN buildings b ON ps.building_id = b.id
    `;

    const params: any[] = [];

    if (building_id) {
      query += " WHERE ps.building_id = ?";
      params.push(building_id);
    }

    // If user is a manager, only show settings for their buildings
    if (session.user.role === "manager") {
      query += building_id ? " AND" : " WHERE";
      query += " b.manager_id = ?";
      params.push(session.user.id);
    }

    query += " ORDER BY b.name";

    const settings = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching pompe settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/water/pompe - Create or update pompe settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { building_id, total_price_per_period, is_active, notes } = body;

    // Validate required fields
    if (!building_id || total_price_per_period === undefined) {
      return NextResponse.json(
        { success: false, error: "Building ID and total price are required" },
        { status: 400 }
      );
    }

    // Verify building exists
    const building = await executeQuery(
      "SELECT id, manager_id FROM buildings WHERE id = ?",
      [building_id]
    );

    if (building.length === 0) {
      return NextResponse.json(
        { success: false, error: "Building not found" },
        { status: 404 }
      );
    }

    // If user is a manager, verify they manage this building
    if (session.user.role === "manager" && (building as any)[0].manager_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - You don't manage this building" },
        { status: 403 }
      );
    }

    // Check if settings already exist for this building
    const existingSettings = await executeQuery(
      "SELECT id FROM pompe_settings WHERE building_id = ?",
      [building_id]
    );

    if (existingSettings.length > 0) {
      // Update existing settings
      await executeQuery(
        `UPDATE pompe_settings 
         SET total_price_per_period = ?, is_active = ?, notes = ?
         WHERE building_id = ?`,
        [
          total_price_per_period,
          is_active !== undefined ? is_active : true,
          notes || null,
          building_id,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Pompe settings updated successfully",
      });
    } else {
      // Insert new settings
      const result = await executeQuery(
        `INSERT INTO pompe_settings 
         (building_id, total_price_per_period, is_active, notes) 
         VALUES (?, ?, ?, ?)`,
        [
          building_id,
          total_price_per_period,
          is_active !== undefined ? is_active : true,
          notes || null,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Pompe settings created successfully",
        data: { id: (result as any).insertId },
      });
    }
  } catch (error) {
    console.error("Error creating/updating pompe settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

