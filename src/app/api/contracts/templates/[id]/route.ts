import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

// GET /api/contracts/templates/[id] - Get single contract template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      WHERE ct.id = ?
    `;

    const templates = await executeQuery(query, [params.id]);

    if (templates.length === 0) {
      return NextResponse.json(
        { success: false, error: "Contract template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: templates[0],
    });
  } catch (error) {
    console.error("Error fetching contract template:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/templates/[id] - Update contract template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, content, is_active, is_default } = body;

    // Get existing template
    const existingTemplate = await executeQuery(
      "SELECT * FROM contract_templates WHERE id = ?",
      [params.id]
    );

    if (existingTemplate.length === 0) {
      return NextResponse.json(
        { success: false, error: "Contract template not found" },
        { status: 404 }
      );
    }

    const template = existingTemplate[0] as any;

    // If setting as default, unset other defaults
    if (is_default && !template.is_default) {
      await executeQuery(
        "UPDATE contract_templates SET is_default = FALSE WHERE is_default = TRUE"
      );
    }

    // Update template
    await executeQuery(
      `UPDATE contract_templates 
       SET name = ?, description = ?, content = ?, is_active = ?, is_default = ?
       WHERE id = ?`,
      [
        name || template.name,
        description !== undefined ? description : template.description,
        content || template.content,
        is_active !== undefined ? is_active : template.is_active,
        is_default !== undefined ? is_default : template.is_default,
        params.id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Contract template updated successfully",
    });
  } catch (error) {
    console.error("Error updating contract template:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/templates/[id] - Delete contract template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    // Check if template is default
    const template = await executeQuery(
      "SELECT is_default FROM contract_templates WHERE id = ?",
      [params.id]
    );

    if (template.length === 0) {
      return NextResponse.json(
        { success: false, error: "Contract template not found" },
        { status: 404 }
      );
    }

    if ((template[0] as any).is_default) {
      return NextResponse.json(
        { success: false, error: "Cannot delete default template" },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    await executeQuery(
      "UPDATE contract_templates SET is_active = FALSE WHERE id = ?",
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: "Contract template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contract template:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

