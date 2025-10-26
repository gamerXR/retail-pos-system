import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  Calendar,
  Building,
  Mail,
  Phone,
  BarChart3,
  UserCheck,
  UserX,
  Clock,
  Activity,
  Edit,
  Trash2,
  KeyRound,
  QrCode
} from "lucide-react";
import backend from "~backend/client";
import QRCodeUploadModal from "./QRCodeUploadModal";

interface Client {
  id: number;
  phoneNumber: string;
  clientName: string;
  email?: string;
  companyName?: string;
  status: string;
  qrCodeImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  onHoldClients: number;
  suspendedClients: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
}

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"clients" | "reports">("clients");
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showQRUpload, setShowQRUpload] = useState(false);
  const [selectedClientForQR, setSelectedClientForQR] = useState<{ id: number; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newClient, setNewClient] = useState({
    phoneNumber: "",
    clientName: "",
    password: "",
    email: "",
    companyName: ""
  });
  const [editClient, setEditClient] = useState({
    phoneNumber: "",
    clientName: "",
    email: "",
    companyName: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "clients") {
        const response = await backend.auth.listClients();
        setClients(response.clients);
      } else if (activeTab === "reports") {
        const statsResponse = await backend.auth.getClientStats();
        setStats(statsResponse);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.phoneNumber || !newClient.clientName || !newClient.password) {
      toast({
        title: "Error",
        description: "Phone Number, Client Name and Password are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await backend.auth.createClient({
        phoneNumber: newClient.phoneNumber,
        clientName: newClient.clientName,
        password: newClient.password,
        email: newClient.email || undefined,
        companyName: newClient.companyName || undefined
      });

      if (response.success) {
        toast({
          title: "Client Created",
          description: `Phone Number: ${response.client.phoneNumber}`,
        });
        setNewClient({
          phoneNumber: "",
          clientName: "",
          password: "",
          email: "",
          companyName: ""
        });
        setShowCreateClient(false);
        loadData();
      }
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (clientId: number, status: string) => {
    try {
      await backend.auth.updateClientStatus({ id: clientId, status });
      toast({
        title: "Status Updated",
        description: `Client status updated to ${status}`,
      });
      loadData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setEditClient({
      phoneNumber: client.phoneNumber,
      clientName: client.clientName,
      email: client.email || "",
      companyName: client.companyName || ""
    });
    setShowEditClient(true);
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;

    if (!editClient.phoneNumber || !editClient.clientName) {
      toast({
        title: "Error",
        description: "Phone Number and Client Name are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await backend.auth.updateClient({
        id: editingClient.id,
        phoneNumber: editClient.phoneNumber,
        clientName: editClient.clientName,
        email: editClient.email || undefined,
        companyName: editClient.companyName || undefined
      });

      toast({
        title: "Client Updated",
        description: "Client details updated successfully",
      });
      setShowEditClient(false);
      setEditingClient(null);
      loadData();
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update client",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      return;
    }

    try {
      await backend.auth.deleteClient({ id: clientId });
      toast({
        title: "Client Deleted",
        description: "Client deleted successfully",
      });
      loadData();
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (clientId: number) => {
    if (!confirm("Are you sure you want to reset this client's password to 123456?")) {
      return;
    }

    try {
      await backend.auth.resetClientPassword({ id: clientId });
      toast({
        title: "Password Reset",
        description: "Client password has been reset to 123456",
      });
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const handleUploadQR = (clientId: number, clientName: string) => {
    setSelectedClientForQR({ id: clientId, name: clientName });
    setShowQRUpload(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "onhold":
        return "secondary";
      case "suspended":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "onhold":
        return "text-yellow-600";
      case "suspended":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Admin Dashboard - Client Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[600px]">
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <div className="space-y-2">
              <Button
                variant={activeTab === "clients" ? "default" : "ghost"}
                className={`w-full justify-start gap-2 ${
                  activeTab === "clients" ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => setActiveTab("clients")}
              >
                <Users className="w-4 h-4" />
                Clients ({clients.length})
              </Button>
              <Button
                variant={activeTab === "reports" ? "default" : "ghost"}
                className={`w-full justify-start gap-2 ${
                  activeTab === "reports" ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => setActiveTab("reports")}
              >
                <BarChart3 className="w-4 h-4" />
                Reports
              </Button>
            </div>

            {activeTab === "clients" && (
              <div className="mt-6">
                <Button
                  onClick={() => setShowCreateClient(true)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Client
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3">Loading...</span>
              </div>
            ) : activeTab === "clients" ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Client Management</h3>
                {clients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No clients created yet</p>
                    <p className="text-sm mt-2">Create your first client to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clients.map((client) => (
                      <div key={client.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-800">{client.clientName}</h4>
                              <Badge variant={getStatusBadgeVariant(client.status)}>
                                {client.status.toUpperCase()}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{client.phoneNumber}</span>
                              </div>
                              {client.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  <span>{client.email}</span>
                                </div>
                              )}
                              {client.companyName && (
                                <div className="flex items-center gap-2">
                                  <Building className="w-4 h-4" />
                                  <span>{client.companyName}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Created: {formatDate(client.createdAt)}</span>
                              </div>
                            </div>

                            <div className="mt-3 p-2 bg-gray-50 rounded border">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-xs text-gray-500">Phone Number:</span>
                                  <span className="ml-2 text-sm font-mono">{client.phoneNumber}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(client.phoneNumber)}
                                >
                                  Copy
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Select
                              value={client.status}
                              onValueChange={(value) => handleUpdateStatus(client.id, value)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="onhold">On Hold</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex gap-1 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleEditClient(client)}
                                title="Edit Client"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-blue-600 hover:text-blue-700"
                                onClick={() => handleUploadQR(client.id, client.clientName)}
                                title="Upload QR Payment Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-orange-600 hover:text-orange-700"
                                onClick={() => handleResetPassword(client.id)}
                                title="Reset Password to 123456"
                              >
                                <KeyRound className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteClient(client.id)}
                                title="Delete Client"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Client Reports</h3>
                
                {stats && (
                  <>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Clients</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalClients}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <UserCheck className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Active</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.activeClients}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">On Hold</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.onHoldClients}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <UserX className="w-6 h-6 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Suspended</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.suspendedClients}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Status Breakdown
                      </h4>
                      <div className="space-y-3">
                        {stats.statusBreakdown.map((item) => (
                          <div key={item.status} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                item.status === 'active' ? 'bg-green-500' :
                                item.status === 'onhold' ? 'bg-yellow-500' :
                                item.status === 'suspended' ? 'bg-red-500' :
                                'bg-gray-500'
                              }`} />
                              <span className="capitalize text-gray-700">{item.status}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-gray-600">{item.count} clients</span>
                              <span className="text-sm text-gray-500">
                                ({stats.totalClients > 0 ? ((item.count / stats.totalClients) * 100).toFixed(1) : 0}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <Input
                  placeholder="Enter client name"
                  value={newClient.clientName}
                  onChange={(e) => setNewClient(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <Input
                  type="password"
                  placeholder="Enter client password"
                  value={newClient.password}
                  onChange={(e) => setNewClient(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={newClient.phoneNumber}
                  onChange={(e) => setNewClient(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <Input
                  placeholder="Enter company name"
                  value={newClient.companyName}
                  onChange={(e) => setNewClient(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateClient(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateClient}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  Create Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditClient} onOpenChange={setShowEditClient}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <Input
                  placeholder="Enter client name"
                  value={editClient.clientName}
                  onChange={(e) => setEditClient(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={editClient.phoneNumber}
                  onChange={(e) => setEditClient(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={editClient.email}
                  onChange={(e) => setEditClient(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <Input
                  placeholder="Enter company name"
                  value={editClient.companyName}
                  onChange={(e) => setEditClient(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditClient(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateClient}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Update Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {selectedClientForQR && (
          <QRCodeUploadModal
            isOpen={showQRUpload}
            onClose={() => {
              setShowQRUpload(false);
              setSelectedClientForQR(null);
            }}
            clientId={selectedClientForQR.id}
            clientName={selectedClientForQR.name}
            onSuccess={() => loadData()}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
