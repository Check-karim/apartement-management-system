import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { Apartment } from "@/types";

// GET /api/apartments/[id] - Get apartment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const apartmentId = parseInt(id);

    if (isNaN(apartmentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid apartment ID" },
        { status: 400 }
      );
    }

    const apartments = await executeQuery<Apartment & { building_name?: string; building_address?: string }>(
      `SELECT a.*, b.name as building_name, b.address as building_address 
       FROM apartments a 
       JOIN buildings b ON a.building_id = b.id 
       WHERE a.id = ?`,
      [apartmentId]
    );

    if (apartments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Apartment not found" },
        { status: 404 }
      );
    }

    const apartment = apartments[0];

    // Check if manager has permission to view this apartment
    if (session.user.role === "manager") {
      const building = await executeQuery(
        "SELECT id FROM buildings WHERE id = ? AND manager_id = ?",
        [apartment.building_id, session.user.id]
      );

      if (building.length === 0) {
        return NextResponse.json(
          { success: false, error: "You don't have permission to view this apartment" },
          { status: 403 }
        );
      }
    }

    // Format response to include building object
    const formattedApartment = {
      ...apartment,
      building: {
        id: apartment.building_id,
        name: apartment.building_name,
        address: apartment.building_address,
      },
    };

    return NextResponse.json({
      success: true,
      data: formattedApartment,
    });
  } catch (error) {
    console.error("Error fetching apartment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/apartments/[id] - Update apartment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const apartmentId = parseInt(id);

    if (isNaN(apartmentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid apartment ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      apartment_number,
      floor_number,
      bedrooms,
      bathrooms,
      kitchen,
      rent_amount,
      deposit_amount,
      water_meter_reading,
      tenant_name,
      tenant_phone,
      tenant_email,
      emergency_contact_name,
      emergency_contact_phone,
      lease_start_date,
      lease_end_date,
    } = body;

    // Validate required fields
    if (!apartment_number || !bedrooms || !bathrooms || rent_amount === undefined || water_meter_reading === undefined || kitchen === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if apartment exists
    const existingApartments = await executeQuery<Apartment>(
      "SELECT * FROM apartments WHERE id = ?",
      [apartmentId]
    );

    if (existingApartments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Apartment not found" },
        { status: 404 }
      );
    }

    const existingApartment = existingApartments[0];

    // Check if user has permission to update this apartment
    if (session.user.role === "manager") {
      const building = await executeQuery(
        "SELECT id FROM buildings WHERE id = ? AND manager_id = ?",
        [existingApartment.building_id, session.user.id]
      );

      if (building.length === 0) {
        return NextResponse.json(
          { success: false, error: "You don't have permission to update this apartment" },
          { status: 403 }
        );
      }
    }

    // Check if apartment number already exists in this building (excluding current apartment)
    const duplicateApartments = await executeQuery(
      "SELECT id FROM apartments WHERE building_id = ? AND apartment_number = ? AND id != ?",
      [existingApartment.building_id, apartment_number, apartmentId]
    );

    if (duplicateApartments.length > 0) {
      return NextResponse.json(
        { success: false, error: "Apartment number already exists in this building" },
        { status: 409 }
      );
    }

    // Determine if apartment is occupied
    const is_occupied = tenant_name ? true : false;

    // Update apartment
    await executeQuery(
      `UPDATE apartments SET 
        apartment_number = ?, 
        floor_number = ?, 
        bedrooms = ?, 
        bathrooms = ?,
        kitchen = ?,
        rent_amount = ?, 
        deposit_amount = ?, 
        water_meter_reading = ?, 
        is_occupied = ?,
        tenant_name = ?, 
        tenant_phone = ?, 
        tenant_email = ?,
        emergency_contact_name = ?, 
        emergency_contact_phone = ?,
        lease_start_date = ?, 
        lease_end_date = ?
      WHERE id = ?`,
      [
        apartment_number,
        floor_number || null,
        bedrooms,
        bathrooms,
        kitchen,
        rent_amount,
        deposit_amount || 0,
        water_meter_reading,
        is_occupied,
        tenant_name || null,
        tenant_phone || null,
        tenant_email || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        lease_start_date || null,
        lease_end_date || null,
        apartmentId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Apartment updated successfully",
    });
  } catch (error) {
    console.error("Error updating apartment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/apartments/[id] - Delete apartment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const apartmentId = parseInt(id);

    if (isNaN(apartmentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid apartment ID" },
        { status: 400 }
      );
    }

    // Check if apartment exists
    const existingApartments = await executeQuery<Apartment>(
      "SELECT * FROM apartments WHERE id = ?",
      [apartmentId]
    );

    if (existingApartments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Apartment not found" },
        { status: 404 }
      );
    }

    const apartment = existingApartments[0];

    // Check if user has permission to delete this apartment
    if (session.user.role === "manager") {
      const building = await executeQuery(
        "SELECT id FROM buildings WHERE id = ? AND manager_id = ?",
        [apartment.building_id, session.user.id]
      );

      if (building.length === 0) {
        return NextResponse.json(
          { success: false, error: "You don't have permission to delete this apartment" },
          { status: 403 }
        );
      }
    }

    // Delete apartment (will cascade delete related records due to foreign key constraints)
    await executeQuery("DELETE FROM apartments WHERE id = ?", [apartmentId]);

    // Update building total apartments count
    await executeQuery(
      "UPDATE buildings SET total_apartments = (SELECT COUNT(*) FROM apartments WHERE building_id = ?) WHERE id = ?",
      [apartment.building_id, apartment.building_id]
    );

    return NextResponse.json({
      success: true,
      message: "Apartment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting apartment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

