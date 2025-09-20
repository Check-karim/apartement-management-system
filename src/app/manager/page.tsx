"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building, Home, Users, TrendingUp, Plus, Bell } from "lucide-react";
import toast from "react-hot-toast";
import { Building as BuildingType, Apartment } from "@/types";

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "manager") {
      router.push("/login");
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [buildingsRes, apartmentsRes] = await Promise.all([
        fetch("/api/buildings"),
        fetch("/api/apartments"),
      ]);

      if (buildingsRes.ok) {
        const buildingsData = await buildingsRes.json();
        setBuildings(buildingsData.data || []);
      }

      if (apartmentsRes.ok) {
        const apartmentsData = await apartmentsRes.json();
        setApartments(apartmentsData.data || []);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalBuildings: buildings.length,
    totalApartments: apartments.length,
    occupiedApartments: apartments.filter(apt => apt.is_occupied).length,
    vacantApartments: apartments.filter(apt => !apt.is_occupied).length,
  };

  const occupancyRate = stats.totalApartments > 0 
    ? Math.round((stats.occupiedApartments / stats.totalApartments) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome back, {session?.user.full_name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBuildings}</p>
                <p className="text-sm text-gray-600">Buildings</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <Home className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApartments}</p>
                <p className="text-sm text-gray-600">Apartments</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.occupiedApartments}</p>
                <p className="text-sm text-gray-600">Occupied</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{occupancyRate}%</p>
                <p className="text-sm text-gray-600">Occupancy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push("/manager/apartments/create")}
              className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Apartment</span>
            </button>

            <button
              onClick={() => router.push("/manager/notifications/create")}
              className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Bell className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Send Notification</span>
            </button>
          </div>
        </div>

        {/* My Buildings */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">My Buildings</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {buildings.length === 0 ? (
              <div className="p-8 text-center">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No buildings assigned</h3>
                <p className="text-gray-600">Contact your administrator to get buildings assigned to you.</p>
              </div>
            ) : (
              buildings.map((building) => {
                const buildingApartments = apartments.filter(apt => apt.building_id === building.id);
                const occupied = buildingApartments.filter(apt => apt.is_occupied).length;
                const total = buildingApartments.length;
                
                return (
                  <div key={building.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{building.name}</h4>
                        <p className="text-sm text-gray-600">{building.address}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">{total} apartments</span>
                          <span className="text-xs text-gray-500">{occupied} occupied</span>
                          <span className="text-xs text-gray-500">
                            {total > 0 ? Math.round((occupied / total) * 100) : 0}% occupancy
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/manager/buildings/${building.id}`)}
                        className="text-blue-600 text-sm hover:text-blue-800 font-medium"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Apartments */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Apartments</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {apartments.slice(0, 5).map((apartment) => (
              <div key={apartment.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        Apt {apartment.apartment_number}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        apartment.is_occupied
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {apartment.is_occupied ? "Occupied" : "Vacant"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{apartment.building?.name}</p>
                    <p className="text-xs text-gray-500">
                      {apartment.bedrooms} bed, {apartment.bathrooms} bath • ${apartment.rent_amount}/month
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/manager/apartments/${apartment.id}`)}
                    className="text-blue-600 text-sm hover:text-blue-800"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
            
            {apartments.length === 0 && (
              <div className="p-8 text-center">
                <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No apartments yet</h3>
                <p className="text-gray-600 mb-4">Start by adding apartments to your buildings.</p>
                <button
                  onClick={() => router.push("/manager/apartments/create")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Add First Apartment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 