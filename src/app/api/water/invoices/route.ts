import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

// GET /api/water/invoices - Get all water invoices
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
        wi.*,
        b.name as building_name,
        b.address as building_address,
        u.full_name as created_by_name
      FROM water_invoices wi
      LEFT JOIN buildings b ON wi.building_id = b.id
      LEFT JOIN users u ON wi.created_by = u.id
    `;

    const params: any[] = [];

    // Filter by building if provided
    if (building_id) {
      query += " WHERE wi.building_id = ?";
      params.push(building_id);
    }

    // If user is a manager, only show invoices for their buildings
    if (session.user.role === "manager") {
      query += building_id ? " AND" : " WHERE";
      query += " b.manager_id = ?";
      params.push(session.user.id);
    }

    query += " ORDER BY wi.invoice_date DESC, wi.created_at DESC";

    const invoices = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error("Error fetching water invoices:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/water/invoices - Create new water invoice
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
    const {
      building_id,
      invoice_number,
      invoice_date,
      billing_period_start,
      billing_period_end,
      total_m3,
      total_amount,
      invoice_file_path,
      notes,
    } = body;

    // Validate required fields
    if (!building_id || !invoice_number || !invoice_date || !billing_period_start || !billing_period_end || !total_m3 || !total_amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
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

    // Check if invoice number already exists
    const existingInvoice = await executeQuery(
      "SELECT id FROM water_invoices WHERE invoice_number = ?",
      [invoice_number]
    );

    if (existingInvoice.length > 0) {
      return NextResponse.json(
        { success: false, error: "Invoice number already exists" },
        { status: 400 }
      );
    }

    // Insert new invoice
    const result = await executeQuery(
      `INSERT INTO water_invoices 
       (building_id, invoice_number, invoice_date, billing_period_start, billing_period_end, 
        total_m3, total_amount, invoice_file_path, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        building_id,
        invoice_number,
        invoice_date,
        billing_period_start,
        billing_period_end,
        total_m3,
        total_amount,
        invoice_file_path || null,
        notes || null,
        session.user.id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Water invoice created successfully",
      data: { id: (result as any).insertId },
    });
  } catch (error) {
    console.error("Error creating water invoice:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

