"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Building as BuildingIcon,
  MapPin,
  User,
  Edit2,
  Trash2,
  Plus,
  Home,
  DoorOpen,
  DoorClosed,
  Phone,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import { Building, Apartment } from "@/types";

export default function BuildingDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const buildingId = params.id as string;

  const [building, setBuilding] = useState<Building | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchBuildingData();
  }, [session, status, router, buildingId]);

  const fetchBuildingData = async () => {
    try {
      setIsLoading(true);

      // Fetch building details
      const buildingResponse = await fetch(`/api/buildings/${buildingId}`);
      if (!buildingResponse.ok) {
        if (buildingResponse.status === 404) {
          toast.error("Building not found");
          router.push("/admin/buildings");
          return;
        }
        throw new Error("Failed to fetch building");
      }

      const buildingData = await buildingResponse.json();
      setBuilding(buildingData.data);

      // Fetch apartments for this building
      const apartmentsResponse = await fetch(
        `/api/apartments?building_id=${buildingId}`
      );
      if (apartmentsResponse.ok) {
        const apartmentsData = await apartmentsResponse.json();
        setApartments(apartmentsData.data || []);
      }
    } catch (error) {
      console.error("Error fetching building data:", error);
      toast.error("Failed to load building data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBuilding = async () => {
    if (!building) return;

    const confirmMessage =
      apartments.length > 0
        ? `Are you sure you want to delete "${building.name}"? This will also delete all ${apartments.length} associated apartment(s).`
        : `Are you sure you want to delete "${building.name}"?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/buildings/${buildingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Building deleted successfully");
        router.push("/admin/buildings");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete building");
      }
    } catch (error) {
      console.error("Error deleting building:", error);
      toast.error("Failed to delete building");
    }
  };

  const handleDeleteApartment = async (apartmentId: number, apartmentNumber: string) => {
    if (!confirm(`Are you sure you want to delete apartment ${apartmentNumber}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/apartments/${apartmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Apartment deleted successfully");
        fetchBuildingData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete apartment");
      }
    } catch (error) {
      console.error("Error deleting apartment:", error);
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
          <p className="text-gray-600 font-medium">Loading building details...</p>
        </div>
      </div>
    );
  }

  if (!building) {
    return null;
  }

  const stats = getOccupancyStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/admin/buildings")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{building.name}</h1>
              <p className="text-sm text-gray-600">Building Details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Building Info Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
            <BuildingIcon className="w-12 h-12 mb-2 opacity-90" />
            <h2 className="text-xl font-bold">{building.name}</h2>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Address
              </label>
              <div className="flex items-start mt-1">
                <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                <p className="text-gray-900">{building.address}</p>
              </div>
            </div>

            {building.manager ? (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Manager
                </label>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <p className="text-gray-900">{building.manager.full_name}</p>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <p className="text-gray-600 text-sm">{building.manager.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Manager
                </label>
                <p className="text-gray-500 italic mt-1">No manager assigned</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex space-x-2">
              <button
                onClick={() => router.push(`/admin/buildings/${buildingId}/edit`)}
                className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Building</span>
              </button>
              <button
                onClick={handleDeleteBuilding}
                className="bg-red-50 text-red-600 py-2.5 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Occupancy Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Occupied</span>
              <DoorClosed className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.occupied}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.percentage}% occupancy rate
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Vacant</span>
              <DoorOpen className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.vacant}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? (100 - stats.percentage) : 0}% available
            </p>
          </div>
        </div>

        {/* Apartments Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Apartments</h3>
              <p className="text-sm text-gray-600">{apartments.length} total units</p>
            </div>
            <button
              onClick={() => router.push(`/admin/apartments/create?building_id=${buildingId}`)}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              title="Add Apartment"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {apartments.length === 0 ? (
            <div className="p-8 text-center">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                No apartments yet
              </h4>
              <p className="text-gray-600 mb-6">
                Add your first apartment to this building
              </p>
              <button
                onClick={() => router.push(`/admin/apartments/create?building_id=${buildingId}`)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Apartment</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {apartments.map((apartment) => (
                <div key={apartment.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Unit {apartment.apartment_number}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            apartment.is_occupied
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {apartment.is_occupied ? "Occupied" : "Vacant"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{apartment.bedrooms} BR</span>
                        <span>{apartment.bathrooms} BA</span>
                        {apartment.floor_number && (
                          <span>Floor {apartment.floor_number}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      ${apartment.rent_amount.toLocaleString()}
                    </p>
                  </div>

                  {apartment.is_occupied && apartment.tenant_name && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {apartment.tenant_name}
                      </p>
                      {apartment.tenant_phone && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Phone className="w-3 h-3 mr-1" />
                          {apartment.tenant_phone}
                        </div>
                      )}
                      {apartment.tenant_email && (
                        <div className="flex items-center text-xs text-gray-600 mt-1">
                          <Mail className="w-3 h-3 mr-1" />
                          {apartment.tenant_email}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => router.push(`/admin/apartments/${apartment.id}`)}
                      className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => router.push(`/admin/apartments/${apartment.id}/edit`)}
                      className="bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteApartment(apartment.id, apartment.apartment_number)}
                      className="bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

