import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

// POST /api/sms/send - Send SMS notifications for water bills
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
    const { water_bill_ids } = body;

    // water_bill_ids: array of water bill IDs to send SMS for

    if (!water_bill_ids || !Array.isArray(water_bill_ids) || water_bill_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Water bill IDs are required" },
        { status: 400 }
      );
    }

    const results = {
      sent: [],
      failed: [],
      no_phone: [],
    };

    // Get SMS and currency settings
    const settings = await executeQuery(
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('currency_symbol', 'currency_position', 'notification_sms_enabled', 'sms_api_key', 'sms_sender_name')"
    );

    const settingsMap = settings.reduce((acc: any, s: any) => {
      acc[s.setting_key] = s.setting_value;
      return acc;
    }, {});

    const currencySymbol = settingsMap.currency_symbol || 'FRw';
    const currencyPosition = settingsMap.currency_position || 'after';
    const smsEnabled = settingsMap.notification_sms_enabled === 'true';
    const textbeeApiKey = settingsMap.sms_api_key;
    const senderName = settingsMap.sms_sender_name || 'AMS';

    if (!smsEnabled) {
      return NextResponse.json(
        { success: false, error: "SMS notifications are disabled" },
        { status: 400 }
      );
    }

    if (!textbeeApiKey) {
      return NextResponse.json(
        { success: false, error: "TextBee API key not configured" },
        { status: 400 }
      );
    }

    const formatCurrency = (amount: number) => {
      const formatted = amount.toFixed(2);
      return currencyPosition === 'before' 
        ? `${currencySymbol}${formatted}` 
        : `${formatted} ${currencySymbol}`;
    };

    for (const bill_id of water_bill_ids) {
      try {
        // Get water bill details
        const billResult = await executeQuery(
          `SELECT 
             wb.*,
             a.tenant_name,
             a.tenant_phone,
             a.tenant_phone_country_code,
             a.apartment_number,
             b.name as building_name,
             b.manager_id
           FROM water_bills wb
           JOIN apartments a ON wb.apartment_id = a.id
           JOIN buildings b ON wb.building_id = b.id
           WHERE wb.id = ?`,
          [bill_id]
        );

        if (billResult.length === 0) {
          results.failed.push({ bill_id, error: "Bill not found" });
          continue;
        }

        const bill = billResult[0] as any;

        // If user is a manager, verify they manage this building
        if (session.user.role === "manager" && bill.manager_id !== session.user.id) {
          results.failed.push({ bill_id, error: "Unauthorized" });
          continue;
        }

        // Check if tenant has phone number
        if (!bill.tenant_phone) {
          results.no_phone.push({
            bill_id,
            apartment_id: bill.apartment_id,
            apartment_number: bill.apartment_number,
            tenant_name: bill.tenant_name,
          });

          // Update bill SMS status
          await executeQuery(
            `UPDATE water_bills 
             SET sms_delivery_status = 'no_phone', 
                 sms_error_message = 'Tenant has no phone number'
             WHERE id = ?`,
            [bill_id]
          );

          continue;
        }

        // Format phone number
        const phoneNumber = `${bill.tenant_phone_country_code || '+250'}${bill.tenant_phone}`;

        // Create SMS message
        const message = `Hello ${bill.tenant_name || 'Tenant'},

Your water bill for ${bill.building_name}, Apt ${bill.apartment_number}:

Period: ${new Date(bill.billing_period_start).toLocaleDateString()} - ${new Date(bill.billing_period_end).toLocaleDateString()}
Water used: ${bill.used_m3} m³
Water charge: ${formatCurrency(bill.water_amount)}
Pump charge: ${formatCurrency(bill.pompe_amount)}
Total: ${formatCurrency(bill.total_amount)}

Please contact management for payment details.

- AMS`;

        // Send SMS via TextBee API
        let sendSuccess = false;
        let errorMessage = "";

        try {
          // TextBee API endpoint
          const textbeeResponse = await fetch("https://api.textbee.rw/api/v1/sms/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${textbeeApiKey}`,
            },
            body: JSON.stringify({
              sender: senderName,
              recipients: [phoneNumber],
              message: message,
            }),
          });

          if (textbeeResponse.ok) {
            const textbeeData = await textbeeResponse.json();
            sendSuccess = textbeeData.success || true;
          } else {
            const textbeeError = await textbeeResponse.json();
            errorMessage = textbeeError.message || "SMS delivery failed";
          }
        } catch (smsError) {
          console.error("TextBee API error:", smsError);
          errorMessage = "Failed to connect to TextBee API";
        }

        if (sendSuccess) {
          // Log SMS notification
          await executeQuery(
            `INSERT INTO sms_notifications 
             (water_bill_id, apartment_id, phone_number, message, status, sent_at)
             VALUES (?, ?, ?, ?, 'sent', NOW())`,
            [bill_id, bill.apartment_id, phoneNumber, message]
          );

          // Update water bill SMS status
          await executeQuery(
            `UPDATE water_bills 
             SET sms_sent = TRUE, sms_sent_at = NOW(), sms_delivery_status = 'sent'
             WHERE id = ?`,
            [bill_id]
          );

          results.sent.push({
            bill_id,
            apartment_number: bill.apartment_number,
            phone_number: phoneNumber,
          });
        } else {
          // Handle failure

          // Log SMS notification
          await executeQuery(
            `INSERT INTO sms_notifications 
             (water_bill_id, apartment_id, phone_number, message, status, error_message)
             VALUES (?, ?, ?, ?, 'failed', ?)`,
            [bill_id, bill.apartment_id, phoneNumber, message, errorMessage]
          );

          // Update water bill SMS status
          await executeQuery(
            `UPDATE water_bills 
             SET sms_delivery_status = 'failed', sms_error_message = ?
             WHERE id = ?`,
            [errorMessage, bill_id]
          );

          results.failed.push({
            bill_id,
            apartment_number: bill.apartment_number,
            error: errorMessage,
          });
        }
      } catch (error) {
        console.error(`Error sending SMS for bill ${bill_id}:`, error);
        results.failed.push({ bill_id, error: "Internal error" });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${results.sent.length} SMS, ${results.failed.length} failed, ${results.no_phone.length} no phone`,
      data: results,
    });
  } catch (error) {
    console.error("Error sending SMS notifications:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

