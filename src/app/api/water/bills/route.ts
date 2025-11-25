import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

// GET /api/water/bills - Get all water bills
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
    const apartment_id = searchParams.get("apartment_id");
    const invoice_id = searchParams.get("invoice_id");
    const is_paid = searchParams.get("is_paid");

    let query = `
      SELECT * FROM water_billing_summary
      WHERE 1=1
    `;

    const params: any[] = [];

    if (building_id) {
      query += " AND building_id = ?";
      params.push(building_id);
    }

    if (apartment_id) {
      query += " AND apartment_id = ?";
      params.push(apartment_id);
    }

    if (invoice_id) {
      query += " AND invoice_id = ?";
      params.push(invoice_id);
    }

    if (is_paid !== null && is_paid !== undefined) {
      query += " AND is_paid = ?";
      params.push(is_paid === "true" ? 1 : 0);
    }

    // If user is a manager, only show bills for their buildings
    if (session.user.role === "manager") {
      query += ` AND building_id IN (
        SELECT id FROM buildings WHERE manager_id = ?
      )`;
      params.push(session.user.id);
    }

    query += " ORDER BY billing_period_start DESC, building_name, apartment_number";

    const bills = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: bills,
    });
  } catch (error) {
    console.error("Error fetching water bills:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/water/bills - Generate water bills for a building based on invoice
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
    const { invoice_id, meter_readings } = body;

    // meter_readings format: [{ apartment_id, current_meter_reading }, ...]

    // Validate required fields
    if (!invoice_id || !meter_readings || !Array.isArray(meter_readings)) {
      return NextResponse.json(
        { success: false, error: "Invoice ID and meter readings are required" },
        { status: 400 }
      );
    }

    // Get invoice details
    const invoiceResult = await executeQuery(
      `SELECT wi.*, b.manager_id
       FROM water_invoices wi
       LEFT JOIN buildings b ON wi.building_id = b.id
       WHERE wi.id = ?`,
      [invoice_id]
    );

    if (invoiceResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    const invoice = invoiceResult[0] as any;

    // If user is a manager, verify they manage this building
    if (session.user.role === "manager" && invoice.manager_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get pompe settings for this building
    const pompeResult = await executeQuery(
      "SELECT * FROM pompe_settings WHERE building_id = ? AND is_active = TRUE",
      [invoice.building_id]
    );

    const pompe = pompeResult.length > 0 ? (pompeResult[0] as any) : null;
    const pompePricePerM3 = pompe ? pompe.total_price_per_period / invoice.total_m3 : 0;

    // Calculate price per m3 from invoice
    const pricePerM3 = invoice.total_amount / invoice.total_m3;

    // Generate bills for each apartment
    const billsCreated = [];
    const errors = [];

    for (const reading of meter_readings) {
      try {
        const { apartment_id, current_meter_reading } = reading;

        if (!apartment_id || current_meter_reading === undefined) {
          errors.push({ apartment_id, error: "Missing apartment_id or current_meter_reading" });
          continue;
        }

        // Get apartment details including previous meter reading
        const apartmentResult = await executeQuery(
          "SELECT * FROM apartments WHERE id = ? AND building_id = ?",
          [apartment_id, invoice.building_id]
        );

        if (apartmentResult.length === 0) {
          errors.push({ apartment_id, error: "Apartment not found in this building" });
          continue;
        }

        const apartment = apartmentResult[0] as any;

        // Check if bill already exists for this apartment and invoice
        const existingBill = await executeQuery(
          "SELECT id FROM water_bills WHERE apartment_id = ? AND invoice_id = ?",
          [apartment_id, invoice_id]
        );

        if (existingBill.length > 0) {
          errors.push({ apartment_id, error: "Bill already exists for this apartment and invoice" });
          continue;
        }

        // Insert water bill
        const billResult = await executeQuery(
          `INSERT INTO water_bills 
           (apartment_id, invoice_id, building_id, billing_period_start, billing_period_end,
            previous_meter_reading, current_meter_reading, price_per_m3, pompe_price_per_m3, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            apartment_id,
            invoice_id,
            invoice.building_id,
            invoice.billing_period_start,
            invoice.billing_period_end,
            apartment.water_meter_reading,
            current_meter_reading,
            pricePerM3,
            pompePricePerM3,
            session.user.id,
          ]
        );

        // Update apartment water meter reading
        await executeQuery(
          "UPDATE apartments SET water_meter_reading = ? WHERE id = ?",
          [current_meter_reading, apartment_id]
        );

        billsCreated.push({
          apartment_id,
          bill_id: (billResult as any).insertId,
        });
      } catch (error) {
        console.error(`Error creating bill for apartment ${reading.apartment_id}:`, error);
        errors.push({ apartment_id: reading.apartment_id, error: "Internal error creating bill" });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${billsCreated.length} water bills`,
      data: {
        bills_created: billsCreated,
        errors: errors,
      },
    });
  } catch (error) {
    console.error("Error generating water bills:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

