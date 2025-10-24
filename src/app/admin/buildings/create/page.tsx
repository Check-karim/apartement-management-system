"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Building, MapPin, User } from "lucide-react";
import toast from "react-hot-toast";
import { User as UserType } from "@/types";

const createBuildingSchema = z.object({
  name: z.string().min(2, "Building name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  manager_id: z.string().optional(),
});

type CreateBuildingFormData = z.infer<typeof createBuildingSchema>;

export default function CreateBuildingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [managers, setManagers] = useState<UserType[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBuildingFormData>({
    resolver: zodResolver(createBuildingSchema),
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchManagers();
  }, [session, status, router]);

  const fetchManagers = async () => {
    try {
      const response = await fetch("/api/users/managers");
      if (response.ok) {
        const data = await response.json();
        setManagers(data.data?.filter((m: UserType) => m.is_active) || []);
      }
    } catch (error) {
      toast.error("Failed to load managers");
    } finally {
      setIsLoadingManagers(false);
    }
  };

  const onSubmit = async (data: CreateBuildingFormData) => {
    try {
      setIsCreating(true);
      
      const response = await fetch("/api/buildings", {
        method: "POST",
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
        throw new Error(errorData.error || "Failed to create building");
      }

      toast.success("Building created successfully");
      router.push("/admin/buildings");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create building");
    } finally {
      setIsCreating(false);
    }
  };

  if (status === "loading" || isLoadingManagers) {
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
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/admin/buildings")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Create Building</h1>
              <p className="text-sm text-gray-600">Add a new building to the system</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Building className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Building Information</h2>
            </div>

            <div className="space-y-4">
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
              {managers.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No active managers available. Create a manager first.
                </p>
              )}
            </div>
          </div>

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
              <span>{isCreating ? "Creating..." : "Create Building"}</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/buildings")}
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

