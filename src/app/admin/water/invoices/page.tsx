"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, ArrowLeft, Search, Eye, Edit2, Trash2, Building, Calendar, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface WaterInvoice {
  id: number;
  building_id: number;
  building_name: string;
  invoice_number: string;
  invoice_date: string;
  billing_period_start: string;
  billing_period_end: string;
  total_m3: number;
  total_amount: number;
  price_per_m3: number;
  invoice_file_path?: string;
  notes?: string;
  created_by_name?: string;
  created_at: string;
}

interface Building {
  id: number;
  name: string;
}

export default function WaterInvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<WaterInvoice[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<WaterInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    building_id: "",
    invoice_number: "",
    invoice_date: "",
    billing_period_start: "",
    billing_period_end: "",
    total_m3: "",
    total_amount: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }

    fetchData();
  }, [session, status, router]);

  useEffect(() => {
    filterData();
  }, [searchQuery, selectedBuilding, invoices]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [invoicesRes, buildingsRes] = await Promise.all([
        fetch("/api/water/invoices"),
        fetch("/api/buildings"),
      ]);

      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data.data || []);
      }

      if (buildingsRes.ok) {
        const data = await buildingsRes.json();
        setBuildings(data.data || []);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...invoices];

    if (searchQuery) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.building_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedBuilding) {
      filtered = filtered.filter((invoice) => invoice.building_id.toString() === selectedBuilding);
    }

    setFilteredInvoices(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.building_id || !formData.invoice_number || !formData.total_m3 || !formData.total_amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/water/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          total_m3: parseFloat(formData.total_m3),
          total_amount: parseFloat(formData.total_amount),
        }),
      });

      if (response.ok) {
        toast.success("Water invoice created successfully");
        setShowCreateModal(false);
        setFormData({
          building_id: "",
          invoice_number: "",
          invoice_date: "",
          billing_period_start: "",
          billing_period_end: "",
          total_m3: "",
          total_amount: "",
          notes: "",
        });
        fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create invoice");
      }
    } catch (error) {
      toast.error("Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (invoiceId: number, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/water/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Invoice deleted successfully");
        fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete invoice");
      }
    } catch (error) {
      toast.error("Failed to delete invoice");
    }
  };

  const handleGenerateBills = (invoiceId: number) => {
    router.push(`/admin/water/bills/generate?invoice_id=${invoiceId}`);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading invoices...</p>
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
              onClick={() => router.push("/admin")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Water Invoices</h1>
              <p className="text-sm text-gray-600">{invoices.length} total invoices</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-cyan-600 text-white p-2 rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number or building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>

            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-gray-900"
            >
              <option value="">All Buildings</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || selectedBuilding ? "No invoices found" : "No invoices yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedBuilding
                ? "Try adjusting your filters"
                : "Add your first WASAC invoice to get started"}
            </p>
            {!searchQuery && !selectedBuilding && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-cyan-700 transition-colors"
              >
                Add First Invoice
              </button>
            )}
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {invoice.invoice_number}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <Building className="w-4 h-4" />
                    <span>{invoice.building_name}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Invoice Date</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(invoice.invoice_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Total m³</p>
                  <p className="text-gray-900 font-medium">{invoice.total_m3.toFixed(2)} m³</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Total Amount</p>
                  <p className="text-gray-900 font-medium">{invoice.total_amount.toFixed(2)} FRw</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Price/m³</p>
                  <p className="text-gray-900 font-medium">{invoice.price_per_m3.toFixed(2)} FRw</p>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                <Calendar className="w-4 h-4 inline mr-1" />
                Period: {new Date(invoice.billing_period_start).toLocaleDateString()} - {new Date(invoice.billing_period_end).toLocaleDateString()}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleGenerateBills(invoice.id)}
                  className="flex-1 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
                >
                  Generate Bills
                </button>
                <button
                  onClick={() => handleDelete(invoice.id, invoice.invoice_number)}
                  className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Add Water Invoice</h2>
              <p className="text-sm text-gray-600">Enter WASAC invoice details</p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Building *
                </label>
                <select
                  value={formData.building_id}
                  onChange={(e) => setFormData({ ...formData, building_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-gray-900"
                  required
                >
                  <option value="">Select Building</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="e.g., INV-2024-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period Start *
                  </label>
                  <input
                    type="date"
                    value={formData.billing_period_start}
                    onChange={(e) => setFormData({ ...formData, billing_period_start: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period End *
                  </label>
                  <input
                    type="date"
                    value={formData.billing_period_end}
                    onChange={(e) => setFormData({ ...formData, billing_period_end: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total m³ *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_m3}
                    onChange={(e) => setFormData({ ...formData, total_m3: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="e.g., 1000.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (FRw) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="e.g., 500000.00"
                    required
                  />
                </div>
              </div>

              {formData.total_m3 && formData.total_amount && (
                <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                  <p className="text-sm text-cyan-900">
                    <span className="font-medium">Price per m³:</span>{" "}
                    {(parseFloat(formData.total_amount) / parseFloat(formData.total_m3)).toFixed(2)} FRw/m³
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

