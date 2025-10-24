"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  ArrowLeft, FileText, DollarSign, Home, 
  Building, ChevronRight, TrendingUp 
} from "lucide-react";

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading reports...</p>
        </div>
      </div>
    );
  }

  const reportTypes = [
    {
      icon: FileText,
      title: "Bill Reports",
      description: "View all billing reports and invoices",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      route: "/admin/reports/bills",
    },
    {
      icon: DollarSign,
      title: "Payment Reports",
      description: "Track rent payments and transactions",
      color: "text-green-600",
      bgColor: "bg-green-50",
      route: "/admin/reports/payments",
    },
    {
      icon: Home,
      title: "Apartment Reports",
      description: "Occupancy and apartment statistics",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      route: "/admin/reports/apartments",
    },
    {
      icon: Building,
      title: "Building Reports",
      description: "Building performance and analytics",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      route: "/admin/reports/buildings",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 hover:bg-purple-500 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            </div>
          </div>
          <p className="text-purple-100">View comprehensive system reports</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <TrendingUp className="w-10 h-10 mb-3 opacity-80" />
          <h2 className="text-2xl font-bold mb-1">System Overview</h2>
          <p className="text-purple-100 text-sm">
            Access detailed reports and insights about your properties
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Available Reports</h2>
            <p className="text-sm text-gray-600">Select a report type to view details</p>
          </div>
          <div>
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.title}
                  onClick={() => router.push(report.route)}
                  className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                >
                  <div className={`${report.bgColor} p-3 rounded-xl mr-4`}>
                    <Icon className={`w-6 h-6 ${report.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-base font-semibold text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-500">{report.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <FileText className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Report Information</h3>
              <p className="text-sm text-blue-700">
                All reports can be filtered by date range and exported for your records. 
                Data is updated in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

