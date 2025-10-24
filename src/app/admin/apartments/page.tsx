"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Home,
  ArrowLeft,
  Search,
  Eye,
  Edit2,
  Trash2,
  Building,
  DoorOpen,
  DoorClosed,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { Apartment, Building as BuildingType } from "@/types";

export default function ApartmentsListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBuilding, setFilterBuilding] = useState<string>("all");
  const [filterOccupancy, setFilterOccupancy] = useState<"all" | "occupied" | "vacant">(
    "all"
  );

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchData();
  }, [session, status, router]);

  useEffect(() => {
    filterData();
  }, [searchQuery, filterBuilding, filterOccupancy, apartments]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch apartments
      const apartmentsResponse = await fetch("/api/apartments");
      if (apartmentsResponse.ok) {
        const apartmentsData = await apartmentsResponse.json();
        setApartments(apartmentsData.data || []);
      }

      // Fetch buildings
      const buildingsResponse = await fetch("/api/buildings");
      if (buildingsResponse.ok) {
        const buildingsData = await buildingsResponse.json();
        setBuildings(buildingsData.data || []);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...apartments];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (apartment) =>
          apartment.apartment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apartment.building?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apartment.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Building filter
    if (filterBuilding !== "all") {
      filtered = filtered.filter(
        (apartment) => apartment.building_id.toString() === filterBuilding
      );
    }

    // Occupancy filter
    if (filterOccupancy !== "all") {
      filtered = filtered.filter((apartment) =>
        filterOccupancy === "occupied" ? apartment.is_occupied : !apartment.is_occupied
      );
    }

    setFilteredApartments(filtered);
  };

  const handleDelete = async (apartmentId: number, apartmentNumber: string) => {
    if (!confirm(`Are you sure you want to delete apartment ${apartmentNumber}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/apartments/${apartmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Apartment deleted successfully");
        fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete apartment");
      }
    } catch (error) {
      toast.error("Failed to delete apartment");
    }
  };

  const getOccupancyStats = () => {
    const occupied = apartments.filter((apt) => apt.is_occupied).length;
    const total = apartments.length;
    const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { occupied, vacant: total - occupied, total, percentage };
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading apartments...</p>
        </div>
      </div>
    );
  }

  const stats = getOccupancyStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <h1 className="text-xl font-bold text-gray-900">Apartments</h1>
              <p className="text-sm text-gray-600">
                {apartments.length} total units • {stats.occupied} occupied • {stats.vacant}{" "}
                vacant
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/apartments/create")}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by unit number, building, or tenant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Filters */}
          <div className="space-y-2">
            {/* Building Filter */}
            <div className="flex items-center space-x-2 overflow-x-auto">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <button
                onClick={() => setFilterBuilding("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  filterBuilding === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Buildings
              </button>
              {buildings.map((building) => (
                <button
                  key={building.id}
                  onClick={() => setFilterBuilding(building.id.toString())}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    filterBuilding === building.id.toString()
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {building.name}
                </button>
              ))}
            </div>

            {/* Occupancy Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterOccupancy("all")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterOccupancy === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({apartments.length})
              </button>
              <button
                onClick={() => setFilterOccupancy("occupied")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterOccupancy === "occupied"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Occupied ({stats.occupied})
              </button>
              <button
                onClick={() => setFilterOccupancy("vacant")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterOccupancy === "vacant"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Vacant ({stats.vacant})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Apartments List */}
      <div className="p-4">
        {filteredApartments.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || filterBuilding !== "all" || filterOccupancy !== "all"
                ? "No apartments found"
                : "No apartments yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterBuilding !== "all" || filterOccupancy !== "all"
                ? "Try adjusting your search or filters"
                : "Add your first apartment to get started"}
            </p>
            {!searchQuery && filterBuilding === "all" && filterOccupancy === "all" && (
              <button
                onClick={() => router.push("/admin/apartments/create")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Apartment</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApartments.map((apartment) => (
              <div
                key={apartment.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Unit {apartment.apartment_number}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            apartment.is_occupied
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {apartment.is_occupied ? (
                            <span className="flex items-center space-x-1">
                              <DoorClosed className="w-3 h-3" />
                              <span>Occupied</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1">
                              <DoorOpen className="w-3 h-3" />
                              <span>Vacant</span>
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Building className="w-4 h-4 mr-1" />
                        <span>{apartment.building?.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{apartment.bedrooms} BR</span>
                        <span>{apartment.bathrooms} BA</span>
                        {apartment.floor_number && (
                          <span>Floor {apartment.floor_number}</span>
                        )}
                      </div>
                      {apartment.is_occupied && apartment.tenant_name && (
                        <p className="text-sm text-gray-700 mt-2">
                          Tenant: {apartment.tenant_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        ${apartment.rent_amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">per month</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => router.push(`/admin/apartments/${apartment.id}`)}
                      className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => router.push(`/admin/apartments/${apartment.id}/edit`)}
                      className="bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(apartment.id, apartment.apartment_number)}
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

