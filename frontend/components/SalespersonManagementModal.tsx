import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "@/lib/auth";
import { Users, Plus, Edit, Trash2, KeyRound, Phone, User } from "lucide-react";

interface Salesperson {
  id: number;
  clientId: number;
  name: string;
  phoneNumber: string;
  canProcessReturns: boolean;
  canGiveDiscounts: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SalespersonManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SalespersonManagementModal({ isOpen, onClose }: SalespersonManagementModalProps) {
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    password: "",
    canProcessReturns: false,
    canGiveDiscounts: false
  });
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    if (isOpen) {
      loadSalespersons();
    }
  }, [isOpen]);

  const loadSalespersons = async () => {
    setIsLoading(true);
    try {
      const response = await backend.auth.listSalespersons();
      setSalespersons(response.salespersons);
    } catch (error: any) {
      console.error("Error loading salespersons:", error);
      toast({
        title: "Error",
        description: "Failed to load salespersons",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.phoneNumber || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await backend.auth.createSalesperson({
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        canProcessReturns: formData.canProcessReturns,
        canGiveDiscounts: formData.canGiveDiscounts
      });

      toast({
        title: "Success",
        description: "Salesperson created successfully",
      });

      setShowCreateForm(false);
      setFormData({
        name: "",
        phoneNumber: "",
        password: "",
        canProcessReturns: false,
        canGiveDiscounts: false
      });
      loadSalespersons();
    } catch (error: any) {
      console.error("Error creating salesperson:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create salesperson",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (salesperson: Salesperson) => {
    setEditingSalesperson(salesperson);
    setFormData({
      name: salesperson.name,
      phoneNumber: salesperson.phoneNumber,
      password: "",
      canProcessReturns: salesperson.canProcessReturns,
      canGiveDiscounts: salesperson.canGiveDiscounts
    });
    setShowEditForm(true);
  };

  const handleUpdate = async () => {
    if (!editingSalesperson) return;

    try {
      await backend.auth.updateSalesperson({
        id: editingSalesperson.id,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        canProcessReturns: formData.canProcessReturns,
        canGiveDiscounts: formData.canGiveDiscounts
      });

      toast({
        title: "Success",
        description: "Salesperson updated successfully",
      });

      setShowEditForm(false);
      setEditingSalesperson(null);
      setFormData({
        name: "",
        phoneNumber: "",
        password: "",
        canProcessReturns: false,
        canGiveDiscounts: false
      });
      loadSalespersons();
    } catch (error: any) {
      console.error("Error updating salesperson:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update salesperson",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this salesperson?")) return;

    try {
      await backend.auth.deleteSalesperson({ id });
      toast({
        title: "Success",
        description: "Salesperson deleted successfully",
      });
      loadSalespersons();
    } catch (error: any) {
      console.error("Error deleting salesperson:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete salesperson",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (id: number) => {
    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;

    try {
      await backend.auth.updateSalespersonPassword({ id, password: newPassword });
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await backend.auth.updateSalesperson({ id, isActive: !currentStatus });
      toast({
        title: "Success",
        description: `Salesperson ${!currentStatus ? "activated" : "deactivated"} successfully`,
      });
      loadSalespersons();
    } catch (error: any) {
      console.error("Error toggling active status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Salesperson Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showCreateForm && !showEditForm && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">
                  Total: {salespersons.length} salesperson(s)
                </h3>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Salesperson
                </Button>
              </div>

              <div className="overflow-y-auto max-h-[500px] space-y-3">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading...</p>
                  </div>
                ) : salespersons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No salespersons created yet</p>
                    <p className="text-sm mt-2">Create your first salesperson to get started</p>
                  </div>
                ) : (
                  salespersons.map((sp) => (
                    <div key={sp.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-800">{sp.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${sp.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {sp.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{sp.phoneNumber}</span>
                            </div>
                            <div className="flex gap-4 mt-2">
                              <label className="flex items-center gap-2 text-xs">
                                <input type="checkbox" checked={sp.canProcessReturns} disabled className="rounded" />
                                Can Process Returns
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                                <input type="checkbox" checked={sp.canGiveDiscounts} disabled className="rounded" />
                                Can Give Discounts
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(sp)}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600"
                              onClick={() => handleResetPassword(sp.id)}
                              title="Reset Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleDelete(sp.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant={sp.isActive ? "outline" : "default"}
                            onClick={() => toggleActive(sp.id, sp.isActive)}
                            className="w-full"
                          >
                            {sp.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {(showCreateForm || showEditForm) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {showCreateForm ? 'Create New Salesperson' : 'Edit Salesperson'}
              </h3>

              <div>
                <label className="text-sm font-medium text-gray-700">Name *</label>
                <Input
                  placeholder="Enter salesperson name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>

              {showCreateForm && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Password *</label>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Allow Processing Returns</p>
                    <p className="text-xs text-gray-500">Can process refunds and returns</p>
                  </div>
                  <Switch
                    checked={formData.canProcessReturns}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canProcessReturns: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Allow Giving Discounts</p>
                    <p className="text-xs text-gray-500">Can apply discounts to sales</p>
                  </div>
                  <Switch
                    checked={formData.canGiveDiscounts}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canGiveDiscounts: checked }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCreateForm(false);
                    setShowEditForm(false);
                    setEditingSalesperson(null);
                    setFormData({
                      name: "",
                      phoneNumber: "",
                      password: "",
                      canProcessReturns: false,
                      canGiveDiscounts: false
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  onClick={showCreateForm ? handleCreate : handleUpdate}
                >
                  {showCreateForm ? 'Create' : 'Update'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
