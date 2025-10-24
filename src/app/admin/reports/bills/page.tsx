"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Calendar, DollarSign, Download } from "lucide-react";
import toast from "react-hot-toast";

interface Bill {
  id: number;
  apartment_id: number;
  apartment_number: string;
  building_name: string;
  tenant_name: string;
  amount: number;
  due_date: string;
  status: string;
  created_at: string;
}

export default function BillReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchBills();
  }, [session, status, router]);

  const fetchBills = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for now - replace with actual API call
      const mockBills: Bill[] = [
        {
          id: 1,
          apartment_id: 1,
          apartment_number: "101",
          building_name: "Sunset Apartments",
          tenant_name: "John Doe",
          amount: 1200.00,
          due_date: "2024-11-01",
          status: "paid",
          created_at: "2024-10-15T10:00:00Z"
        },
        {
          id: 2,
          apartment_id: 2,
          apartment_number: "102",
          building_name: "Sunset Apartments",
          tenant_name: "Jane Smith",
          amount: 1350.00,
          due_date: "2024-11-01",
          status: "pending",
          created_at: "2024-10-15T10:00:00Z"
        }
      ];

      setBills(mockBills);
    } catch (error) {
      toast.error("Failed to load bills");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = () => {
    fetchBills();
    toast.success("Filter applied");
  };

  const handleExport = () => {
    toast.success("Exporting bills report...");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  const filteredBills = bills.filter(bill => {
    if (statusFilter !== "all" && bill.status !== statusFilter) return false;
    if (startDate && new Date(bill.created_at) < new Date(startDate)) return false;
    if (endDate && new Date(bill.created_at) > new Date(endDate)) return false;
    return true;
  });

  const totalAmount = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
  const paidAmount = filteredBills.filter(b => b.status === "paid").reduce((sum, bill) => sum + bill.amount, 0);
  const pendingAmount = filteredBills.filter(b => b.status === "pending").reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push("/admin/reports")}
              className="p-2 hover:bg-purple-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Bill Reports</h1>
              <p className="text-sm text-purple-100">View and analyze billing data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-4 -mt-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Bills</p>
            <p className="text-xl font-bold text-gray-900">{filteredBills.length}</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Amount</p>
            <p className="text-xl font-bold text-purple-600">${totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Paid</p>
            <p className="text-xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <button
              onClick={handleFilter}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Bills List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-semibold text-gray-900">Bills List</h2>
            </div>
            <button
              onClick={handleExport}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredBills.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No bills found</p>
              </div>
            ) : (
              filteredBills.map((bill) => (
                <div key={bill.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {bill.building_name} - {bill.apartment_number}
                      </h3>
                      <p className="text-sm text-gray-600">{bill.tenant_name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {new Date(bill.due_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-purple-600 font-semibold">
                      <DollarSign className="w-4 h-4" />
                      <span>{bill.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

