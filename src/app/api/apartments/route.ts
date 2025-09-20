import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { Apartment, CreateApartmentData } from "@/types";

// GET /api/apartments - Get all apartments
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
    const building_id = searchParams.get('building_id');

    let query = `
      SELECT a.*, b.name as building_name, b.address as building_address
      FROM apartments a
      JOIN buildings b ON a.building_id = b.id
    `;
    
    const params: any[] = [];

    // If user is a manager, only show apartments in their buildings
    if (session.user.role === "manager") {
      query += ` WHERE b.manager_id = ?`;
      params.push(session.user.id);
      
      if (building_id) {
        query += ` AND a.building_id = ?`;
        params.push(building_id);
      }
    } else if (building_id) {
      query += ` WHERE a.building_id = ?`;
      params.push(building_id);
    }

    query += ` ORDER BY b.name, a.apartment_number`;

    const apartments = await executeQuery<Apartment & { building_name?: string; building_address?: string }>(
      query,
      params
    );

    // Format the response to include building object
    const formattedApartments = apartments.map(apartment => ({
      ...apartment,
      building: {
        id: apartment.building_id,
        name: apartment.building_name,
        address: apartment.building_address,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedApartments,
    });
  } catch (error) {
    console.error("Error fetching apartments:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/apartments - Create new apartment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: CreateApartmentData = await request.json();
    const {
      building_id,
      apartment_number,
      floor_number,
      bedrooms,
      bathrooms,
      rent_amount,
      deposit_amount,
      square_feet,
      tenant_name,
      tenant_phone,
      tenant_email,
      emergency_contact_name,
      emergency_contact_phone,
      lease_start_date,
      lease_end_date,
    } = body;

    // Validate required fields
    if (!building_id || !apartment_number || !bedrooms || !bathrooms || !rent_amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user has permission to add apartment to this building
    if (session.user.role === "manager") {
      const building = await executeQuery(
        "SELECT id FROM buildings WHERE id = ? AND manager_id = ?",
        [building_id, session.user.id]
      );

      if (building.length === 0) {
        return NextResponse.json(
          { success: false, error: "You don't have permission to add apartments to this building" },
          { status: 403 }
        );
      }
    }

    // Check if apartment number already exists in this building
    const existingApartment = await executeQuery(
      "SELECT id FROM apartments WHERE building_id = ? AND apartment_number = ?",
      [building_id, apartment_number]
    );

    if (existingApartment.length > 0) {
      return NextResponse.json(
        { success: false, error: "Apartment number already exists in this building" },
        { status: 409 }
      );
    }

    // Determine if apartment is occupied
    const is_occupied = tenant_name ? true : false;

    // Insert new apartment
    const result = await executeQuery(
      `INSERT INTO apartments (
        building_id, apartment_number, floor_number, bedrooms, bathrooms,
        rent_amount, deposit_amount, square_feet, is_occupied,
        tenant_name, tenant_phone, tenant_email,
        emergency_contact_name, emergency_contact_phone,
        lease_start_date, lease_end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        building_id,
        apartment_number,
        floor_number || null,
        bedrooms,
        bathrooms,
        rent_amount,
        deposit_amount || 0,
        square_feet || null,
        is_occupied,
        tenant_name || null,
        tenant_phone || null,
        tenant_email || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        lease_start_date || null,
        lease_end_date || null,
      ]
    );

    // Update building total apartments count
    await executeQuery(
      "UPDATE buildings SET total_apartments = (SELECT COUNT(*) FROM apartments WHERE building_id = ?) WHERE id = ?",
      [building_id, building_id]
    );

    return NextResponse.json({
      success: true,
      message: "Apartment created successfully",
      data: { id: (result as any).insertId },
    });
  } catch (error) {
    console.error("Error creating apartment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 