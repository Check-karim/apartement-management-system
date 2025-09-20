"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Users, Building, Home, TrendingUp, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { User, Building as BuildingType, Apartment } from "@/types";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [managers, setManagers] = useState<User[]>([]);
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch managers, buildings, and apartments
      const [managersRes, buildingsRes, apartmentsRes] = await Promise.all([
        fetch("/api/users/managers"),
        fetch("/api/buildings"),
        fetch("/api/apartments"),
      ]);

      if (managersRes.ok) {
        const managersData = await managersRes.json();
        setManagers(managersData.data || []);
      }

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
    totalManagers: managers.length,
    totalBuildings: buildings.length,
    totalApartments: apartments.length,
    occupiedApartments: apartments.filter(apt => apt.is_occupied).length,
  };

  const occupancyRate = stats.totalApartments > 0 
    ? Math.round((stats.occupiedApartments / stats.totalApartments) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome back, {session?.user.full_name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalManagers}</p>
                <p className="text-sm text-gray-600">Managers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBuildings}</p>
                <p className="text-sm text-gray-600">Buildings</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <Home className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApartments}</p>
                <p className="text-sm text-gray-600">Apartments</p>
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

        {/* Tab Navigation */}
        <div className="flex bg-white rounded-lg shadow-sm mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            } rounded-lg transition-colors`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("managers")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === "managers"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            } rounded-lg transition-colors`}
          >
            Managers
          </button>
          <button
            onClick={() => setActiveTab("buildings")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === "buildings"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            } rounded-lg transition-colors`}
          >
            Buildings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium">System Statistics</p>
                    <p className="text-xs text-gray-600">Current system overview</p>
                  </div>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>• {stats.totalManagers} building managers registered</p>
                  <p>• {stats.totalBuildings} buildings managed</p>
                  <p>• {stats.totalApartments} total apartments</p>
                  <p>• {occupancyRate}% occupancy rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "managers" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Building Managers</h3>
              <button
                onClick={() => router.push("/admin/managers/create")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Manager</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              {managers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No managers yet</h3>
                  <p className="text-gray-600 mb-4">Add your first building manager to get started.</p>
                  <button
                    onClick={() => router.push("/admin/managers/create")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add Manager
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {managers.map((manager) => (
                    <div key={manager.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{manager.full_name}</h4>
                          <p className="text-sm text-gray-600">@{manager.username}</p>
                          <p className="text-xs text-gray-500">{manager.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            manager.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {manager.is_active ? "Active" : "Inactive"}
                          </span>
                          <button
                            onClick={() => router.push(`/admin/managers/${manager.id}`)}
                            className="text-blue-600 text-sm hover:text-blue-800"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "buildings" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Buildings</h3>
              <button
                onClick={() => router.push("/admin/buildings/create")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Building</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              {buildings.length === 0 ? (
                <div className="p-8 text-center">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No buildings yet</h3>
                  <p className="text-gray-600 mb-4">Add your first building to get started.</p>
                  <button
                    onClick={() => router.push("/admin/buildings/create")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add Building
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {buildings.map((building) => (
                    <div key={building.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{building.name}</h4>
                          <p className="text-sm text-gray-600">{building.address}</p>
                          <p className="text-xs text-gray-500">
                            {building.total_apartments} apartments
                            {building.manager && ` • Manager: ${building.manager.full_name}`}
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/admin/buildings/${building.id}`)}
                          className="text-blue-600 text-sm hover:text-blue-800"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 