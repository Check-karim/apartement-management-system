# Water Billing System Implementation Summary

## ✅ Completed Tasks

### 1. Database Schema Updates (`database.sql`)
- ✅ Added tenant document fields to `apartments` table:
  - `tenant_id_passport`: ID/Passport number
  - `tenant_phone_country_code`: Country code (default +250)
  - `tenant_id_document_path`: Path to ID/passport document
  - `tenant_contract_path`: Path to signed contract
  
- ✅ Created `water_invoices` table for WASAC bills
  - Tracks invoice number, dates, total m³, total amount
  - Auto-calculates price per m³
  - Links to buildings

- ✅ Created `pompe_settings` table for pump electricity costs
  - Per-building pump electricity configuration
  - Total price per period setting

- ✅ Created `water_bills` table for apartment water bills
  - Auto-calculates:
    - `used_m3` = current_meter_reading - previous_meter_reading
    - `water_amount` = used_m3 * price_per_m3
    - `pompe_amount` = used_m3 * pompe_price_per_m3
    - `total_amount` = water_amount + pompe_amount
  - Tracks SMS delivery status
  - Payment tracking

- ✅ Created `sms_notifications` table for SMS logs
  - Tracks all SMS attempts
  - Status tracking (pending, sent, failed, no_phone)

- ✅ Created `contract_templates` table
  - Customizable lease agreement templates
  - Template variables for dynamic content
  - Default template included

- ✅ Added database views:
  - `water_billing_summary`: Comprehensive water bill view
  - `water_billing_analytics`: Analytics by building
  - `apartment_tenant_details`: Enhanced apartment view with tenant info

- ✅ Updated currency settings:
  - Default currency: Rwandan Franc (RWF)
  - Added SMS configuration settings

- ✅ Inserted default contract template with placeholders

### 2. API Endpoints Created

#### Water Invoices (`/api/water/invoices`)
- ✅ GET `/api/water/invoices` - List all invoices (filterable by building)
- ✅ POST `/api/water/invoices` - Create new invoice
- ✅ GET `/api/water/invoices/[id]` - Get single invoice
- ✅ PUT `/api/water/invoices/[id]` - Update invoice
- ✅ DELETE `/api/water/invoices/[id]` - Delete invoice

#### Water Bills (`/api/water/bills`)
- ✅ GET `/api/water/bills` - List all bills (filterable)
- ✅ POST `/api/water/bills` - Generate bills from invoice
  - Accepts meter_readings array
  - Calculates water + pompe charges
  - Updates apartment meter readings
- ✅ GET `/api/water/bills/[id]` - Get single bill
- ✅ PUT `/api/water/bills/[id]` - Update bill (mark as paid)
- ✅ DELETE `/api/water/bills/[id]` - Delete bill (admin only)

#### Pompe Settings (`/api/water/pompe`)
- ✅ GET `/api/water/pompe` - Get pompe settings (filterable by building)
- ✅ POST `/api/water/pompe` - Create/update pompe settings

#### SMS Notifications (`/api/sms/send`)
- ✅ POST `/api/sms/send` - Send SMS for water bills
  - Formats message with bill details
  - Handles missing phone numbers
  - Logs all attempts
  - Returns detailed results (sent, failed, no_phone)

#### Contract Templates (`/api/contracts/templates`)
- ✅ GET `/api/contracts/templates` - List all templates
- ✅ POST `/api/contracts/templates` - Create new template
- ✅ GET `/api/contracts/templates/[id]` - Get single template
- ✅ PUT `/api/contracts/templates/[id]` - Update template
- ✅ DELETE `/api/contracts/templates/[id]` - Soft delete template

#### Contract Generation (`/api/contracts/generate`)
- ✅ POST `/api/contracts/generate` - Generate contract from template
  - Replaces all placeholders with apartment/tenant data
  - Returns formatted contract content

#### File Upload (`/api/upload`)
- ✅ POST `/api/upload` - Upload files
  - Supports tenant documents, contracts, invoices
  - Max 10MB file size
  - Stores in organized folders

### 3. UI Pages Created

#### Admin Dashboard Updates
- ✅ Added "Water Billing" section with:
  - Water Invoices link
  - Water Bills link
- ✅ Updated Settings section:
  - Replaced Water Formula with Contract Templates

#### Water Management
- ✅ `/admin/water/invoices` - Water Invoices List Page
  - Search and filter invoices
  - Filter by building
  - Create new invoice modal
  - Generate bills button per invoice
  - Delete invoice functionality
  - Displays invoice details and calculations

## 🚧 Remaining Tasks

### 4. UI Pages to Create

#### Water Bills (`/admin/water/bills`)
- **Main Bills List Page**:
  - View all generated bills
  - Filter by building, apartment, paid status
  - Mark bills as paid
  - Send SMS notifications (individual or bulk)
  - View bill details

#### Water Bills Generation (`/admin/water/bills/generate`)
- **Generate Bills Page**:
  - Select invoice (or auto-load from query param)
  - Display all apartments in building
  - Input current meter readings for each apartment
  - Show pompe settings for building
  - Calculate preview of bills
  - Generate bills button
  - Show success/error results

#### Enhanced Apartment Management
- **Update Edit Apartment Page** (`/admin/apartments/[id]/edit`):
  - Add tenant ID/Passport field
  - Add phone number with country code selector
  - Add file upload for ID/Passport document
  - Add file upload for signed contract
  - Show download buttons for uploaded documents
  - Generate contract button using template

#### Contract Templates (`/admin/settings/contracts`)
- **Templates List Page**:
  - View all contract templates
  - Create new template
  - Edit existing templates
  - Set default template
  - Template preview
  - Available placeholders documentation

- **Template Editor**:
  - Rich text editor or textarea
  - List of available placeholders
  - Preview functionality
  - Save/update template

#### SMS Notification Interface
- **Send SMS Page** (can be part of water bills page):
  - Select bills to send SMS for
  - Preview SMS message
  - Send button
  - Results display (sent, failed, no_phone)
  - Resend failed SMS option
  - Notify admin/manager for tenants without phone numbers

### 5. Additional Features Needed

#### Pompe Settings Management
- **UI for Pompe Settings** (can be in building details):
  - View/edit pompe electricity cost per building
  - Update total price per period
  - Activate/deactivate pompe billing

#### Water Billing Reports
- **Add to Reports Section**:
  - Water consumption reports
  - Payment status reports
  - Building-wise water billing analytics
  - Export capabilities

### 6. Documentation Updates

#### `.cursorrules` File Updates Needed:
- Add water billing patterns
- Document water calculation formulas
- Add SMS notification guidelines
- Document contract template system
- Add file upload guidelines
- Update API routes documentation
- Add water billing UI patterns

## Water Billing Formula Implementation

### Water Bill Calculation:
```
1. used_m3 = current_meter_reading - previous_meter_reading
2. price_per_m3 = total_invoice_amount / total_invoice_m3
3. water_amount = used_m3 * price_per_m3
```

### Pompe Electricity Calculation:
```
1. pompe_price_per_m3 = total_pompe_price / total_invoice_m3
2. pompe_amount = used_m3 * pompe_price_per_m3
```

### Total Bill:
```
total_water_bill = water_amount + pompe_amount
```

## SMS Notification Flow

1. Generate water bills for building
2. System attempts to send SMS to each tenant
3. Track delivery status:
   - **Sent**: SMS delivered successfully
   - **Failed**: SMS delivery failed (with error message)
   - **No Phone**: Tenant has no phone number
4. For "No Phone" cases:
   - Notify building manager
   - Notify admin
   - Provide resend option when phone number is added
5. Resend functionality for failed SMS

## Contract Template System

### Available Placeholders:
- `{{BUILDING_NAME}}`
- `{{BUILDING_ADDRESS}}`
- `{{MANAGER_PHONE}}`
- `{{TENANT_NAME}}`
- `{{TENANT_ID_PASSPORT}}`
- `{{TENANT_PHONE}}`
- `{{TENANT_EMAIL}}`
- `{{APARTMENT_NUMBER}}`
- `{{FLOOR_NUMBER}}`
- `{{BEDROOMS}}`
- `{{BATHROOMS}}`
- `{{RENT_AMOUNT}}`
- `{{DEPOSIT_AMOUNT}}`
- `{{CURRENCY_SYMBOL}}`
- `{{LEASE_START_DATE}}`
- `{{LEASE_END_DATE}}`
- `{{EMERGENCY_CONTACT_NAME}}`
- `{{EMERGENCY_CONTACT_PHONE}}`
- `{{WATER_METER_READING}}`

### Contract Generation Flow:
1. Admin/Manager edits apartment with tenant
2. Clicks "Generate Contract" button
3. Selects template (or uses default)
4. System replaces all placeholders
5. Preview generated contract
6. Download as PDF or print
7. Upload signed contract back to system

## File Storage Structure

```
public/
  uploads/
    tenant_id/          # ID/Passport documents
    tenant_contract/    # Signed contracts
    water_invoice/      # WASAC invoice files (future)
```

## Next Steps Priority

1. **HIGH PRIORITY**:
   - Create water bills generation page
   - Create water bills list page with SMS sending
   - Update apartment edit page with tenant documents
   
2. **MEDIUM PRIORITY**:
   - Create contract templates management page
   - Add pompe settings UI
   - Enhance water bills with payment tracking
   
3. **LOW PRIORITY**:
   - Add water billing reports
   - Implement PDF generation for contracts
   - Add email notifications alongside SMS

## Testing Checklist

- [ ] Create water invoice
- [ ] Generate water bills from invoice
- [ ] Send SMS notifications (test all scenarios)
- [ ] Upload tenant documents
- [ ] Generate contract from template
- [ ] Download uploaded documents
- [ ] Mark water bill as paid
- [ ] Filter and search functionality
- [ ] Role-based access (admin vs manager)
- [ ] Mobile responsiveness
- [ ] Error handling

## Notes for Developer

- SMS sending is currently simulated (90% success rate)
- To integrate real SMS:
  - Choose provider (Twilio, Africa's Talking, etc.)
  - Update `/api/sms/send` endpoint
  - Add API credentials to system_settings
  - Implement actual SMS API calls
- File uploads store paths in database, actual files in public/uploads
- Water meter readings should be validated (current >= previous)
- Consider adding bulk actions for common operations
- Add confirmation dialogs for destructive actions
- Implement proper error boundaries in UI
- Add loading states for all async operations

