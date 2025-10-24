"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Settings as SettingsIcon, DollarSign, Droplet, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  const settingsOptions = [
    {
      icon: DollarSign,
      title: "Currency Settings",
      description: "Configure currency and format",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      route: "/admin/settings/currency",
    },
    {
      icon: Droplet,
      title: "Water Formula",
      description: "Set water billing calculation formula",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      route: "/admin/settings/water-formula",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
          </div>
          <p className="text-gray-300">Configure system settings and preferences</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Settings Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">System Configuration</h2>
            <p className="text-sm text-gray-600">Manage system-wide settings</p>
          </div>
          <div>
            {settingsOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.title}
                  onClick={() => router.push(option.route)}
                  className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                >
                  <div className={`${option.bgColor} p-3 rounded-xl mr-4`}>
                    <Icon className={`w-6 h-6 ${option.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-base font-semibold text-gray-900">{option.title}</h3>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <SettingsIcon className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Settings Information</h3>
              <p className="text-sm text-blue-700">
                Changes made in settings will affect the entire system. 
                Make sure to review changes before saving.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

