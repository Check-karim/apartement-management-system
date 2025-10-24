"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, DollarSign, Edit2, Trash2, Star, Check } from "lucide-react";
import toast from "react-hot-toast";
import { Currency } from "@/types";

const currencySchema = z.object({
  code: z.string().min(2).max(10).toUpperCase(),
  name: z.string().min(1, "Currency name is required"),
  symbol: z.string().min(1, "Currency symbol is required").max(10),
  position: z.enum(["before", "after"]),
  decimal_places: z.coerce.number().min(0).max(4),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

type CurrencyFormData = z.infer<typeof currencySchema>;

export default function CurrencySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CurrencyFormData>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      code: "",
      name: "",
      symbol: "",
      position: "before",
      decimal_places: 2,
      is_active: true,
      is_default: false,
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchCurrencies();
  }, [session, status, router]);

  const fetchCurrencies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/currencies");
      
      if (response.ok) {
        const data = await response.json();
        setCurrencies(data.data || []);
      } else {
        toast.error("Failed to load currencies");
      }
    } catch (error) {
      toast.error("Failed to load currencies");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CurrencyFormData) => {
    try {
      setIsSaving(true);
      
      const response = await fetch("/api/currencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Currency created successfully!");
        reset();
        setShowCreateForm(false);
        fetchCurrencies();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create currency");
      }
    } catch (error) {
      toast.error("Failed to create currency");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (currencyId: number) => {
    try {
      const response = await fetch(`/api/currencies/${currencyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_default: true }),
      });

      if (response.ok) {
        toast.success("Default currency updated!");
        fetchCurrencies();
      } else {
        toast.error("Failed to update default currency");
      }
    } catch (error) {
      toast.error("Failed to update default currency");
    }
  };

  const handleToggleActive = async (currency: Currency) => {
    try {
      const response = await fetch(`/api/currencies/${currency.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !currency.is_active }),
      });

      if (response.ok) {
        toast.success(`Currency ${currency.is_active ? "deactivated" : "activated"}!`);
        fetchCurrencies();
      } else {
        toast.error("Failed to update currency");
      }
    } catch (error) {
      toast.error("Failed to update currency");
    }
  };

  const handleDelete = async (currencyId: number) => {
    if (!confirm("Are you sure you want to delete this currency?")) {
      return;
    }

    try {
      const response = await fetch(`/api/currencies/${currencyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Currency deleted successfully!");
        fetchCurrencies();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete currency");
      }
    } catch (error) {
      toast.error("Failed to delete currency");
    }
  };

  const formatExample = (currency: typeof watchedValues) => {
    const amount = 1234.56;
    const formatted = amount.toFixed(currency.decimal_places || 0);
    return currency.position === "before" 
      ? `${currency.symbol}${formatted}`
      : `${formatted}${currency.symbol}`;
  };

  if (status === "loading" || isLoading) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/admin/settings")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Currency Settings</h1>
                <p className="text-sm text-gray-600">Manage currencies</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center space-x-3 mb-4">
              <Plus className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Create New Currency</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Currency Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Code *
                </label>
                <input
                  {...register("code")}
                  type="text"
                  id="code"
                  placeholder="e.g., USD, EUR, GBP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
                {errors.code && (
                  <p className="text-red-600 text-sm mt-1">{errors.code.message}</p>
                )}
              </div>

              {/* Currency Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Name *
                </label>
                <input
                  {...register("name")}
                  type="text"
                  id="name"
                  placeholder="e.g., US Dollar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Currency Symbol */}
              <div>
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Symbol *
                </label>
                <input
                  {...register("symbol")}
                  type="text"
                  id="symbol"
                  placeholder="e.g., $, €, £"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
                {errors.symbol && (
                  <p className="text-red-600 text-sm mt-1">{errors.symbol.message}</p>
                )}
              </div>

              {/* Symbol Position */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol Position *
                </label>
                <select
                  {...register("position")}
                  id="position"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900"
                >
                  <option value="before">Before amount ($100.00)</option>
                  <option value="after">After amount (100.00$)</option>
                </select>
              </div>

              {/* Decimal Places */}
              <div>
                <label htmlFor="decimal_places" className="block text-sm font-medium text-gray-700 mb-1">
                  Decimal Places *
                </label>
                <select
                  {...register("decimal_places", { valueAsNumber: true })}
                  id="decimal_places"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900"
                >
                  <option value={0}>0 (100)</option>
                  <option value={2}>2 (100.00)</option>
                  <option value={3}>3 (100.000)</option>
                  <option value={4}>4 (100.0000)</option>
                </select>
              </div>

              {/* Preview */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-sm text-emerald-900 mb-1">Preview:</p>
                <p className="text-xl font-bold text-emerald-700">
                  {watchedValues.symbol && formatExample(watchedValues)}
                </p>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    {...register("is_active")}
                    type="checkbox"
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    {...register("is_default")}
                    type="checkbox"
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Set as default</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? "Creating..." : "Create Currency"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    reset();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Currency List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-gray-900">Currencies ({currencies.length})</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {currencies.length === 0 ? (
              <div className="p-8 text-center">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No currencies found</p>
              </div>
            ) : (
              currencies.map((currency) => (
                <div key={currency.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{currency.code}</h3>
                        {currency.is_default && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>Default</span>
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          currency.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {currency.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{currency.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Symbol: {currency.symbol} • Position: {currency.position} • Decimals: {currency.decimal_places}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        Example: {currency.position === "before" 
                          ? `${currency.symbol}1234${currency.decimal_places > 0 ? '.' + '0'.repeat(currency.decimal_places) : ''}`
                          : `1234${currency.decimal_places > 0 ? '.' + '0'.repeat(currency.decimal_places) : ''}${currency.symbol}`
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {!currency.is_default && (
                        <button
                          onClick={() => handleSetDefault(currency.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Set as default"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleActive(currency)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={currency.is_active ? "Deactivate" : "Activate"}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      {!currency.is_default && (
                        <button
                          onClick={() => handleDelete(currency.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
