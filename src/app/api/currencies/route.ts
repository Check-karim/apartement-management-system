import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

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

interface CreateCurrencyData {
  code: string;
  name: string;
  symbol: string;
  position: "before" | "after";
  decimal_places: number;
  is_active?: boolean;
  is_default?: boolean;
}

// GET /api/currencies - Get all currencies
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const currencies = await executeQuery<Currency>(
      "SELECT * FROM currencies ORDER BY is_default DESC, code ASC"
    );

    return NextResponse.json({
      success: true,
      data: currencies,
    });
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/currencies - Create new currency
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: CreateCurrencyData = await request.json();
    const { code, name, symbol, position, decimal_places, is_active, is_default } = body;

    // Validate required fields
    if (!code || !name || !symbol || !position || decimal_places === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if currency code already exists
    const existingCurrency = await executeQuery(
      "SELECT id FROM currencies WHERE code = ?",
      [code.toUpperCase()]
    );

    if (existingCurrency.length > 0) {
      return NextResponse.json(
        { success: false, error: "Currency code already exists" },
        { status: 409 }
      );
    }

    // If setting as default, unset all other defaults
    if (is_default) {
      await executeQuery(
        "UPDATE currencies SET is_default = FALSE"
      );
    }

    // Insert new currency
    const result = await executeQuery(
      `INSERT INTO currencies (code, name, symbol, position, decimal_places, is_active, is_default) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        name,
        symbol,
        position,
        decimal_places,
        is_active !== undefined ? is_active : true,
        is_default || false
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Currency created successfully",
      data: { id: (result as any).insertId },
    });
  } catch (error) {
    console.error("Error creating currency:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

