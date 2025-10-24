"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Users, ArrowLeft, Search, Eye, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { User } from "@/types";

export default function ManagersListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [managers, setManagers] = useState<User[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchManagers();
  }, [session, status, router]);

  useEffect(() => {
    filterData();
  }, [searchQuery, filterStatus, managers]);

  const fetchManagers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/users/managers");
      
      if (response.ok) {
        const data = await response.json();
        setManagers(data.data || []);
      } else {
        toast.error("Failed to load managers");
      }
    } catch (error) {
      toast.error("Failed to load managers");
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...managers];

    if (searchQuery) {
      filtered = filtered.filter(
        (manager) =>
          manager.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          manager.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          manager.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((manager) =>
        filterStatus === "active" ? manager.is_active : !manager.is_active
      );
    }

    setFilteredManagers(filtered);
  };

  const handleDelete = async (managerId: number, managerName: string) => {
    if (!confirm(`Are you sure you want to delete ${managerName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/managers/${managerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Manager deleted successfully");
        fetchManagers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete manager");
      }
    } catch (error) {
      toast.error("Failed to delete manager");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading managers...</p>
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
              onClick={() => router.push("/admin")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Building Managers</h1>
              <p className="text-sm text-gray-600">{managers.length} total managers</p>
            </div>
            <button
              onClick={() => router.push("/admin/managers/create")}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({managers.length})
            </button>
            <button
              onClick={() => setFilterStatus("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "active"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Active ({managers.filter((m) => m.is_active).length})
            </button>
            <button
              onClick={() => setFilterStatus("inactive")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "inactive"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Inactive ({managers.filter((m) => !m.is_active).length})
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {filteredManagers.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || filterStatus !== "all" ? "No managers found" : "No managers yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filter"
                : "Add your first building manager to get started"}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <button
                onClick={() => router.push("/admin/managers/create")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Manager</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredManagers.map((manager) => (
              <div
                key={manager.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {manager.full_name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            manager.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {manager.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">@{manager.username}</p>
                      <p className="text-sm text-gray-500">{manager.email}</p>
                      {manager.phone && (
                        <p className="text-sm text-gray-500">{manager.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => router.push(`/admin/managers/${manager.id}`)}
                      className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => router.push(`/admin/managers/${manager.id}`)}
                      className="flex-1 bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(manager.id, manager.full_name)}
                      className="bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

