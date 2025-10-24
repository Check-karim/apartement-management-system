"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, DollarSign, Calendar, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function PaymentReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    toast.success("Report generation feature coming soon!");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/admin/reports")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Payment Reports</h1>
              <p className="text-sm text-gray-600">Track rent payments and transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <DollarSign className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-2xl font-bold">$0.00</p>
            <p className="text-sm opacity-90">Received</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
            <DollarSign className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-2xl font-bold">$0.00</p>
            <p className="text-sm opacity-90">Pending</p>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Payment Report</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
              />
            </div>
            <button
              onClick={handleGenerateReport}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-gray-100 border border-gray-200 rounded-xl p-4">
          <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-center font-semibold text-gray-900 mb-2">No Payment Data Yet</h3>
          <p className="text-center text-sm text-gray-600">
            Payment reports will appear here once rent payments are recorded in the system.
          </p>
        </div>
      </div>
    </div>
  );
}

