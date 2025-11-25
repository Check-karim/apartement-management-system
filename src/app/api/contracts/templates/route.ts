import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

// GET /api/contracts/templates - Get all contract templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const query = `
      SELECT 
        ct.*,
        u.full_name as created_by_name
      FROM contract_templates ct
      LEFT JOIN users u ON ct.created_by = u.id
      WHERE ct.is_active = TRUE
      ORDER BY ct.is_default DESC, ct.created_at DESC
    `;

    const templates = await executeQuery(query);

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("Error fetching contract templates:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/contracts/templates - Create new contract template
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
    const { name, description, content, is_default } = body;

    // Validate required fields
    if (!name || !content) {
      return NextResponse.json(
        { success: false, error: "Name and content are required" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await executeQuery(
        "UPDATE contract_templates SET is_default = FALSE WHERE is_default = TRUE"
      );
    }

    // Insert new template
    const result = await executeQuery(
      `INSERT INTO contract_templates 
       (name, description, content, is_default, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, description || null, content, is_default || false, session.user.id]
    );

    return NextResponse.json({
      success: true,
      message: "Contract template created successfully",
      data: { id: (result as any).insertId },
    });
  } catch (error) {
    console.error("Error creating contract template:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

