"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Trash2, User, Mail, Phone, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { User as UserType } from "@/types";

// Validation schema
const editManagerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  is_active: z.boolean(),
  password: z.string().optional(),
});

type EditManagerFormData = z.infer<typeof editManagerSchema>;

export default function EditManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const managerId = params.id as string;

  const [manager, setManager] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EditManagerFormData>({
    resolver: zodResolver(editManagerSchema),
  });

  // Redirect if not admin
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchManager();
  }, [session, status, router, managerId]);

  const fetchManager = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/managers/${managerId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Manager not found");
          router.push("/admin");
          return;
        }
        throw new Error("Failed to fetch manager");
      }

      const data = await response.json();
      setManager(data.data);
      
      // Reset form with manager data
      reset({
        username: data.data.username,
        full_name: data.data.full_name,
        email: data.data.email,
        phone: data.data.phone || "",
        is_active: data.data.is_active,
      });
    } catch (error) {
      toast.error("Failed to load manager details");
      router.push("/admin");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EditManagerFormData) => {
    try {
      setIsSaving(true);
      
      const updateData: any = {
        username: data.username,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        is_active: data.is_active,
      };

      // Only include password if it's provided
      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      const response = await fetch(`/api/users/managers/${managerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update manager");
      }

      toast.success("Manager updated successfully");
      router.push("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update manager");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this manager? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/users/managers/${managerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete manager");
      }

      toast.success("Manager deleted successfully");
      router.push("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete manager");
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading manager details...</p>
        </div>
      </div>
    );
  }

  if (!manager) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Manager not found</p>
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
              onClick={() => router.push("/admin")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Manager</h1>
              <p className="text-sm text-gray-600">{manager.full_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Manager Info Card */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Manager Information</h2>
            </div>

            <div className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  {...register("username")}
                  type="text"
                  id="username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Enter username"
                />
                {errors.username && (
                  <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  {...register("full_name")}
                  type="text"
                  id="full_name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Enter full name"
                />
                {errors.full_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.full_name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number (Optional)
                </label>
                <input
                  {...register("phone")}
                  type="tel"
                  id="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            </div>

            <div className="space-y-4">
              {/* Active Status */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Account Status
                  </label>
                  <p className="text-xs text-gray-600">Toggle to activate/deactivate this manager</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    {...register("is_active")}
                    type="checkbox"
                    id="is_active"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Password Update */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPasswordField(!showPasswordField)}
                  className="text-blue-600 text-sm font-medium hover:text-blue-800"
                >
                  {showPasswordField ? "Cancel Password Change" : "Change Password"}
                </button>
              </div>

              {showPasswordField && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    {...register("password")}
                    type="password"
                    id="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                  {errors.password && (
                    <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    Leave blank to keep the current password
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isDeleting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              <span>{isDeleting ? "Deleting..." : "Delete Manager"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 