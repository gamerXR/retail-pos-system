import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Users, 
  Key, 
  Clock, 
  Plus, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Calendar,
  Building,
  Mail,
  Phone
} from "lucide-react";
import backend from "~backend/client";

interface License {
  id: number;
  licenseKey: string;
  phoneId: string;
  clientName: string;
  email?: string;
  companyName?: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

interface TrialSession {
  id: number;
  deviceId: string;
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
  timeRemaining?: number;
}

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"licenses" | "trials">("licenses");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [trials, setTrials] = useState<TrialSession[]>([]);
  const [showCreateLicense, setShowCreateLicense] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newLicense, setNewLicense] = useState({
    phoneId: "",
    clientName: "",
    password: "",
    email: "",
    companyName: "",
    expiresAt: ""
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
      if (activeTab === "licenses") {
        const response = await backend.auth.listLicenses();
        setLicenses(response.licenses);
      } else {
        const response = await backend.auth.listTrialSessions();
        setTrials(response.sessions);
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

  const handleCreateLicense = async () => {
    if (!newLicense.phoneId || !newLicense.clientName || !newLicense.password) {
      toast({
        title: "Error",
        description: "Phone ID, Client Name, and Password are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await backend.auth.createLicense({
        phoneId: newLicense.phoneId,
        clientName: newLicense.clientName,
        password: newLicense.password,
        email: newLicense.email || undefined,
        companyName: newLicense.companyName || undefined,
        expiresAt: newLicense.expiresAt || undefined
      });

      if (response.success) {
        toast({
          title: "License Created",
          description: `License key: ${response.license.licenseKey}`,
        });
        setNewLicense({
          phoneId: "",
          clientName: "",
          password: "",
          email: "",
          companyName: "",
          expiresAt: ""
        });
        setShowCreateLicense(false);
        loadData();
      }
    } catch (error: any) {
      console.error("Error creating license:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create license",
        variant: "destructive",
      });
    }
  };

  const handleToggleLicense = async (licenseId: number, isActive: boolean) => {
    try {
      if (isActive) {
        await backend.auth.deactivateLicense({ id: licenseId });
        toast({
          title: "License Deactivated",
          description: "License has been deactivated",
        });
      } else {
        await backend.auth.activateLicense({ id: licenseId });
        toast({
          title: "License Activated",
          description: "License has been activated",
        });
      }
      loadData();
    } catch (error) {
      console.error("Error toggling license:", error);
      toast({
        title: "Error",
        description: "Failed to update license status",
        variant: "destructive",
      });
    }
  };

  const handleTerminateTrial = async (trialId: number) => {
    try {
      await backend.auth.terminateTrialSession({ id: trialId });
      toast({
        title: "Trial Terminated",
        description: "Trial session has been terminated",
      });
      loadData();
    } catch (error) {
      console.error("Error terminating trial:", error);
      toast({
        title: "Error",
        description: "Failed to terminate trial",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Admin Dashboard - License Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <div className="space-y-2">
              <Button
                variant={activeTab === "licenses" ? "default" : "ghost"}
                className={`w-full justify-start gap-2 ${
                  activeTab === "licenses" ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => setActiveTab("licenses")}
              >
                <Key className="w-4 h-4" />
                Licenses ({licenses.length})
              </Button>
              <Button
                variant={activeTab === "trials" ? "default" : "ghost"}
                className={`w-full justify-start gap-2 ${
                  activeTab === "trials" ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => setActiveTab("trials")}
              >
                <Clock className="w-4 h-4" />
                Trial Sessions ({trials.length})
              </Button>
            </div>

            {activeTab === "licenses" && (
              <div className="mt-6">
                <Button
                  onClick={() => setShowCreateLicense(true)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create License
                </Button>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3">Loading...</span>
              </div>
            ) : activeTab === "licenses" ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">License Management</h3>
                {licenses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No licenses created yet</p>
                    <p className="text-sm mt-2">Create your first license to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {licenses.map((license) => (
                      <div key={license.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-800">{license.clientName}</h4>
                              <Badge variant={license.isActive ? "default" : "secondary"}>
                                {license.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {license.expiresAt && new Date(license.expiresAt) < new Date() && (
                                <Badge variant="destructive">Expired</Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>Phone ID: {license.phoneId}</span>
                              </div>
                              {license.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  <span>{license.email}</span>
                                </div>
                              )}
                              {license.companyName && (
                                <div className="flex items-center gap-2">
                                  <Building className="w-4 h-4" />
                                  <span>{license.companyName}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Created: {formatDate(license.createdAt)}</span>
                              </div>
                              {license.expiresAt && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Expires: {formatDate(license.expiresAt)}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-3 p-2 bg-gray-50 rounded border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-mono">{license.licenseKey}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(license.licenseKey)}
                                >
                                  Copy
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant={license.isActive ? "destructive" : "default"}
                              onClick={() => handleToggleLicense(license.id, license.isActive)}
                            >
                              {license.isActive ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Trial Sessions</h3>
                {trials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No trial sessions found</p>
                    <p className="text-sm mt-2">Trial sessions will appear here when users start trials</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trials.map((trial) => (
                      <div key={trial.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-800">Device: {trial.deviceId}</h4>
                              <Badge variant={trial.isActive ? "default" : "secondary"}>
                                {trial.isActive ? "Active" : "Expired"}
                              </Badge>
                              {trial.timeRemaining && trial.timeRemaining <= 5 && (
                                <Badge variant="destructive">Ending Soon</Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Started: {formatDate(trial.startedAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Expires: {formatDate(trial.expiresAt)}</span>
                              </div>
                              {trial.timeRemaining && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span className={trial.timeRemaining <= 5 ? "text-red-600 font-medium" : ""}>
                                    Time Remaining: {formatTime(trial.timeRemaining)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {trial.isActive && (
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleTerminateTrial(trial.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Terminate
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create License Modal */}
        <Dialog open={showCreateLicense} onOpenChange={setShowCreateLicense}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New License</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone ID *
                </label>
                <Input
                  placeholder="Enter unique phone ID"
                  value={newLicense.phoneId}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, phoneId: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <Input
                  placeholder="Enter client name"
                  value={newLicense.clientName}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <Input
                  type="password"
                  placeholder="Enter client password"
                  value={newLicense.password}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newLicense.email}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <Input
                  placeholder="Enter company name"
                  value={newLicense.companyName}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={newLicense.expiresAt}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for permanent license</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateLicense(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateLicense}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  Create License
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
