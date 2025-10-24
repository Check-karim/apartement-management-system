"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Building, ArrowLeft, Search, Eye, Edit2, Trash2, MapPin, User } from "lucide-react";
import toast from "react-hot-toast";
import { Building as BuildingType } from "@/types";

export default function BuildingsListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [filteredBuildings, setFilteredBuildings] = useState<BuildingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchBuildings();
  }, [session, status, router]);

  useEffect(() => {
    filterData();
  }, [searchQuery, buildings]);

  const fetchBuildings = async () => {
    try {
      setIsLoading(true);
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

  const filterData = () => {
    let filtered = [...buildings];

    if (searchQuery) {
      filtered = filtered.filter(
        (building) =>
          building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          building.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (building.manager?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBuildings(filtered);
  };

  const handleDelete = async (buildingId: number, buildingName: string) => {
    if (!confirm(`Are you sure you want to delete ${buildingName}? This will also delete all associated apartments.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/buildings/${buildingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Building deleted successfully");
        fetchBuildings();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete building");
      }
    } catch (error) {
      toast.error("Failed to delete building");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading buildings...</p>
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
              <h1 className="text-xl font-bold text-gray-900">Buildings</h1>
              <p className="text-sm text-gray-600">{buildings.length} total buildings</p>
            </div>
            <button
              onClick={() => router.push("/admin/buildings/create")}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, address, or manager..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        {filteredBuildings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No buildings found" : "No buildings yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try adjusting your search"
                : "Add your first building to get started"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push("/admin/buildings/create")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Building</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBuildings.map((building) => (
              <div
                key={building.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {building.name}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{building.address}</span>
                      </div>
                      {building.manager && (
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>Manager: {building.manager.full_name}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-sm pt-2">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                          {building.total_apartments} Apartments
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => router.push(`/admin/buildings/${building.id}`)}
                      className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => router.push(`/admin/buildings/${building.id}/edit`)}
                      className="bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(building.id, building.name)}
                      className="bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

