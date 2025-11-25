import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

// POST /api/contracts/generate - Generate contract from template
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
    const { template_id, apartment_id } = body;

    // Validate required fields
    if (!template_id || !apartment_id) {
      return NextResponse.json(
        { success: false, error: "Template ID and Apartment ID are required" },
        { status: 400 }
      );
    }

    // Get template
    const templateResult = await executeQuery(
      "SELECT * FROM contract_templates WHERE id = ? AND is_active = TRUE",
      [template_id]
    );

    if (templateResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Contract template not found" },
        { status: 404 }
      );
    }

    const template = templateResult[0] as any;

    // Get apartment details with all related info
    const apartmentResult = await executeQuery(
      "SELECT * FROM apartment_tenant_details WHERE id = ?",
      [apartment_id]
    );

    if (apartmentResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Apartment not found" },
        { status: 404 }
      );
    }

    const apartment = apartmentResult[0] as any;

    // If user is a manager, verify they manage this building
    if (session.user.role === "manager") {
      const building = await executeQuery(
        "SELECT manager_id FROM buildings WHERE id = ?",
        [apartment.building_id]
      );

      if (building.length === 0 || (building[0] as any).manager_id !== session.user.id) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    // Get currency settings
    const currencySettings = await executeQuery(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'currency_symbol'"
    );

    const currencySymbol = currencySettings.length > 0 
      ? (currencySettings[0] as any).setting_value 
      : 'FRw';

    // Replace placeholders in template
    let contractContent = template.content;
    
    const replacements: Record<string, string> = {
      '{{BUILDING_NAME}}': apartment.building_name || '',
      '{{BUILDING_ADDRESS}}': apartment.building_address || '',
      '{{MANAGER_PHONE}}': apartment.manager_phone || '',
      '{{TENANT_NAME}}': apartment.tenant_name || '',
      '{{TENANT_ID_PASSPORT}}': apartment.tenant_id_passport || '',
      '{{TENANT_PHONE}}': apartment.full_phone_number || apartment.tenant_phone || '',
      '{{TENANT_EMAIL}}': apartment.tenant_email || '',
      '{{APARTMENT_NUMBER}}': apartment.apartment_number || '',
      '{{FLOOR_NUMBER}}': apartment.floor_number?.toString() || 'N/A',
      '{{BEDROOMS}}': apartment.bedrooms?.toString() || '',
      '{{BATHROOMS}}': apartment.bathrooms?.toString() || '',
      '{{RENT_AMOUNT}}': apartment.rent_amount ? Number(apartment.rent_amount).toFixed(2) : '0.00',
      '{{DEPOSIT_AMOUNT}}': apartment.deposit_amount ? Number(apartment.deposit_amount).toFixed(2) : '0.00',
      '{{CURRENCY_SYMBOL}}': currencySymbol,
      '{{LEASE_START_DATE}}': apartment.lease_start_date 
        ? new Date(apartment.lease_start_date).toLocaleDateString() 
        : '',
      '{{LEASE_END_DATE}}': apartment.lease_end_date 
        ? new Date(apartment.lease_end_date).toLocaleDateString() 
        : '',
      '{{EMERGENCY_CONTACT_NAME}}': apartment.emergency_contact_name || '',
      '{{EMERGENCY_CONTACT_PHONE}}': apartment.emergency_contact_phone || '',
      '{{WATER_METER_READING}}': apartment.water_meter_reading ? Number(apartment.water_meter_reading).toFixed(2) : '0.00',
    };

    // Replace all placeholders
    for (const [placeholder, value] of Object.entries(replacements)) {
      contractContent = contractContent.replace(new RegExp(placeholder, 'g'), value);
    }

    return NextResponse.json({
      success: true,
      data: {
        content: contractContent,
        template_name: template.name,
        apartment_number: apartment.apartment_number,
        tenant_name: apartment.tenant_name,
      },
    });
  } catch (error) {
    console.error("Error generating contract:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

