import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

// GET /api/water/invoices/[id] - Get single water invoice
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
        wi.*,
        b.name as building_name,
        b.address as building_address,
        b.manager_id,
        u.full_name as created_by_name
      FROM water_invoices wi
      LEFT JOIN buildings b ON wi.building_id = b.id
      LEFT JOIN users u ON wi.created_by = u.id
      WHERE wi.id = ?
    `;

    const invoices = await executeQuery(query, [params.id]);

    if (invoices.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    const invoice = invoices[0] as any;

    // If user is a manager, verify they manage this building
    if (session.user.role === "manager" && invoice.manager_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching water invoice:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/water/invoices/[id] - Update water invoice
export async function PUT(
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

    const body = await request.json();
    const {
      invoice_number,
      invoice_date,
      billing_period_start,
      billing_period_end,
      total_m3,
      total_amount,
      invoice_file_path,
      notes,
    } = body;

    // Get existing invoice
    const existingInvoice = await executeQuery(
      `SELECT wi.*, b.manager_id 
       FROM water_invoices wi
       LEFT JOIN buildings b ON wi.building_id = b.id
       WHERE wi.id = ?`,
      [params.id]
    );

    if (existingInvoice.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    const invoice = existingInvoice[0] as any;

    // If user is a manager, verify they manage this building
    if (session.user.role === "manager" && invoice.manager_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if invoice number is being changed and already exists
    if (invoice_number && invoice_number !== invoice.invoice_number) {
      const duplicateInvoice = await executeQuery(
        "SELECT id FROM water_invoices WHERE invoice_number = ? AND id != ?",
        [invoice_number, params.id]
      );

      if (duplicateInvoice.length > 0) {
        return NextResponse.json(
          { success: false, error: "Invoice number already exists" },
          { status: 400 }
        );
      }
    }

    // Update invoice
    await executeQuery(
      `UPDATE water_invoices 
       SET invoice_number = ?, invoice_date = ?, billing_period_start = ?, 
           billing_period_end = ?, total_m3 = ?, total_amount = ?, 
           invoice_file_path = ?, notes = ?
       WHERE id = ?`,
      [
        invoice_number || invoice.invoice_number,
        invoice_date || invoice.invoice_date,
        billing_period_start || invoice.billing_period_start,
        billing_period_end || invoice.billing_period_end,
        total_m3 || invoice.total_m3,
        total_amount || invoice.total_amount,
        invoice_file_path !== undefined ? invoice_file_path : invoice.invoice_file_path,
        notes !== undefined ? notes : invoice.notes,
        params.id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Water invoice updated successfully",
    });
  } catch (error) {
    console.error("Error updating water invoice:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/water/invoices/[id] - Delete water invoice
export async function DELETE(
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

    // Get existing invoice
    const existingInvoice = await executeQuery(
      `SELECT wi.*, b.manager_id 
       FROM water_invoices wi
       LEFT JOIN buildings b ON wi.building_id = b.id
       WHERE wi.id = ?`,
      [params.id]
    );

    if (existingInvoice.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    const invoice = existingInvoice[0] as any;

    // If user is a manager, verify they manage this building
    if (session.user.role === "manager" && invoice.manager_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if there are water bills associated with this invoice
    const waterBills = await executeQuery(
      "SELECT COUNT(*) as count FROM water_bills WHERE invoice_id = ?",
      [params.id]
    );

    if ((waterBills[0] as any).count > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete invoice with associated water bills" },
        { status: 400 }
      );
    }

    // Delete invoice
    await executeQuery("DELETE FROM water_invoices WHERE id = ?", [params.id]);

    return NextResponse.json({
      success: true,
      message: "Water invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting water invoice:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

