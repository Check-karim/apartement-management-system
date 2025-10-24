"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Bell, Wrench, Droplet, MessageSquare, ChevronRight } from "lucide-react";

export default function NotificationsPage() {
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
          <p className="text-gray-600 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  const notificationTypes = [
    {
      icon: Wrench,
      title: "Maintenance Notifications",
      description: "Maintenance alerts and updates",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      route: "/admin/notifications/maintenance",
    },
    {
      icon: Droplet,
      title: "Water Notifications",
      description: "Water billing and usage alerts",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      route: "/admin/notifications/water",
    },
    {
      icon: MessageSquare,
      title: "Compound Notifications",
      description: "General announcements and notices",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      route: "/admin/notifications/compound",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 hover:bg-orange-500 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Notifications</h1>
            </div>
          </div>
          <p className="text-orange-100">Manage tenant notifications and alerts</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Info Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <Bell className="w-10 h-10 mb-3 opacity-80" />
          <h2 className="text-2xl font-bold mb-1">Notification Center</h2>
          <p className="text-orange-100 text-sm">
            Send and manage notifications to tenants across all buildings
          </p>
        </div>

        {/* Notification Types */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Notification Types</h2>
            <p className="text-sm text-gray-600">Select a category to send notifications</p>
          </div>
          <div>
            {notificationTypes.map((notification) => {
              const Icon = notification.icon;
              return (
                <button
                  key={notification.title}
                  onClick={() => router.push(notification.route)}
                  className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                >
                  <div className={`${notification.bgColor} p-3 rounded-xl mr-4`}>
                    <Icon className={`w-6 h-6 ${notification.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-base font-semibold text-gray-900">{notification.title}</h3>
                    <p className="text-sm text-gray-500">{notification.description}</p>
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
            <Bell className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Notification Tips</h3>
              <p className="text-sm text-blue-700">
                All notifications are sent to tenants via their registered contact information. 
                Make sure tenant details are up to date for effective communication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

