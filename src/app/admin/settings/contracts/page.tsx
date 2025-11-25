"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, FileText, Edit2, Trash2, Check, Eye, X } from "lucide-react";
import toast from "react-hot-toast";

interface ContractTemplate {
  id: number;
  name: string;
  description: string;
  content: string;
  is_active: boolean;
  is_default: boolean;
  created_by_name?: string;
  created_at: string;
}

const AVAILABLE_PLACEHOLDERS = [
  { key: "{{BUILDING_NAME}}", description: "Building name" },
  { key: "{{BUILDING_ADDRESS}}", description: "Building address" },
  { key: "{{MANAGER_PHONE}}", description: "Manager phone number" },
  { key: "{{TENANT_NAME}}", description: "Tenant full name" },
  { key: "{{TENANT_ID_PASSPORT}}", description: "Tenant ID or passport number" },
  { key: "{{TENANT_PHONE}}", description: "Tenant phone number" },
  { key: "{{TENANT_EMAIL}}", description: "Tenant email address" },
  { key: "{{APARTMENT_NUMBER}}", description: "Apartment unit number" },
  { key: "{{FLOOR_NUMBER}}", description: "Floor number" },
  { key: "{{BEDROOMS}}", description: "Number of bedrooms" },
  { key: "{{BATHROOMS}}", description: "Number of bathrooms" },
  { key: "{{RENT_AMOUNT}}", description: "Monthly rent amount" },
  { key: "{{DEPOSIT_AMOUNT}}", description: "Security deposit amount" },
  { key: "{{CURRENCY_SYMBOL}}", description: "Currency symbol (e.g., FRw)" },
  { key: "{{LEASE_START_DATE}}", description: "Lease start date" },
  { key: "{{LEASE_END_DATE}}", description: "Lease end date" },
  { key: "{{EMERGENCY_CONTACT_NAME}}", description: "Emergency contact name" },
  { key: "{{EMERGENCY_CONTACT_PHONE}}", description: "Emergency contact phone" },
  { key: "{{WATER_METER_READING}}", description: "Water meter reading at move-in" },
];

export default function ContractTemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    is_default: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchTemplates();
  }, [session, status, router]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/contracts/templates");
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      } else {
        toast.error("Failed to load templates");
      }
    } catch (error) {
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (template: ContractTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      content: template.content,
      is_default: template.is_default,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: "",
      content: "",
      is_default: false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.content) {
      toast.error("Name and content are required");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const url = editingTemplate 
        ? `/api/contracts/templates/${editingTemplate.id}`
        : "/api/contracts/templates";
      
      const method = editingTemplate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingTemplate ? "Template updated successfully" : "Template created successfully");
        setShowModal(false);
        fetchTemplates();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save template");
      }
    } catch (error) {
      toast.error("Failed to save template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (templateId: number, templateName: string) => {
    if (!confirm(`Are you sure you want to delete "${templateName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/contracts/templates/${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Template deleted successfully");
        fetchTemplates();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete template");
      }
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const handleSetDefault = async (templateId: number) => {
    try {
      const response = await fetch(`/api/contracts/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });

      if (response.ok) {
        toast.success("Default template updated");
        fetchTemplates();
      } else {
        toast.error("Failed to update default template");
      }
    } catch (error) {
      toast.error("Failed to update default template");
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    setFormData({
      ...formData,
      content: formData.content + placeholder,
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push("/admin/settings")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Contract Templates</h1>
              <p className="text-sm text-gray-600">{templates.length} templates</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            About Contract Templates
          </h3>
          <p className="text-sm text-blue-800 mb-2">
            Create customizable lease agreement templates with dynamic placeholders that auto-fill tenant and apartment information.
          </p>
          <button
            onClick={() => setShowPreview(true)}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            View Available Placeholders →
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-600 mb-6">Create your first contract template to get started</p>
            <button
              onClick={handleCreate}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Create Template
            </button>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
                    {template.is_default && (
                      <span className="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Created {new Date(template.created_at).toLocaleDateString()}
                    {template.created_by_name && ` by ${template.created_by_name}`}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                {!template.is_default && (
                  <button
                    onClick={() => handleSetDefault(template.id)}
                    className="flex-1 border border-teal-300 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Set as Default</span>
                  </button>
                )}
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                {!template.is_default && (
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTemplate ? "Edit Template" : "Create Template"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Standard Lease Agreement"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Brief description of this template"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Template Content *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="text-xs text-teal-600 font-medium hover:underline flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Placeholders</span>
                  </button>
                </div>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900 placeholder-gray-500 font-mono text-sm"
                  placeholder="Enter your contract template with placeholders..."
                  rows={15}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use placeholders like {`{{TENANT_NAME}}`}, {`{{RENT_AMOUNT}}`}, etc. Click "View Placeholders" to see all available options.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-600"
                />
                <label htmlFor="is_default" className="text-sm text-gray-700">
                  Set as default template
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Placeholders Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Available Placeholders</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Click any placeholder to copy it to your clipboard. These will be automatically replaced with actual data when generating contracts.
              </p>
              
              <div className="space-y-2">
                {AVAILABLE_PLACEHOLDERS.map((placeholder) => (
                  <button
                    key={placeholder.key}
                    onClick={() => {
                      navigator.clipboard.writeText(placeholder.key);
                      toast.success("Placeholder copied!");
                      if (showModal) {
                        insertPlaceholder(placeholder.key);
                      }
                    }}
                    className="w-full flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <code className="text-sm font-mono text-teal-700 font-medium">
                        {placeholder.key}
                      </code>
                      <p className="text-xs text-gray-600 mt-1">{placeholder.description}</p>
                    </div>
                    <div className="text-teal-600 text-xs">Click to copy</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => setShowPreview(false)}
                className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

