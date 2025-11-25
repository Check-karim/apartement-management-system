"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Droplet, AlertCircle, Check, Building, Calculator } from "lucide-react";
import toast from "react-hot-toast";

interface WaterInvoice {
  id: number;
  building_id: number;
  building_name: string;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  total_m3: number;
  total_amount: number;
  price_per_m3: number;
}

interface Apartment {
  id: number;
  apartment_number: string;
  tenant_name: string;
  water_meter_reading: number;
  is_occupied: boolean;
}

interface PompeSetting {
  total_price_per_period: number;
}

interface MeterReading {
  apartment_id: number;
  current_meter_reading: string;
  calculated: {
    used_m3: number;
    water_amount: number;
    pompe_amount: number;
    total_amount: number;
  } | null;
}

export default function GenerateWaterBillsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceIdParam = searchParams.get("invoice_id");
  
  const [invoices, setInvoices] = useState<WaterInvoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoiceIdParam || "");
  const [invoice, setInvoice] = useState<WaterInvoice | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [pompeSetting, setPompeSetting] = useState<PompeSetting | null>(null);
  const [meterReadings, setMeterReadings] = useState<Record<number, MeterReading>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }

    fetchInvoices();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedInvoiceId) {
      fetchInvoiceDetails();
    }
  }, [selectedInvoiceId]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/water/invoices");
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data || []);
        
        if (invoiceIdParam && data.data.length > 0) {
          setSelectedInvoiceId(invoiceIdParam);
        }
      }
    } catch (error) {
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoiceDetails = async () => {
    try {
      setIsLoading(true);
      
      const [invoiceRes, apartmentsRes, pompeRes] = await Promise.all([
        fetch(`/api/water/invoices/${selectedInvoiceId}`),
        fetch(`/api/water/invoices/${selectedInvoiceId}`).then(async (res) => {
          if (res.ok) {
            const invoiceData = await res.json();
            return fetch(`/api/apartments?building_id=${invoiceData.data.building_id}`);
          }
          return res;
        }),
        fetch(`/api/water/invoices/${selectedInvoiceId}`).then(async (res) => {
          if (res.ok) {
            const invoiceData = await res.json();
            return fetch(`/api/water/pompe?building_id=${invoiceData.data.building_id}`);
          }
          return res;
        }),
      ]);

      if (invoiceRes.ok) {
        const invoiceData = await invoiceRes.json();
        setInvoice(invoiceData.data);
      }

      if (apartmentsRes.ok) {
        const apartmentsData = await apartmentsRes.json();
        const apts = apartmentsData.data || [];
        setApartments(apts);
        
        // Initialize meter readings
        const readings: Record<number, MeterReading> = {};
        apts.forEach((apt: Apartment) => {
          readings[apt.id] = {
            apartment_id: apt.id,
            current_meter_reading: "",
            calculated: null,
          };
        });
        setMeterReadings(readings);
      }

      if (pompeRes.ok) {
        const pompeData = await pompeRes.json();
        if (pompeData.data && pompeData.data.length > 0) {
          setPompeSetting(pompeData.data[0]);
        }
      }
    } catch (error) {
      toast.error("Failed to load details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeterReadingChange = (apartmentId: number, value: string) => {
    const apartment = apartments.find(apt => apt.id === apartmentId);
    if (!apartment || !invoice) return;

    const newReading: MeterReading = {
      apartment_id: apartmentId,
      current_meter_reading: value,
      calculated: null,
    };

    if (value && !isNaN(parseFloat(value))) {
      const currentReading = parseFloat(value);
      const previousReading = apartment.water_meter_reading;
      
      if (currentReading >= previousReading) {
        const used_m3 = currentReading - previousReading;
        const water_amount = used_m3 * invoice.price_per_m3;
        const pompe_price_per_m3 = pompeSetting 
          ? pompeSetting.total_price_per_period / invoice.total_m3 
          : 0;
        const pompe_amount = used_m3 * pompe_price_per_m3;
        const total_amount = water_amount + pompe_amount;

        newReading.calculated = {
          used_m3,
          water_amount,
          pompe_amount,
          total_amount,
        };
      }
    }

    setMeterReadings({
      ...meterReadings,
      [apartmentId]: newReading,
    });
  };

  const handleGenerateBills = async () => {
    if (!invoice) return;

    // Validate all readings
    const readingsArray = Object.values(meterReadings);
    const validReadings = readingsArray.filter(
      r => r.current_meter_reading && r.calculated
    );

    if (validReadings.length === 0) {
      toast.error("Please enter at least one meter reading");
      return;
    }

    // Check for invalid readings (current < previous)
    const invalidReadings = readingsArray.filter(r => {
      if (!r.current_meter_reading) return false;
      const apt = apartments.find(a => a.id === r.apartment_id);
      return apt && parseFloat(r.current_meter_reading) < apt.water_meter_reading;
    });

    if (invalidReadings.length > 0) {
      toast.error("Some readings are less than previous readings. Please correct them.");
      return;
    }

    if (!confirm(`Generate ${validReadings.length} water bills for ${invoice.building_name}?`)) {
      return;
    }

    try {
      setIsGenerating(true);
      
      const response = await fetch("/api/water/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: invoice.id,
          meter_readings: validReadings.map(r => ({
            apartment_id: r.apartment_id,
            current_meter_reading: parseFloat(r.current_meter_reading),
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        
        // Show results
        if (result.data.errors.length > 0) {
          console.log("Errors:", result.data.errors);
          toast.error(`${result.data.errors.length} bills failed to generate`);
        }
        
        // Redirect to bills page
        setTimeout(() => {
          router.push("/admin/water/bills");
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to generate bills");
      }
    } catch (error) {
      toast.error("Failed to generate bills");
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateTotals = () => {
    const totals = {
      apartments: 0,
      total_m3: 0,
      total_water_amount: 0,
      total_pompe_amount: 0,
      total_amount: 0,
    };

    Object.values(meterReadings).forEach(reading => {
      if (reading.calculated) {
        totals.apartments++;
        totals.total_m3 += reading.calculated.used_m3;
        totals.total_water_amount += reading.calculated.water_amount;
        totals.total_pompe_amount += reading.calculated.pompe_amount;
        totals.total_amount += reading.calculated.total_amount;
      }
    });

    return totals;
  };

  const totals = invoice ? calculateTotals() : null;

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push("/admin/water/invoices")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Generate Water Bills</h1>
              <p className="text-sm text-gray-600">Enter current meter readings</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Invoice
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-gray-900"
            >
              <option value="">Select an invoice...</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} - {inv.building_name} ({new Date(inv.billing_period_start).toLocaleDateString()} - {new Date(inv.billing_period_end).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {invoice && (
          <>
            {/* Invoice Summary */}
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Building className="w-6 h-6" />
                <div>
                  <h2 className="font-bold text-lg">{invoice.building_name}</h2>
                  <p className="text-cyan-100 text-sm">{invoice.invoice_number}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-cyan-200 mb-1">Period</p>
                  <p className="font-medium">
                    {new Date(invoice.billing_period_start).toLocaleDateString()} - {new Date(invoice.billing_period_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-cyan-200 mb-1">Price per m³</p>
                  <p className="font-medium">{invoice.price_per_m3.toFixed(2)} FRw</p>
                </div>
                {pompeSetting && (
                  <>
                    <div>
                      <p className="text-cyan-200 mb-1">Pompe Total</p>
                      <p className="font-medium">{pompeSetting.total_price_per_period.toFixed(2)} FRw</p>
                    </div>
                    <div>
                      <p className="text-cyan-200 mb-1">Pompe per m³</p>
                      <p className="font-medium">
                        {(pompeSetting.total_price_per_period / invoice.total_m3).toFixed(2)} FRw
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">How to use:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Enter current meter reading for each apartment</li>
                  <li>Bills will be calculated automatically</li>
                  <li>You can skip vacant apartments or apartments without tenants</li>
                  <li>Current reading must be greater than or equal to previous reading</li>
                </ul>
              </div>
            </div>

            {/* Meter Readings */}
            <div className="space-y-3">
              {apartments.map((apartment) => {
                const reading = meterReadings[apartment.id];
                const isValid = reading?.calculated !== null;
                const isInvalid = reading?.current_meter_reading && 
                  parseFloat(reading.current_meter_reading) < apartment.water_meter_reading;

                return (
                  <div 
                    key={apartment.id} 
                    className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-colors ${
                      isValid ? "border-green-300" : isInvalid ? "border-red-300" : "border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          Apt {apartment.apartment_number}
                        </h3>
                        {apartment.is_occupied ? (
                          <p className="text-sm text-gray-600">{apartment.tenant_name}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Vacant</p>
                        )}
                      </div>
                      {isValid && <Check className="w-5 h-5 text-green-600" />}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Previous Reading (m³)
                        </label>
                        <input
                          type="text"
                          value={apartment.water_meter_reading.toFixed(2)}
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Current Reading (m³) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={reading?.current_meter_reading || ""}
                          onChange={(e) => handleMeterReadingChange(apartment.id, e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg text-gray-900 text-sm ${
                            isInvalid 
                              ? "border-red-300 focus:ring-red-600" 
                              : "border-gray-300 focus:ring-cyan-600"
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {isInvalid && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Current reading cannot be less than previous reading</span>
                      </div>
                    )}

                    {reading?.calculated && (
                      <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Used m³:</span>
                          <span className="font-medium text-gray-900">
                            {reading.calculated.used_m3.toFixed(2)} m³
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Water:</span>
                          <span className="font-medium text-gray-900">
                            {reading.calculated.water_amount.toFixed(2)} FRw
                          </span>
                        </div>
                        {pompeSetting && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pompe:</span>
                            <span className="font-medium text-gray-900">
                              {reading.calculated.pompe_amount.toFixed(2)} FRw
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-gray-900 font-semibold">Total:</span>
                          <span className="font-bold text-cyan-600 text-base">
                            {reading.calculated.total_amount.toFixed(2)} FRw
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totals Summary */}
            {totals && totals.apartments > 0 && (
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Calculator className="w-5 h-5" />
                  <h3 className="font-bold">Bills Summary</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-green-200 mb-1">Apartments</p>
                    <p className="font-medium text-lg">{totals.apartments}</p>
                  </div>
                  <div>
                    <p className="text-green-200 mb-1">Total m³</p>
                    <p className="font-medium text-lg">{totals.total_m3.toFixed(2)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-green-200 mb-1">Total Amount</p>
                    <p className="font-bold text-2xl">{totals.total_amount.toFixed(2)} FRw</p>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="sticky bottom-0 bg-white p-4 border-t shadow-lg">
              <button
                onClick={handleGenerateBills}
                disabled={isGenerating || !totals || totals.apartments === 0}
                className="w-full bg-cyan-600 text-white py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating Bills...</span>
                  </>
                ) : (
                  <>
                    <Droplet className="w-5 h-5" />
                    <span>Generate {totals?.apartments || 0} Water Bills</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {!selectedInvoiceId && (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <Droplet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select an Invoice
            </h3>
            <p className="text-gray-600">
              Choose a water invoice to start generating bills
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

