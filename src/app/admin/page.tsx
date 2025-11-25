"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Users, Building, Home, TrendingUp, 
  FileText, Bell, Settings, DollarSign, 
  Droplet, UserCircle, ChevronRight, Receipt, FileCheck 
} from "lucide-react";
import toast from "react-hot-toast";
import { User, Building as BuildingType, Apartment } from "@/types";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [managers, setManagers] = useState<User[]>([]);
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [managersRes, buildingsRes, apartmentsRes] = await Promise.all([
        fetch("/api/users/managers"),
        fetch("/api/buildings"),
        fetch("/api/apartments"),
      ]);

      if (managersRes.ok) {
        const managersData = await managersRes.json();
        setManagers(managersData.data || []);
      }

      if (buildingsRes.ok) {
        const buildingsData = await buildingsRes.json();
        setBuildings(buildingsData.data || []);
      }

      if (apartmentsRes.ok) {
        const apartmentsData = await apartmentsRes.json();
        setApartments(apartmentsData.data || []);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalManagers: managers.length,
    totalBuildings: buildings.length,
    totalApartments: apartments.length,
    occupiedApartments: apartments.filter(apt => apt.is_occupied).length,
  };

  const occupancyRate = stats.totalApartments > 0 
    ? Math.round((stats.occupiedApartments / stats.totalApartments) * 100) 
    : 0;

  const menuSections = [
    {
      title: "Management",
      items: [
        {
          icon: Users,
          label: "Managers",
          description: `${stats.totalManagers} managers`,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          route: "/admin/managers",
        },
        {
          icon: Building,
          label: "Buildings",
          description: `${stats.totalBuildings} buildings`,
          color: "text-green-600",
          bgColor: "bg-green-50",
          route: "/admin/buildings",
        },
        {
          icon: Home,
          label: "Apartments",
          description: `${stats.totalApartments} units`,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          route: "/admin/apartments",
        },
      ],
    },
    {
      title: "Water Billing",
      items: [
        {
          icon: Receipt,
          label: "Water Invoices",
          description: "Manage WASAC invoices",
          color: "text-cyan-600",
          bgColor: "bg-cyan-50",
          route: "/admin/water/invoices",
        },
        {
          icon: Droplet,
          label: "Water Bills",
          description: "Generate & manage bills",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          route: "/admin/water/bills",
        },
      ],
    },
    {
      title: "Reports & Analytics",
      items: [
        {
          icon: FileText,
          label: "Reports",
          description: "View all reports",
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          route: "/admin/reports",
        },
      ],
    },
    {
      title: "Communication",
      items: [
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage notifications",
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          route: "/admin/notifications",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          icon: DollarSign,
          label: "Currency",
          description: "Currency settings",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          route: "/admin/settings/currency",
        },
        {
          icon: FileCheck,
          label: "Contract Templates",
          description: "Manage lease templates",
          color: "text-teal-600",
          bgColor: "bg-teal-50",
          route: "/admin/settings/contracts",
        },
        {
          icon: Bell,
          label: "SMS Settings",
          description: "Configure TextBee SMS",
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          route: "/admin/settings/sms",
        },
        {
          icon: Settings,
          label: "General Settings",
          description: "System preferences",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          route: "/admin/settings",
        },
      ],
    },
    {
      title: "Profile",
      items: [
        {
          icon: UserCircle,
          label: "Admin Profile",
          description: "View & edit profile",
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          route: "/admin/profile",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-blue-100">Welcome back, {session?.user.full_name}</p>
        </div>
      </div>

      <div className="p-4 -mt-8">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-xs font-medium text-gray-500 uppercase">Managers</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalManagers}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Building className="w-8 h-8 text-green-600" />
                <span className="text-xs font-medium text-gray-500 uppercase">Buildings</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBuildings}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Home className="w-8 h-8 text-purple-600" />
                <span className="text-xs font-medium text-gray-500 uppercase">Apartments</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalApartments}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <span className="text-xs font-medium text-gray-500 uppercase">Occupancy</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{occupancyRate}%</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">
                {section.title}
              </h2>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {section.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => router.push(item.route)}
                      className={`w-full flex items-center p-4 hover:bg-gray-50 transition-colors ${
                        index !== section.items.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      <div className={`${item.bgColor} p-3 rounded-xl mr-4`}>
                        <Icon className={`w-6 h-6 ${item.color}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-base font-semibold text-gray-900">{item.label}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="h-6"></div>
      </div>
    </div>
  );
}

