import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Edit, Plus, Trash2 } from "lucide-react";

interface PaymentOption {
  id: string;
  name: string;
  enabled: boolean;
}

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (options: PaymentOption[]) => void;
}

export default function PaymentOptionsModal({ isOpen, onClose, onSave }: PaymentOptionsModalProps) {
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([
    { id: "shop-coupon", name: "Shop Coupon", enabled: false },
    { id: "bibd-online", name: "BIBD Online", enabled: true },
    { id: "visa", name: "VISA", enabled: true },
    { id: "mastercard", name: "MasterCard", enabled: true },
    { id: "quickpay", name: "QuickPay", enabled: true },
    { id: "card", name: "Card", enabled: true },
    { id: "qr-code", name: "QR Code Payment", enabled: true },
  ]);
  const [newPaymentName, setNewPaymentName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const { toast } = useToast();

  const handleToggleOption = (id: string) => {
    setPaymentOptions(prev => prev.map(option =>
      option.id === id ? { ...option, enabled: !option.enabled } : option
    ));
  };

  const handleAddPayment = () => {
    if (!newPaymentName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a payment method name",
        variant: "destructive",
      });
      return;
    }

    const newOption: PaymentOption = {
      id: `custom-${Date.now()}`,
      name: newPaymentName.trim(),
      enabled: true
    };

    setPaymentOptions(prev => [...prev, newOption]);
    setNewPaymentName("");
    
    toast({
      title: "Success",
      description: "Payment method added successfully",
    });
  };

  const handleDeletePayment = (id: string) => {
    setPaymentOptions(prev => prev.filter(option => option.id !== id));
    toast({
      title: "Success",
      description: "Payment method deleted successfully",
    });
  };

  const handleStartEdit = (option: PaymentOption) => {
    setEditingId(option.id);
    setEditingName(option.name);
  };

  const handleSaveEdit = () => {
    if (!editingName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a payment method name",
        variant: "destructive",
      });
      return;
    }

    setPaymentOptions(prev => prev.map(option =>
      option.id === editingId ? { ...option, name: editingName.trim() } : option
    ));
    
    setEditingId(null);
    setEditingName("");
    
    toast({
      title: "Success",
      description: "Payment method updated successfully",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSave = () => {
    onSave(paymentOptions);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Payment Options
            </DialogTitle>
            <Button onClick={handleSave} className="bg-red-500 hover:bg-red-600 text-white">
              Save
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Other Payment Header */}
          <div className="bg-orange-400 text-white p-3 rounded-lg text-center font-medium">
            ••• Other Payment
          </div>

          {/* Payment Options List */}
          <div className="space-y-2">
            {paymentOptions.map((option) => (
              <div key={option.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer ${
                      option.enabled 
                        ? "bg-orange-400 border-orange-400" 
                        : "border-gray-300"
                    }`}
                    onClick={() => handleToggleOption(option.id)}
                  >
                    {option.enabled && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  {editingId === option.id ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                      autoFocus
                    />
                  ) : (
                    <span className="text-gray-700">{option.name}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingId === option.id ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                        ✓
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        ✕
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleStartEdit(option)}
                        className="p-2"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeletePayment(option.id)}
                        className="p-2"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add New Payment */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter new payment method"
                value={newPaymentName}
                onChange={(e) => setNewPaymentName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddPayment()}
                className="flex-1"
              />
              <Button onClick={handleAddPayment} variant="outline">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
