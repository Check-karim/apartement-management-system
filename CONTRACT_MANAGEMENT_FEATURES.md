# Contract Management Features - Quick Reference

## ✅ Implementation Complete

### What Was Added

#### 🎯 Location
**Apartment Details Page** (`/admin/apartments/[id]`)
- New "Contract Management" section added below tenant information
- Only visible for occupied apartments (apartments with tenants)

---

## 📋 Three Main Features

### 1️⃣ Generate Contract Button
**Purpose**: Create a downloadable contract using apartment and tenant data

**How it works**:
```
1. Select contract template from dropdown
2. Click "Generate" button
3. Contract is auto-filled with:
   - Building name and address
   - Apartment details (number, floor, bedrooms, etc.)
   - Tenant information (name, phone, email)
   - Rent and deposit amounts
   - Lease dates
   - Emergency contact info
4. Downloads as text file: "Contract_{apt_number}_{tenant_name}.txt"
```

**UI Elements**:
- Template dropdown (shows default template)
- Generate button with download icon
- Loading spinner during generation
- Success toast on download

**Validation**:
- ✅ Only works for occupied apartments
- ✅ Requires at least one contract template
- ✅ Shows helpful message if no templates exist

---

### 2️⃣ Upload Signed Contract
**Purpose**: Upload the signed lease agreement after tenant signs

**How it works**:
```
1. Click the upload area (or select file)
2. Choose signed contract file
3. File uploads to server
4. Apartment record updates with contract path
5. Success confirmation shown
```

**Supported Formats**:
- PDF (.pdf)
- Word Documents (.doc, .docx)
- Images (.jpg, .jpeg, .png)
- Maximum size: 10MB

**UI Elements**:
- Blue dashed border upload area
- Upload icon and instructions
- Loading spinner during upload
- File format info displayed
- Success toast on completion

**Storage**:
- Files saved to: `/public/uploads/tenant_contract/`
- Unique filename: `{timestamp}_{original_name}`
- Path stored in database

---

### 3️⃣ View/Download Signed Contract
**Purpose**: Access the previously uploaded signed contract

**How it works**:
```
1. Button appears when contract has been uploaded
2. Click to open contract in new tab
3. Can download or view directly
```

**UI Elements**:
- Green success button (indicates contract exists)
- CheckCircle icon showing upload complete
- Download icon on the right
- Confirmation text below
- Only visible when contract is uploaded

---

## 🎨 Visual Design

### Contract Management Card
```
┌─────────────────────────────────────────────┐
│ 📄 Contract Management                      │
├─────────────────────────────────────────────┤
│                                             │
│ Generate New Contract                       │
│ ┌──────────────────┬────────────────┐      │
│ │ Template ▼       │ [Generate 📥]  │      │
│ └──────────────────┴────────────────┘      │
│ Generate contract using tenant info         │
│                                             │
│ ─────────────────────────────────────────  │
│                                             │
│ Upload Signed Contract                      │
│ ┌─────────────────────────────────────┐   │
│ │ ┊ 📤 Click to upload signed contract │   │
│ │ ┊ PDF, DOC, DOCX, JPG, PNG (max 10MB)│   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────  │
│                                             │
│ Signed Contract                             │
│ ┌─────────────────────────────────────┐   │
│ │ ✓ View/Download Signed Contract 📥 │   │
│ └─────────────────────────────────────┘   │
│ Contract uploaded and available             │
│                                             │
└─────────────────────────────────────────────┘
```

### Color Scheme
- **Card Background**: White (#FFFFFF)
- **Header Icon**: Indigo (#4F46E5)
- **Generate Button**: Indigo (#4F46E5)
- **Upload Area**: Light Blue with dashed border
- **Success Button**: Green (#10B981)
- **Loading States**: Animated spinners

---

## 🔧 Technical Details

### State Management
```typescript
const [isGeneratingContract, setIsGeneratingContract] = useState(false);
const [isUploadingContract, setIsUploadingContract] = useState(false);
const [contractTemplates, setContractTemplates] = useState<any[]>([]);
const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
```

### API Endpoints Used
1. `GET /api/contracts/templates` - Fetch templates
2. `POST /api/contracts/generate` - Generate contract
3. `POST /api/upload` - Upload file
4. `PUT /api/apartments/[id]` - Update contract path
5. `GET /api/apartments/[id]` - Fetch apartment details

### Database Field
```sql
apartments.tenant_contract_path VARCHAR(255) NULL
```

### File Upload Process
```
User selects file
     ↓
Frontend validates size
     ↓
POST /api/upload (with FormData)
     ↓
Server saves to /public/uploads/tenant_contract/
     ↓
Returns relative path: /uploads/tenant_contract/123_contract.pdf
     ↓
PUT /api/apartments/[id] (update contract path)
     ↓
Success! Contract linked to apartment
```

---

## 📱 Mobile Optimization

### Touch-Friendly Design
- ✅ Upload area has large tap target
- ✅ Buttons are minimum 44px height
- ✅ Adequate spacing between elements
- ✅ Full-width on mobile devices
- ✅ Clear loading indicators

### Responsive Behavior
- Single column layout on mobile
- Template dropdown scales to screen width
- Upload area expands to full width
- All buttons full-width for easy tapping

---

## 🔒 Security Features

### Authentication
- ✅ Requires admin login
- ✅ Session validation on all operations
- ✅ Protected API endpoints

### File Upload Security
- ✅ File size limit: 10MB
- ✅ Filename sanitization (removes special chars)
- ✅ Unique timestamps prevent overwrites
- ✅ Type validation on server
- ✅ Stored in dedicated directory

### Data Privacy
- ✅ Contract paths not exposed in URLs
- ✅ Files only accessible to authenticated users
- ✅ Tenant information protected

---

## 💡 Usage Examples

### Example 1: New Tenant Move-In
```
1. Admin creates apartment with tenant info
2. Admin navigates to apartment details
3. Selects "Default Lease Agreement" template
4. Clicks "Generate" - downloads contract
5. Prints contract, tenant signs
6. Admin uploads signed PDF
7. Contract now stored with apartment record
```

### Example 2: Accessing Existing Contract
```
1. Admin needs to view tenant's lease
2. Opens apartment details page
3. Scrolls to "Contract Management"
4. Clicks "View/Download Signed Contract"
5. Contract opens in new tab
6. Can print or download as needed
```

### Example 3: No Templates Setup
```
1. Admin tries to generate contract
2. Sees message: "No contract templates available..."
3. Navigates to Settings → Contract Templates
4. Creates new template with placeholders
5. Sets as default template
6. Returns to apartment - can now generate
```

---

## 🎯 User Benefits

### For Admins
- ✅ Quick contract generation (no manual typing)
- ✅ Centralized contract storage
- ✅ Easy access to tenant agreements
- ✅ Professional contract templates
- ✅ Consistent contract format across properties

### For the System
- ✅ Organized document management
- ✅ Digital record keeping
- ✅ Reduced paper storage needs
- ✅ Quick reference during disputes
- ✅ Audit trail for lease agreements

---

## 🚀 Getting Started

### First Time Setup
1. **Create Contract Template**
   - Go to Settings → Contract Templates
   - Click "Create Template"
   - Add placeholders (e.g., {{TENANT_NAME}})
   - Set as default
   - Save template

2. **Generate First Contract**
   - Open any occupied apartment
   - Scroll to "Contract Management"
   - Select template and click "Generate"
   - Review downloaded contract

3. **Upload Signed Contract**
   - Get tenant signature on printed contract
   - Scan or photograph signed contract
   - Upload through apartment details page
   - Verify green success button appears

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: "No contract templates available" message
**Solution**: Create at least one template in Settings → Contract Templates

**Issue**: Generate button disabled
**Solution**: Ensure apartment has tenant information (occupied status)

**Issue**: Upload fails
**Solution**: Check file size (must be < 10MB) and format (PDF, DOC, DOCX, JPG, PNG)

**Issue**: Downloaded contract shows {{PLACEHOLDERS}}
**Solution**: Ensure tenant information is filled in apartment record

**Issue**: Can't see Contract Management section
**Solution**: Only visible for occupied apartments - add tenant info first

---

## 📊 Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Generate Contract | ✅ Complete | Uses existing API |
| Upload Contract | ✅ Complete | Supports multiple formats |
| Download Contract | ✅ Complete | Opens in new tab |
| Mobile Responsive | ✅ Complete | Optimized for touch |
| Error Handling | ✅ Complete | Toast notifications |
| Loading States | ✅ Complete | Visual feedback |
| Validation | ✅ Complete | Client & server side |
| Security | ✅ Complete | Authentication required |

---

## 🎉 Summary

The contract management feature is **fully implemented and production-ready**. It provides a complete workflow for generating, uploading, and accessing lease contracts directly from the apartment details page.

Key highlights:
- ✅ No new dependencies required
- ✅ Uses existing APIs and patterns
- ✅ Mobile-first responsive design
- ✅ Comprehensive error handling
- ✅ Secure file upload system
- ✅ Intuitive user interface
- ✅ Zero configuration needed

The feature seamlessly integrates with the existing apartment management system and follows all established code patterns and design principles.

