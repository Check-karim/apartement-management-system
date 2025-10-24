"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Home,
  Building,
  Edit2,
  Trash2,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  User,
  AlertTriangle,
  DoorOpen,
  DoorClosed,
  MapPin,
  Maximize,
} from "lucide-react";
import toast from "react-hot-toast";
import { Apartment } from "@/types";

export default function ApartmentDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const apartmentId = params.id as string;

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchApartmentData();
  }, [session, status, router, apartmentId]);

  const fetchApartmentData = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/apartments/${apartmentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Apartment not found");
          router.push("/admin/apartments");
          return;
        }
        throw new Error("Failed to fetch apartment");
      }

      const data = await response.json();
      setApartment(data.data);
    } catch (error) {
      console.error("Error fetching apartment data:", error);
      toast.error("Failed to load apartment data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!apartment) return;

    if (
      !confirm(
        `Are you sure you want to delete apartment ${apartment.apartment_number}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/apartments/${apartmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Apartment deleted successfully");
        router.push("/admin/apartments");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete apartment");
      }
    } catch (error) {
      console.error("Error deleting apartment:", error);
      toast.error("Failed to delete apartment");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading apartment details...</p>
        </div>
      </div>
    );
  }

  if (!apartment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/admin/apartments")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                Unit {apartment.apartment_number}
              </h1>
              <p className="text-sm text-gray-600">Apartment Details</p>
            </div>
            <span
              className={`px-3 py-1.5 text-xs font-medium rounded-full ${
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
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Apartment Info Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
            <Home className="w-12 h-12 mb-2 opacity-90" />
            <h2 className="text-xl font-bold">Unit {apartment.apartment_number}</h2>
            <p className="text-blue-100 text-sm mt-1">{apartment.building?.name}</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Building Info */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Building
              </label>
              <div
                onClick={() => router.push(`/admin/buildings/${apartment.building_id}`)}
                className="mt-1 flex items-start space-x-2 cursor-pointer hover:text-blue-600 transition-colors"
              >
                <Building className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-medium">{apartment.building?.name}</p>
                  <p className="text-gray-600 text-sm flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {apartment.building?.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Unit Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Bedrooms
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {apartment.bedrooms}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Bathrooms
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {apartment.bathrooms}
                </p>
              </div>
              {apartment.floor_number && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Floor
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {apartment.floor_number}
                  </p>
                </div>
              )}
              {apartment.square_feet && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center">
                    <Maximize className="w-3 h-3 mr-1" />
                    Square Feet
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {apartment.square_feet.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Info */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Financial Details</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Monthly Rent
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ${apartment.rent_amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Security Deposit
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${apartment.deposit_amount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tenant Information */}
        {apartment.is_occupied && apartment.tenant_name ? (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tenant Information</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tenant Name
                </p>
                <p className="text-gray-900 font-medium mt-1">{apartment.tenant_name}</p>
              </div>

              {apartment.tenant_phone && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Phone Number
                  </p>
                  <div className="flex items-center mt-1">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <a
                      href={`tel:${apartment.tenant_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {apartment.tenant_phone}
                    </a>
                  </div>
                </div>
              )}

              {apartment.tenant_email && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Email Address
                  </p>
                  <div className="flex items-center mt-1">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <a
                      href={`mailto:${apartment.tenant_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {apartment.tenant_email}
                    </a>
                  </div>
                </div>
              )}

              {(apartment.lease_start_date || apartment.lease_end_date) && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Lease Period
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(apartment.lease_start_date)}</span>
                    <span>→</span>
                    <span>{formatDate(apartment.lease_end_date)}</span>
                  </div>
                </div>
              )}

              {(apartment.emergency_contact_name || apartment.emergency_contact_phone) && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Emergency Contact
                    </p>
                  </div>
                  {apartment.emergency_contact_name && (
                    <p className="text-gray-900 font-medium">
                      {apartment.emergency_contact_name}
                    </p>
                  )}
                  {apartment.emergency_contact_phone && (
                    <div className="flex items-center mt-1">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <a
                        href={`tel:${apartment.emergency_contact_phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {apartment.emergency_contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-start space-x-3">
              <DoorOpen className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-orange-900 mb-1">
                  Apartment is Vacant
                </h3>
                <p className="text-sm text-orange-700">
                  This apartment is currently available for rent.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => router.push(`/admin/apartments/${apartmentId}/edit`)}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Apartment</span>
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-50 text-red-600 py-3 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

