"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Home,
  Building,
  Edit2,
  Trash2,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  User,
  AlertTriangle,
  DoorOpen,
  DoorClosed,
  MapPin,
  Droplets,
  FileText,
  Download,
  Upload,
  CheckCircle2,
  Loader2,
  CreditCard,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { Apartment } from "@/types";

export default function ApartmentDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const apartmentId = params.id as string;

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [isUploadingContract, setIsUploadingContract] = useState(false);
  const [isUploadingIdDocument, setIsUploadingIdDocument] = useState(false);
  const [contractTemplates, setContractTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchApartmentData();
    fetchContractTemplates();
  }, [session, status, router, apartmentId]);

  const fetchContractTemplates = async () => {
    try {
      const response = await fetch("/api/contracts/templates");
      if (response.ok) {
        const data = await response.json();
        const templates = data.data || [];
        setContractTemplates(templates);
        
        // Set default template if available
        const defaultTemplate = templates.find((t: any) => t.is_default);
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id.toString());
        } else if (templates.length > 0) {
          setSelectedTemplateId(templates[0].id.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching contract templates:", error);
    }
  };

  const fetchApartmentData = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/apartments/${apartmentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Apartment not found");
          router.push("/admin/apartments");
          return;
        }
        throw new Error("Failed to fetch apartment");
      }

      const data = await response.json();
      setApartment(data.data);
    } catch (error) {
      console.error("Error fetching apartment data:", error);
      toast.error("Failed to load apartment data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!apartment) return;

    if (
      !confirm(
        `Are you sure you want to delete apartment ${apartment.apartment_number}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/apartments/${apartmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Apartment deleted successfully");
        router.push("/admin/apartments");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete apartment");
      }
    } catch (error) {
      console.error("Error deleting apartment:", error);
      toast.error("Failed to delete apartment");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleGenerateContract = async () => {
    if (!apartment) return;

    if (!selectedTemplateId) {
      toast.error("Please select a contract template");
      return;
    }

    if (!apartment.tenant_name) {
      toast.error("Cannot generate contract for vacant apartment");
      return;
    }

    try {
      setIsGeneratingContract(true);

      const response = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: parseInt(selectedTemplateId),
          apartment_id: apartmentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate contract");
      }

      const data = await response.json();
      
      // Create a downloadable file
      const blob = new Blob([data.data.content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Contract_${apartment.apartment_number}_${apartment.tenant_name?.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Contract generated and downloaded successfully");
    } catch (error) {
      console.error("Error generating contract:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate contract");
    } finally {
      setIsGeneratingContract(false);
    }
  };

  const handleContractUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !apartment) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    try {
      setIsUploadingContract(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "tenant_contract");
      formData.append("related_id", apartmentId);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload contract");
      }

      const uploadData = await uploadResponse.json();
      const contractPath = uploadData.data.path;

      // Update apartment with contract path
      const updateResponse = await fetch(`/api/apartments/${apartmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_contract_path: contractPath,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update apartment with contract");
      }

      toast.success("Signed contract uploaded successfully");
      fetchApartmentData(); // Refresh apartment data
    } catch (error) {
      console.error("Error uploading contract:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload contract");
    } finally {
      setIsUploadingContract(false);
    }
  };

  const handleDownloadSignedContract = () => {
    if (apartment?.tenant_contract_path) {
      window.open(apartment.tenant_contract_path, "_blank");
    }
  };

  const handleIdDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !apartment) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    try {
      setIsUploadingIdDocument(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "tenant_id");
      formData.append("related_id", apartmentId);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload ID document");
      }

      const uploadData = await uploadResponse.json();
      const documentPath = uploadData.data.path;

      // Update apartment with ID document path
      const updateResponse = await fetch(`/api/apartments/${apartmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id_document_path: documentPath,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update apartment with ID document");
      }

      toast.success("Tenant ID document uploaded successfully");
      fetchApartmentData(); // Refresh apartment data
    } catch (error) {
      console.error("Error uploading ID document:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload ID document");
    } finally {
      setIsUploadingIdDocument(false);
    }
  };

  const handleDownloadIdDocument = () => {
    if (apartment?.tenant_id_document_path) {
      window.open(apartment.tenant_id_document_path, "_blank");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading apartment details...</p>
        </div>
      </div>
    );
  }

  if (!apartment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/admin/apartments")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                Unit {apartment.apartment_number}
              </h1>
              <p className="text-sm text-gray-600">Apartment Details</p>
            </div>
            <span
              className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                apartment.is_occupied
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {apartment.is_occupied ? (
                <span className="flex items-center space-x-1">
                  <DoorClosed className="w-3 h-3" />
                  <span>Occupied</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1">
                  <DoorOpen className="w-3 h-3" />
                  <span>Vacant</span>
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Apartment Info Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
            <Home className="w-12 h-12 mb-2 opacity-90" />
            <h2 className="text-xl font-bold">Unit {apartment.apartment_number}</h2>
            <p className="text-blue-100 text-sm mt-1">{apartment.building?.name}</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Building Info */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Building
              </label>
              <div
                onClick={() => router.push(`/admin/buildings/${apartment.building_id}`)}
                className="mt-1 flex items-start space-x-2 cursor-pointer hover:text-blue-600 transition-colors"
              >
                <Building className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-medium">{apartment.building?.name}</p>
                  <p className="text-gray-600 text-sm flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {apartment.building?.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Unit Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Bedrooms
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {apartment.bedrooms}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Bathrooms
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {apartment.bathrooms}
                </p>
              </div>
              {apartment.floor_number && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Floor
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {apartment.floor_number}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Kitchen
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {apartment.kitchen ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center">
                  <Droplets className="w-3 h-3 mr-1" />
                  Water Meter (m³)
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {apartment.water_meter_reading != null 
                    ? Number(apartment.water_meter_reading).toFixed(2) 
                    : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Info */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Financial Details</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Monthly Rent
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ${apartment.rent_amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Security Deposit
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${apartment.deposit_amount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tenant Information */}
        {apartment.is_occupied && apartment.tenant_name ? (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tenant Information</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tenant Name
                </p>
                <p className="text-gray-900 font-medium mt-1">{apartment.tenant_name}</p>
              </div>

              {apartment.tenant_phone && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Phone Number
                  </p>
                  <div className="flex items-center mt-1">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <a
                      href={`tel:${apartment.tenant_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {apartment.tenant_phone}
                    </a>
                  </div>
                </div>
              )}

              {apartment.tenant_email && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Email Address
                  </p>
                  <div className="flex items-center mt-1">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <a
                      href={`mailto:${apartment.tenant_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {apartment.tenant_email}
                    </a>
                  </div>
                </div>
              )}

              {/* Tenant ID/Passport */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    ID / Passport
                  </p>
                </div>
                
                {apartment.tenant_id_passport && (
                  <p className="text-gray-900 font-medium mb-2">
                    {apartment.tenant_id_passport}
                  </p>
                )}

                {/* Upload ID Document */}
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      id="id-document-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleIdDocumentUpload}
                      disabled={isUploadingIdDocument}
                      className="hidden"
                    />
                    
                    {apartment.tenant_id_document_path ? (
                      <button
                        onClick={handleDownloadIdDocument}
                        className="flex-1 bg-green-50 border border-green-200 text-green-700 py-2 px-3 rounded-lg font-medium hover:bg-green-100 transition-colors flex items-center justify-center space-x-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View ID Document</span>
                        <Download className="w-3 h-3 ml-auto" />
                      </button>
                    ) : (
                      <label
                        htmlFor="id-document-upload"
                        className={`flex-1 bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg py-2 px-3 text-center cursor-pointer hover:bg-purple-100 transition-colors ${
                          isUploadingIdDocument ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {isUploadingIdDocument ? (
                            <>
                              <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />
                              <span className="text-xs text-purple-600 font-medium">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3 text-purple-600" />
                              <span className="text-xs text-purple-600 font-medium">
                                Upload ID Document
                              </span>
                            </>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {apartment.tenant_id_document_path 
                      ? "ID document uploaded" 
                      : "PDF, JPG, PNG (max 10MB)"}
                  </p>
                </div>
              </div>

              {(apartment.lease_start_date || apartment.lease_end_date) && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Lease Period
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(apartment.lease_start_date)}</span>
                    <span>→</span>
                    <span>{formatDate(apartment.lease_end_date)}</span>
                  </div>
                </div>
              )}

              {(apartment.emergency_contact_name || apartment.emergency_contact_phone) && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Emergency Contact
                    </p>
                  </div>
                  {apartment.emergency_contact_name && (
                    <p className="text-gray-900 font-medium">
                      {apartment.emergency_contact_name}
                    </p>
                  )}
                  {apartment.emergency_contact_phone && (
                    <div className="flex items-center mt-1">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <a
                        href={`tel:${apartment.emergency_contact_phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {apartment.emergency_contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-start space-x-3">
              <DoorOpen className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-orange-900 mb-1">
                  Apartment is Vacant
                </h3>
                <p className="text-sm text-orange-700">
                  This apartment is currently available for rent.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contract Management */}
        {apartment.is_occupied && apartment.tenant_name && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Contract Management</h3>
            </div>

            <div className="space-y-4">
              {/* Generate Contract */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generate New Contract
                </label>
                <div className="flex space-x-2">
                  {contractTemplates.length > 0 ? (
                    <>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                        disabled={isGeneratingContract}
                      >
                        {contractTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} {template.is_default ? "(Default)" : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleGenerateContract}
                        disabled={isGeneratingContract}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {isGeneratingContract ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>{isGeneratingContract ? "Generating..." : "Generate"}</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      No contract templates available. Please create a template in Settings → Contract Templates.
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Generate a contract using tenant and apartment information
                </p>
              </div>

              {/* Upload Signed Contract */}
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Signed Contract
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="contract-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleContractUpload}
                    disabled={isUploadingContract}
                    className="hidden"
                  />
                  <label
                    htmlFor="contract-upload"
                    className={`flex-1 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-3 text-center cursor-pointer hover:bg-blue-100 transition-colors ${
                      isUploadingContract ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {isUploadingContract ? (
                        <>
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          <span className="text-sm text-blue-600 font-medium">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-600 font-medium">
                            Click to upload signed contract
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, JPG, PNG (max 10MB)
                    </p>
                  </label>
                </div>
              </div>

              {/* View/Download Signed Contract */}
              {apartment.tenant_contract_path && (
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signed Contract
                  </label>
                  <button
                    onClick={handleDownloadSignedContract}
                    className="w-full bg-green-50 border border-green-200 text-green-700 py-3 px-4 rounded-lg font-medium hover:bg-green-100 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>View/Download Signed Contract</span>
                    <Download className="w-4 h-4 ml-auto" />
                  </button>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Contract has been uploaded and is available for download
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => router.push(`/admin/apartments/${apartmentId}/edit`)}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Apartment</span>
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-50 text-red-600 py-3 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

