import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

// GET /api/settings - Get system settings
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
    const keys = searchParams.get("keys");

    let query = "SELECT * FROM system_settings";
    const params: any[] = [];

    if (keys) {
      const keyArray = keys.split(",");
      query += " WHERE setting_key IN (" + keyArray.map(() => "?").join(",") + ")";
      params.push(...keyArray);
    }

    query += " ORDER BY setting_key";

    const settings = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/settings - Update system settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, error: "Settings array is required" },
        { status: 400 }
      );
    }

    // Update or insert each setting
    for (const setting of settings) {
      const { key, value, type } = setting;

      if (!key) {
        continue;
      }

      await executeQuery(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = ?, setting_type = ?`,
        [key, value, type || 'string', value, type || 'string']
      );
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

