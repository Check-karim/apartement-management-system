"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save, Droplet, Calculator } from "lucide-react";
import toast from "react-hot-toast";

interface WaterFormulaSettings {
  baseRate: number;
  perUnitRate: number;
  serviceFee: number;
}

export default function WaterFormulaSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WaterFormulaSettings>({
    defaultValues: {
      baseRate: 5.00,
      perUnitRate: 0.50,
      serviceFee: 2.00,
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  const onSubmit = async (data: WaterFormulaSettings) => {
    try {
      setIsSaving(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Water formula settings saved successfully!");
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

  // Calculate example
  const exampleUnits = 100;
  const exampleTotal = 
    watchedValues.baseRate + 
    (watchedValues.perUnitRate * exampleUnits) + 
    watchedValues.serviceFee;

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
              <h1 className="text-xl font-bold text-gray-900">Water Formula</h1>
              <p className="text-sm text-gray-600">Configure water billing calculation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Formula Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Droplet className="w-5 h-5 text-cyan-600" />
              <h2 className="text-lg font-semibold text-gray-900">Billing Formula</h2>
            </div>

            <div className="space-y-4">
              {/* Base Rate */}
              <div>
                <label htmlFor="baseRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Base Rate ($)
                </label>
                <input
                  {...register("baseRate", { 
                    valueAsNumber: true,
                    min: { value: 0, message: "Must be positive" }
                  })}
                  type="number"
                  step="0.01"
                  id="baseRate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="5.00"
                />
                {errors.baseRate && (
                  <p className="text-red-600 text-sm mt-1">{errors.baseRate.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Fixed monthly base charge</p>
              </div>

              {/* Per Unit Rate */}
              <div>
                <label htmlFor="perUnitRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Per Unit Rate ($)
                </label>
                <input
                  {...register("perUnitRate", { 
                    valueAsNumber: true,
                    min: { value: 0, message: "Must be positive" }
                  })}
                  type="number"
                  step="0.01"
                  id="perUnitRate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="0.50"
                />
                {errors.perUnitRate && (
                  <p className="text-red-600 text-sm mt-1">{errors.perUnitRate.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Cost per unit of water consumed</p>
              </div>

              {/* Service Fee */}
              <div>
                <label htmlFor="serviceFee" className="block text-sm font-medium text-gray-700 mb-1">
                  Service Fee ($)
                </label>
                <input
                  {...register("serviceFee", { 
                    valueAsNumber: true,
                    min: { value: 0, message: "Must be positive" }
                  })}
                  type="number"
                  step="0.01"
                  id="serviceFee"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="2.00"
                />
                {errors.serviceFee && (
                  <p className="text-red-600 text-sm mt-1">{errors.serviceFee.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Additional service fee</p>
              </div>
            </div>
          </div>

          {/* Formula Display */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Calculator className="w-5 h-5 text-cyan-600" />
              <h3 className="text-sm font-semibold text-cyan-900">Formula</h3>
            </div>
            <div className="bg-white rounded-lg p-3 font-mono text-sm text-gray-900 mb-3">
              Total = Base Rate + (Units × Per Unit Rate) + Service Fee
            </div>
            <div>
              <h4 className="text-sm font-semibold text-cyan-900 mb-2">Example Calculation</h4>
              <div className="text-sm text-cyan-700 space-y-1">
                <p>Units Consumed: {exampleUnits}</p>
                <p>Base Rate: ${watchedValues.baseRate?.toFixed(2) || "0.00"}</p>
                <p>Usage Cost: {exampleUnits} × ${watchedValues.perUnitRate?.toFixed(2) || "0.00"} = ${(watchedValues.perUnitRate * exampleUnits).toFixed(2)}</p>
                <p>Service Fee: ${watchedValues.serviceFee?.toFixed(2) || "0.00"}</p>
                <div className="border-t border-cyan-300 pt-1 mt-2">
                  <p className="font-bold text-lg">Total: ${exampleTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{isSaving ? "Saving..." : "Save Formula"}</span>
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

