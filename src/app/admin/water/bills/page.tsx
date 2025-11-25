"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Droplet, ArrowLeft, Search, MessageSquare, Check, X, AlertCircle, Building, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

interface WaterBill {
  id: number;
  apartment_number: string;
  tenant_name: string;
  tenant_phone: string;
  tenant_phone_country_code: string;
  building_name: string;
  billing_period_start: string;
  billing_period_end: string;
  previous_meter_reading: number;
  current_meter_reading: number;
  used_m3: number;
  water_amount: number;
  pompe_amount: number;
  total_amount: number;
  is_paid: boolean;
  payment_date?: string;
  sms_sent: boolean;
  sms_delivery_status: string;
  invoice_number: string;
}

interface BuildingOption {
  id: number;
  name: string;
}

export default function WaterBillsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bills, setBills] = useState<WaterBill[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [filteredBills, setFilteredBills] = useState<WaterBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [paidFilter, setPaidFilter] = useState("all");
  const [selectedBills, setSelectedBills] = useState<Set<number>>(new Set());
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [smsResults, setSmsResults] = useState<any>(null);

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
  }, [searchQuery, selectedBuilding, paidFilter, bills]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [billsRes, buildingsRes] = await Promise.all([
        fetch("/api/water/bills"),
        fetch("/api/buildings"),
      ]);

      if (billsRes.ok) {
        const data = await billsRes.json();
        setBills(data.data || []);
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
    let filtered = [...bills];

    if (searchQuery) {
      filtered = filtered.filter(
        (bill) =>
          bill.apartment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bill.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bill.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedBuilding) {
      filtered = filtered.filter((bill) => 
        buildings.find(b => b.id.toString() === selectedBuilding && b.name === bill.building_name)
      );
    }

    if (paidFilter !== "all") {
      filtered = filtered.filter((bill) => 
        paidFilter === "paid" ? bill.is_paid : !bill.is_paid
      );
    }

    setFilteredBills(filtered);
  };

  const toggleBillSelection = (billId: number) => {
    const newSelected = new Set(selectedBills);
    if (newSelected.has(billId)) {
      newSelected.delete(billId);
    } else {
      newSelected.add(billId);
    }
    setSelectedBills(newSelected);
  };

  const selectAllBills = () => {
    if (selectedBills.size === filteredBills.length) {
      setSelectedBills(new Set());
    } else {
      setSelectedBills(new Set(filteredBills.map(b => b.id)));
    }
  };

  const handleMarkAsPaid = async (billId: number, isPaid: boolean) => {
    try {
      const response = await fetch(`/api/water/bills/${billId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_paid: isPaid,
          payment_date: isPaid ? new Date().toISOString().split('T')[0] : null,
        }),
      });

      if (response.ok) {
        toast.success(isPaid ? "Marked as paid" : "Marked as unpaid");
        fetchData();
      } else {
        toast.error("Failed to update bill");
      }
    } catch (error) {
      toast.error("Failed to update bill");
    }
  };

  const handleSendSMS = async () => {
    const billsToSend = Array.from(selectedBills);
    
    if (billsToSend.length === 0) {
      toast.error("Please select at least one bill");
      return;
    }

    // Check for bills without phone numbers
    const billsWithoutPhone = bills.filter(b => 
      billsToSend.includes(b.id) && !b.tenant_phone
    );

    if (billsWithoutPhone.length > 0) {
      if (!confirm(`${billsWithoutPhone.length} tenant(s) don't have phone numbers. Continue sending to others?`)) {
        return;
      }
    }

    try {
      setIsSendingSMS(true);
      
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          water_bill_ids: billsToSend,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSmsResults(result.data);
        setShowSMSModal(true);
        toast.success(result.message);
        fetchData();
        setSelectedBills(new Set());
      } else {
        toast.error("Failed to send SMS");
      }
    } catch (error) {
      toast.error("Failed to send SMS");
    } finally {
      setIsSendingSMS(false);
    }
  };

  const calculateStats = () => {
    return {
      total: filteredBills.length,
      paid: filteredBills.filter(b => b.is_paid).length,
      unpaid: filteredBills.filter(b => !b.is_paid).length,
      totalAmount: filteredBills.reduce((sum, b) => sum + b.total_amount, 0),
      paidAmount: filteredBills.filter(b => b.is_paid).reduce((sum, b) => sum + b.total_amount, 0),
    };
  };

  const stats = calculateStats();

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading bills...</p>
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
              <h1 className="text-xl font-bold text-gray-900">Water Bills</h1>
              <p className="text-sm text-gray-600">{bills.length} total bills</p>
            </div>
            <button
              onClick={() => router.push("/admin/water/bills/generate")}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by apartment, tenant, or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
              >
                <option value="">All Buildings</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>

              <select
                value={paidFilter}
                onChange={(e) => setPaidFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
              >
                <option value="all">All Bills</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Bills</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <div className="flex items-center space-x-2 mt-2 text-xs">
              <span className="text-green-600">✓ {stats.paid}</span>
              <span className="text-red-600">✗ {stats.unpaid}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalAmount.toFixed(0)} <span className="text-sm">FRw</span>
            </p>
            <p className="text-xs text-green-600 mt-2">
              Paid: {stats.paidAmount.toFixed(0)} FRw
            </p>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedBills.size > 0 && (
          <div className="bg-blue-600 text-white rounded-xl p-4 shadow-lg flex items-center justify-between">
            <span className="font-medium">{selectedBills.size} selected</span>
            <button
              onClick={handleSendSMS}
              disabled={isSendingSMS}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSendingSMS ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Send SMS</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Select All Toggle */}
        {filteredBills.length > 0 && (
          <button
            onClick={selectAllBills}
            className="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium"
          >
            {selectedBills.size === filteredBills.length ? "Deselect All" : "Select All"}
          </button>
        )}

        {/* Bills List */}
        {filteredBills.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <Droplet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || selectedBuilding || paidFilter !== "all" ? "No bills found" : "No bills yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedBuilding || paidFilter !== "all"
                ? "Try adjusting your filters"
                : "Generate your first water bills to get started"}
            </p>
            {!searchQuery && !selectedBuilding && paidFilter === "all" && (
              <button
                onClick={() => router.push("/admin/water/bills/generate")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Generate Bills
              </button>
            )}
          </div>
        ) : (
          filteredBills.map((bill) => (
            <div 
              key={bill.id} 
              className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-2 ${
                selectedBills.has(bill.id) ? "border-blue-400" : "border-transparent"
              }`}
              onClick={() => toggleBillSelection(bill.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      Apt {bill.apartment_number}
                    </h3>
                    {bill.is_paid && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{bill.tenant_name}</p>
                  <p className="text-xs text-gray-500">{bill.building_name}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedBills.has(bill.id) && (
                    <div className="bg-blue-600 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  {bill.sms_sent && (
                    <div className={`rounded-full p-1 ${
                      bill.sms_delivery_status === 'sent' 
                        ? 'bg-green-100 text-green-600' 
                        : bill.sms_delivery_status === 'failed'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                <div>
                  <p className="text-gray-500">Previous</p>
                  <p className="font-medium text-gray-900">{bill.previous_meter_reading.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Current</p>
                  <p className="font-medium text-gray-900">{bill.current_meter_reading.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Used</p>
                  <p className="font-medium text-blue-600">{bill.used_m3.toFixed(2)} m³</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Water:</span>
                  <span className="text-gray-900 font-medium">{bill.water_amount.toFixed(2)} FRw</span>
                </div>
                {bill.pompe_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pompe:</span>
                    <span className="text-gray-900 font-medium">{bill.pompe_amount.toFixed(2)} FRw</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-900 font-semibold">Total:</span>
                  <span className="text-blue-600 font-bold">{bill.total_amount.toFixed(2)} FRw</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{bill.invoice_number}</span>
                <span>
                  {new Date(bill.billing_period_start).toLocaleDateString()} - {new Date(bill.billing_period_end).toLocaleDateString()}
                </span>
              </div>

              <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                {!bill.is_paid ? (
                  <button
                    onClick={() => handleMarkAsPaid(bill.id, true)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Mark as Paid
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkAsPaid(bill.id, false)}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Mark as Unpaid
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* SMS Results Modal */}
      {showSMSModal && smsResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">SMS Results</h2>
                <button
                  onClick={() => setShowSMSModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {smsResults.sent.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">
                      Sent Successfully ({smsResults.sent.length})
                    </h3>
                  </div>
                  <div className="space-y-1 text-sm text-green-800">
                    {smsResults.sent.map((item: any, idx: number) => (
                      <div key={idx}>• Apt {item.apartment_number}</div>
                    ))}
                  </div>
                </div>
              )}

              {smsResults.failed.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">
                      Failed ({smsResults.failed.length})
                    </h3>
                  </div>
                  <div className="space-y-1 text-sm text-red-800">
                    {smsResults.failed.map((item: any, idx: number) => (
                      <div key={idx}>• Apt {item.apartment_number}: {item.error}</div>
                    ))}
                  </div>
                </div>
              )}

              {smsResults.no_phone.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-900">
                      No Phone Number ({smsResults.no_phone.length})
                    </h3>
                  </div>
                  <div className="space-y-1 text-sm text-yellow-800">
                    {smsResults.no_phone.map((item: any, idx: number) => (
                      <div key={idx}>• Apt {item.apartment_number} - {item.tenant_name}</div>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    Add phone numbers to these apartments to send SMS notifications.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => setShowSMSModal(false)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
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

