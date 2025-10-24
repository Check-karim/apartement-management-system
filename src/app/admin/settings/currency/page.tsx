"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

interface CurrencySettings {
  currency: string;
  symbol: string;
  position: "before" | "after";
  decimalPlaces: number;
}

export default function CurrencySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CurrencySettings>({
    defaultValues: {
      currency: "USD",
      symbol: "$",
      position: "before",
      decimalPlaces: 2,
    },
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  const onSubmit = async (data: CurrencySettings) => {
    try {
      setIsSaving(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Currency settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
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
              onClick={() => router.push("/admin/settings")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Currency Settings</h1>
              <p className="text-sm text-gray-600">Configure currency display options</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Currency Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Currency Configuration</h2>
            </div>

            <div className="space-y-4">
              {/* Currency Code */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Code
                </label>
                <select
                  {...register("currency")}
                  id="currency"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>

              {/* Currency Symbol */}
              <div>
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  {...register("symbol")}
                  type="text"
                  id="symbol"
                  maxLength={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="$"
                />
              </div>

              {/* Symbol Position */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol Position
                </label>
                <select
                  {...register("position")}
                  id="position"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                >
                  <option value="before">Before amount ($100.00)</option>
                  <option value="after">After amount (100.00$)</option>
                </select>
              </div>

              {/* Decimal Places */}
              <div>
                <label htmlFor="decimalPlaces" className="block text-sm font-medium text-gray-700 mb-1">
                  Decimal Places
                </label>
                <select
                  {...register("decimalPlaces", { valueAsNumber: true })}
                  id="decimalPlaces"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                >
                  <option value={0}>0 (100)</option>
                  <option value={2}>2 (100.00)</option>
                  <option value={3}>3 (100.000)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-emerald-900 mb-2">Preview</h3>
            <p className="text-2xl font-bold text-emerald-700">$1,234.56</p>
            <p className="text-sm text-emerald-600 mt-1">Example rent amount</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{isSaving ? "Saving..." : "Save Settings"}</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/settings")}
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

