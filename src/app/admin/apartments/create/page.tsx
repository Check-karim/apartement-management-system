"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Home, Building, DollarSign, Droplets } from "lucide-react";
import toast from "react-hot-toast";
import { Building as BuildingType } from "@/types";

// Validation schema
const createApartmentSchema = z.object({
  building_id: z.string().min(1, "Please select a building"),
  apartment_number: z.string().min(1, "Apartment number is required"),
  floor_number: z.string().optional(),
  bedrooms: z.string().min(1, "Number of bedrooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  kitchen: z.boolean(),
  rent_amount: z.string().min(1, "Rent amount is required"),
  deposit_amount: z.string().optional(),
  water_meter_reading: z.string().min(1, "Water meter reading is required"),
});

type CreateApartmentFormData = z.infer<typeof createApartmentSchema>;

export default function CreateApartmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateApartmentFormData>({
    resolver: zodResolver(createApartmentSchema),
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchBuildings();

    // Pre-select building if provided in URL
    const buildingId = searchParams.get("building_id");
    if (buildingId) {
      setValue("building_id", buildingId);
    }
  }, [session, status, router, searchParams, setValue]);

  const fetchBuildings = async () => {
    try {
      const response = await fetch("/api/buildings");
      if (response.ok) {
        const data = await response.json();
        setBuildings(data.data || []);
      }
    } catch (error) {
      toast.error("Failed to load buildings");
    }
  };

  const onSubmit = async (data: CreateApartmentFormData) => {
    try {
      setIsCreating(true);

      const response = await fetch("/api/apartments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          building_id: parseInt(data.building_id),
          apartment_number: data.apartment_number,
          floor_number: data.floor_number ? parseInt(data.floor_number) : undefined,
          bedrooms: parseInt(data.bedrooms),
          bathrooms: parseFloat(data.bathrooms),
          kitchen: data.kitchen,
          rent_amount: parseFloat(data.rent_amount),
          deposit_amount: data.deposit_amount ? parseFloat(data.deposit_amount) : 0,
          water_meter_reading: parseFloat(data.water_meter_reading),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create apartment");
      }

      const result = await response.json();
      toast.success("Apartment created successfully");

      // Navigate to the building details page if building_id was provided, otherwise to apartments list
      const buildingId = searchParams.get("building_id");
      if (buildingId) {
        router.push(`/admin/buildings/${buildingId}`);
      } else {
        router.push("/admin/apartments");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create apartment");
    } finally {
      setIsCreating(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
              onClick={() => {
                const buildingId = searchParams.get("building_id");
                if (buildingId) {
                  router.push(`/admin/buildings/${buildingId}`);
                } else {
                  router.push("/admin/apartments");
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Add Apartment</h1>
              <p className="text-sm text-gray-600">Create a new apartment unit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Building Selection */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Building className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Building</h2>
            </div>

            <div>
              <label htmlFor="building_id" className="block text-sm font-medium text-gray-700 mb-1">
                Select Building *
              </label>
              <select
                {...register("building_id")}
                id="building_id"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
              >
                <option value="">Select a building</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
              {errors.building_id && (
                <p className="text-red-600 text-sm mt-1">{errors.building_id.message}</p>
              )}
            </div>
          </div>

          {/* Apartment Details */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Home className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Apartment Details</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="apartment_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Number *
                  </label>
                  <input
                    {...register("apartment_number")}
                    type="text"
                    id="apartment_number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="101"
                  />
                  {errors.apartment_number && (
                    <p className="text-red-600 text-sm mt-1">{errors.apartment_number.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="floor_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Floor Number
                  </label>
                  <input
                    {...register("floor_number")}
                    type="number"
                    id="floor_number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms *
                  </label>
                  <input
                    {...register("bedrooms")}
                    type="number"
                    id="bedrooms"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="2"
                  />
                  {errors.bedrooms && (
                    <p className="text-red-600 text-sm mt-1">{errors.bedrooms.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms *
                  </label>
                  <input
                    {...register("bathrooms")}
                    type="number"
                    id="bathrooms"
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="1"
                  />
                  {errors.bathrooms && (
                    <p className="text-red-600 text-sm mt-1">{errors.bathrooms.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    {...register("kitchen")}
                    type="checkbox"
                    defaultChecked={true}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Has Kitchen</span>
                </label>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Financial Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="rent_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rent *
                </label>
                <input
                  {...register("rent_amount")}
                  type="number"
                  id="rent_amount"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="1200.00"
                />
                {errors.rent_amount && (
                  <p className="text-red-600 text-sm mt-1">{errors.rent_amount.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="deposit_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Security Deposit
                </label>
                <input
                  {...register("deposit_amount")}
                  type="number"
                  id="deposit_amount"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="1200.00"
                />
              </div>
            </div>
          </div>

          {/* Water Meter */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Droplets className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Water Meter</h2>
            </div>

            <div>
              <label htmlFor="water_meter_reading" className="block text-sm font-medium text-gray-700 mb-1">
                Current Meter Reading (m³) *
              </label>
              <input
                {...register("water_meter_reading")}
                type="number"
                id="water_meter_reading"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="0.00"
              />
              {errors.water_meter_reading && (
                <p className="text-red-600 text-sm mt-1">{errors.water_meter_reading.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">Enter the initial water meter reading in cubic meters</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{isCreating ? "Creating..." : "Create Apartment"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const buildingId = searchParams.get("building_id");
                if (buildingId) {
                  router.push(`/admin/buildings/${buildingId}`);
                } else {
                  router.push("/admin/apartments");
                }
              }}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

