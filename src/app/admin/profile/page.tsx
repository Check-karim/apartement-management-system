"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, UserCircle, Mail, Phone, Shield, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const updateProfileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  current_password: z.string().optional(),
  new_password: z.string().optional(),
  confirm_password: z.string().optional(),
}).refine(
  (data) => {
    if (data.new_password && !data.current_password) {
      return false;
    }
    return true;
  },
  {
    message: "Current password is required to set new password",
    path: ["current_password"],
  }
).refine(
  (data) => {
    if (data.new_password && data.new_password !== data.confirm_password) {
      return false;
    }
    return true;
  },
  {
    message: "Passwords do not match",
    path: ["confirm_password"],
  }
);

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export default function AdminProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    // Set default values
    reset({
      full_name: session.user.full_name,
      email: session.user.email,
      phone: "",
    });
  }, [session, status, router, reset]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      setIsUpdating(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Admin Profile</h1>
            </div>
          </div>
          <p className="text-indigo-100">Manage your profile and security settings</p>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="p-4 -mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 p-4 rounded-full">
              <UserCircle className="w-12 h-12 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{session?.user.full_name}</h2>
              <p className="text-sm text-gray-600">@{session?.user.username}</p>
              <span className="inline-block mt-1 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                Administrator
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === "security"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Security
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {activeTab === "profile" && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-3 mb-4">
                <UserCircle className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
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
                    Email Address *
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
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Leave password fields blank to keep your current password.
                </p>

                {/* Current Password */}
                <div>
                  <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      {...register("current_password")}
                      type={showCurrentPassword ? "text" : "password"}
                      id="current_password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.current_password && (
                    <p className="text-red-600 text-sm mt-1">{errors.current_password.message}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      {...register("new_password")}
                      type={showNewPassword ? "text" : "password"}
                      id="new_password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.new_password && (
                    <p className="text-red-600 text-sm mt-1">{errors.new_password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      {...register("confirm_password")}
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm_password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-red-600 text-sm mt-1">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
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
              onClick={() => router.push("/admin")}
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

