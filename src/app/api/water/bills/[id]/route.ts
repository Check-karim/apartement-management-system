import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

// GET /api/water/bills/[id] - Get single water bill
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
      SELECT * FROM water_billing_summary
      WHERE id = ?
    `;

    const bills = await executeQuery(query, [params.id]);

    if (bills.length === 0) {
      return NextResponse.json(
        { success: false, error: "Water bill not found" },
        { status: 404 }
      );
    }

    const bill = bills[0] as any;

    // If user is a manager, verify they manage this building
    if (session.user.role === "manager") {
      const building = await executeQuery(
        "SELECT manager_id FROM buildings WHERE id = ?",
        [bill.building_id]
      );

      if (building.length === 0 || (building[0] as any).manager_id !== session.user.id) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error("Error fetching water bill:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/water/bills/[id] - Update water bill (mark as paid, etc.)
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
    const { is_paid, payment_date } = body;

    // Get existing bill
    const existingBill = await executeQuery(
      `SELECT wb.*, b.manager_id 
       FROM water_bills wb
       LEFT JOIN buildings b ON wb.building_id = b.id
       WHERE wb.id = ?`,
      [params.id]
    );

    if (existingBill.length === 0) {
      return NextResponse.json(
        { success: false, error: "Water bill not found" },
        { status: 404 }
      );
    }

    const bill = existingBill[0] as any;

    // If user is a manager, verify they manage this building
    if (session.user.role === "manager" && bill.manager_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update bill
    const updates: string[] = [];
    const params_values: any[] = [];

    if (is_paid !== undefined) {
      updates.push("is_paid = ?");
      params_values.push(is_paid);
    }

    if (payment_date !== undefined) {
      updates.push("payment_date = ?");
      params_values.push(payment_date);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    params_values.push(params.id);

    await executeQuery(
      `UPDATE water_bills SET ${updates.join(", ")} WHERE id = ?`,
      params_values
    );

    return NextResponse.json({
      success: true,
      message: "Water bill updated successfully",
    });
  } catch (error) {
    console.error("Error updating water bill:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/water/bills/[id] - Delete water bill
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

    // Get existing bill
    const existingBill = await executeQuery(
      "SELECT * FROM water_bills WHERE id = ?",
      [params.id]
    );

    if (existingBill.length === 0) {
      return NextResponse.json(
        { success: false, error: "Water bill not found" },
        { status: 404 }
      );
    }

    // Delete bill
    await executeQuery("DELETE FROM water_bills WHERE id = ?", [params.id]);

    return NextResponse.json({
      success: true,
      message: "Water bill deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting water bill:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

