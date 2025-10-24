"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Building as BuildingIcon, MapPin, User } from "lucide-react";
import toast from "react-hot-toast";
import { Building, User as UserType } from "@/types";

const updateBuildingSchema = z.object({
  name: z.string().min(2, "Building name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  manager_id: z.string().optional(),
});

type UpdateBuildingFormData = z.infer<typeof updateBuildingSchema>;

export default function EditBuildingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const buildingId = params?.id as string;
  
  const [building, setBuilding] = useState<Building | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [managers, setManagers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateBuildingFormData>({
    resolver: zodResolver(updateBuildingSchema),
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    if (buildingId) {
      fetchData();
    }
  }, [session, status, router, buildingId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [buildingRes, managersRes] = await Promise.all([
        fetch(`/api/buildings/${buildingId}`),
        fetch("/api/users/managers"),
      ]);

      if (buildingRes.ok) {
        const buildingData = await buildingRes.json();
        setBuilding(buildingData.data);
        reset({
          name: buildingData.data.name,
          address: buildingData.data.address,
          manager_id: buildingData.data.manager_id?.toString() || "",
        });
      } else {
        toast.error("Failed to load building details");
        router.push("/admin/buildings");
      }

      if (managersRes.ok) {
        const managersData = await managersRes.json();
        setManagers(managersData.data?.filter((m: UserType) => m.is_active) || []);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UpdateBuildingFormData) => {
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/buildings/${buildingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          address: data.address,
          manager_id: data.manager_id ? parseInt(data.manager_id) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update building");
      }

      toast.success("Building updated successfully");
      router.push(`/admin/buildings/${buildingId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update building");
    } finally {
      setIsUpdating(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Building not found</p>
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
              onClick={() => router.push(`/admin/buildings/${buildingId}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Building</h1>
              <p className="text-sm text-gray-600">Update building information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Building Info Card */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <BuildingIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Building Information</h2>
            </div>

            <div className="space-y-4">
              {/* Building Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Building Name *
                </label>
                <input
                  {...register("name")}
                  type="text"
                  id="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Enter building name"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Address *
                </label>
                <textarea
                  {...register("address")}
                  id="address"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Enter full address"
                />
                {errors.address && (
                  <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Manager Assignment Card */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Manager Assignment</h2>
            </div>

            <div>
              <label htmlFor="manager_id" className="block text-sm font-medium text-gray-700 mb-1">
                Assign Building Manager (Optional)
              </label>
              <select
                {...register("manager_id")}
                id="manager_id"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
              >
                <option value="">No manager assigned</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.full_name} (@{manager.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isUpdating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{isUpdating ? "Saving..." : "Save Changes"}</span>
            </button>

            <button
              type="button"
              onClick={() => router.push(`/admin/buildings/${buildingId}`)}
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

