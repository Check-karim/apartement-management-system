"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, MessageSquare, ExternalLink, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function SMSSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    sms_enabled: "true",
    sms_api_key: "",
    sms_sender_name: "AMS",
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchSettings();
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      
      // Fetch SMS settings from system_settings
      const response = await fetch("/api/settings?keys=notification_sms_enabled,sms_api_key,sms_sender_name");
      
      if (response.ok) {
        const data = await response.json();
        const settings = data.data || [];
        
        setFormData({
          sms_enabled: settings.find((s: any) => s.setting_key === 'notification_sms_enabled')?.setting_value || 'true',
          sms_api_key: settings.find((s: any) => s.setting_key === 'sms_api_key')?.setting_value || '',
          sms_sender_name: settings.find((s: any) => s.setting_key === 'sms_sender_name')?.setting_value || 'AMS',
        });
      }
    } catch (error) {
      toast.error("Failed to load SMS settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sms_api_key) {
      toast.error("TextBee API Key is required");
      return;
    }

    try {
      setIsSaving(true);
      
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: [
            { key: "notification_sms_enabled", value: formData.sms_enabled, type: "boolean" },
            { key: "sms_api_provider", value: "textbee", type: "string" },
            { key: "sms_api_key", value: formData.sms_api_key, type: "string" },
            { key: "sms_sender_name", value: formData.sms_sender_name, type: "string" },
          ],
        }),
      });

      if (response.ok) {
        toast.success("SMS settings saved successfully");
      } else {
        toast.error("Failed to save SMS settings");
      }
    } catch (error) {
      toast.error("Failed to save SMS settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading settings...</p>
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
              onClick={() => router.push("/admin/settings")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SMS Settings</h1>
              <p className="text-sm text-gray-600">Configure TextBee SMS gateway</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-start space-x-3">
            <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">About TextBee SMS Gateway</h3>
              <p className="text-sm text-blue-800 mb-3">
                TextBee is a reliable SMS gateway service for Rwanda. Get your API credentials from TextBee to enable SMS notifications for water bills.
              </p>
              <a
                href="https://www.textbee.rw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-sm text-blue-600 font-medium hover:underline"
              >
                <span>Visit TextBee Website</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm">
          <div className="p-4 space-y-4">
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.sms_enabled === "true"}
                  onChange={(e) => setFormData({ ...formData, sms_enabled: e.target.checked ? "true" : "false" })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Enable SMS Notifications</span>
                  <p className="text-sm text-gray-600">Send water bill notifications via SMS</p>
                </div>
              </label>
            </div>

            <div className="h-px bg-gray-200"></div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TextBee API Key *
              </label>
              <input
                type="text"
                value={formData.sms_api_key}
                onChange={(e) => setFormData({ ...formData, sms_api_key: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Enter your TextBee API key"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from TextBee dashboard after creating an account
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sender Name *
              </label>
              <input
                type="text"
                value={formData.sms_sender_name}
                onChange={(e) => setFormData({ ...formData, sms_sender_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="e.g., AMS"
                maxLength={11}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will appear as the sender name in SMS messages (max 11 characters)
              </p>
            </div>

            {/* How it works */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                How SMS Notifications Work
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">1.</span>
                  <span>When you generate water bills, the system automatically sends SMS to tenants with phone numbers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">2.</span>
                  <span>SMS includes tenant name, apartment, billing period, water usage, and total amount</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">3.</span>
                  <span>Tenants without phone numbers are flagged for manual notification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">4.</span>
                  <span>You can resend failed SMS or send to individual tenants from the Water Bills page</span>
                </li>
              </ul>
            </div>

            {/* Test Connection (future enhancement) */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Make sure you have sufficient SMS credits in your TextBee account before sending notifications.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="p-4 border-t bg-gray-50 rounded-b-xl">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save SMS Settings</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* TextBee Info */}
        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">TextBee SMS Gateway Features</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Reliable SMS delivery in Rwanda and internationally</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Competitive pricing and bulk SMS discounts</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Real-time delivery reports and status tracking</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>24/7 technical support</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Easy integration with RESTful API</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

