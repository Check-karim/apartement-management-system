"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, TrendingUp, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Apartment } from "@/types";

export default function ApartmentReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchApartments();
  }, [session, status, router]);

  const fetchApartments = async () => {
    try {
      const response = await fetch("/api/apartments");
      if (response.ok) {
        const data = await response.json();
        setApartments(data.data || []);
      } else {
        toast.error("Failed to load apartments");
      }
    } catch (error) {
      toast.error("Failed to load apartments");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const occupiedCount = apartments.filter(apt => apt.is_occupied).length;
  const vacantCount = apartments.length - occupiedCount;
  const occupancyRate = apartments.length > 0 
    ? Math.round((occupiedCount / apartments.length) * 100) 
    : 0;
  const totalRevenue = apartments
    .filter(apt => apt.is_occupied)
    .reduce((sum, apt) => sum + Number(apt.rent_amount), 0);

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
              <h1 className="text-xl font-bold text-gray-900">Apartment Reports</h1>
              <p className="text-sm text-gray-600">Occupancy and statistics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <Home className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{apartments.length}</p>
            <p className="text-sm opacity-90">Total Units</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{occupancyRate}%</p>
            <p className="text-sm opacity-90">Occupancy</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <Users className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{occupiedCount}</p>
            <p className="text-sm opacity-90">Occupied</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <Home className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{vacantCount}</p>
            <p className="text-sm opacity-90">Vacant</p>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Potential Monthly Revenue</p>
            <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
            <p className="text-sm opacity-75 mt-2">From {occupiedCount} occupied units</p>
          </div>
        </div>

        {/* Occupancy Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Occupancy Breakdown</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Occupied</span>
                <span className="font-semibold text-gray-900">{occupiedCount} units</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${occupancyRate}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Vacant</span>
                <span className="font-semibold text-gray-900">{vacantCount} units</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-orange-600 h-3 rounded-full transition-all"
                  style={{ width: `${100 - occupancyRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

