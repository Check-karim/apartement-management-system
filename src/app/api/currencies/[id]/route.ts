import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery, executeQuerySingle } from "@/lib/db";

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  position: "before" | "after";
  decimal_places: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface UpdateCurrencyData {
  name?: string;
  symbol?: string;
  position?: "before" | "after";
  decimal_places?: number;
  is_active?: boolean;
  is_default?: boolean;
}

// GET /api/currencies/[id] - Get a single currency
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
    const currency = await executeQuerySingle<Currency>(
      "SELECT * FROM currencies WHERE id = ?",
      [id]
    );

    if (!currency) {
      return NextResponse.json(
        { success: false, error: "Currency not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: currency,
    });
  } catch (error) {
    console.error("Error fetching currency:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/currencies/[id] - Update currency
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
    
    // Check if currency exists
    const currency = await executeQuerySingle<Currency>(
      "SELECT * FROM currencies WHERE id = ?",
      [id]
    );

    if (!currency) {
      return NextResponse.json(
        { success: false, error: "Currency not found" },
        { status: 404 }
      );
    }

    const body: UpdateCurrencyData = await request.json();
    const { name, symbol, position, decimal_places, is_active, is_default } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (symbol !== undefined) {
      updates.push("symbol = ?");
      values.push(symbol);
    }
    if (position !== undefined) {
      updates.push("position = ?");
      values.push(position);
    }
    if (decimal_places !== undefined) {
      updates.push("decimal_places = ?");
      values.push(decimal_places);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active);
    }
    if (is_default !== undefined) {
      updates.push("is_default = ?");
      values.push(is_default);
      
      // If setting as default, unset all other defaults
      if (is_default) {
        await executeQuery(
          "UPDATE currencies SET is_default = FALSE WHERE id != ?",
          [id]
        );
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(id);

    await executeQuery(
      `UPDATE currencies SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: "Currency updated successfully",
    });
  } catch (error) {
    console.error("Error updating currency:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/currencies/[id] - Delete currency
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
    
    // Check if currency exists
    const currency = await executeQuerySingle<Currency>(
      "SELECT * FROM currencies WHERE id = ?",
      [id]
    );

    if (!currency) {
      return NextResponse.json(
        { success: false, error: "Currency not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of default currency
    if (currency.is_default) {
      return NextResponse.json(
        { success: false, error: "Cannot delete default currency. Set another currency as default first." },
        { status: 400 }
      );
    }

    await executeQuery(
      "DELETE FROM currencies WHERE id = ?",
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Currency deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting currency:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

