"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building as BuildingIcon, Home, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { Building } from "@/types";

export default function BuildingReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchBuildings();
  }, [session, status, router]);

  const fetchBuildings = async () => {
    try {
      const response = await fetch("/api/buildings");
      if (response.ok) {
        const data = await response.json();
        setBuildings(data.data || []);
      } else {
        toast.error("Failed to load buildings");
      }
    } catch (error) {
      toast.error("Failed to load buildings");
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

  const totalApartments = buildings.reduce((sum, b) => sum + b.total_apartments, 0);
  const managedBuildings = buildings.filter(b => b.manager_id).length;

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
              <h1 className="text-xl font-bold text-gray-900">Building Reports</h1>
              <p className="text-sm text-gray-600">Performance and analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <BuildingIcon className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{buildings.length}</p>
            <p className="text-sm opacity-90">Total Buildings</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <Home className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{totalApartments}</p>
            <p className="text-sm opacity-90">Total Units</p>
          </div>
        </div>

        {/* Buildings List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Buildings Overview</h2>
          </div>
          {buildings.length === 0 ? (
            <div className="p-8 text-center">
              <BuildingIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No buildings yet</h3>
              <p className="text-gray-600">Add buildings to view their reports</p>
            </div>
          ) : (
            <div className="divide-y">
              {buildings.map((building) => (
                <div key={building.id} className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{building.name}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Apartments</p>
                      <p className="font-semibold text-gray-900">{building.total_apartments}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Manager</p>
                      <p className="font-semibold text-gray-900">
                        {building.manager ? "Assigned" : "Unassigned"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Management Stats */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Management Status</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Managed Buildings</span>
                <span className="font-semibold text-gray-900">{managedBuildings}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ 
                    width: `${buildings.length > 0 ? (managedBuildings / buildings.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Unmanaged Buildings</span>
                <span className="font-semibold text-gray-900">{buildings.length - managedBuildings}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-orange-600 h-3 rounded-full transition-all"
                  style={{ 
                    width: `${buildings.length > 0 ? ((buildings.length - managedBuildings) / buildings.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

