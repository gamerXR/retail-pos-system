import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Settings } from "lucide-react";
import { useBackend, useAuth } from "../lib/auth";
import type { Product } from "~backend/pos/products";
import PaymentOptionsModal from "./PaymentOptionsModal";
import OtherPaymentModal from "./OtherPaymentModal";
import QRPaymentModal from "./QRPaymentModal";

interface CartItem {
  product: Product;
  quantity: number;
}

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onSaleComplete: () => void;
}

interface PaymentOption {
  id: string;
  name: string;
  enabled: boolean;
}

interface ReceiptSettings {
  size: "58mm" | "80mm";
  printCopies: number;
  topLogo: string;
  topLogoFile?: string;
  companyName: string;
  address: string;
  telephone: string;
  headerSize: "Small" | "Medium" | "Large";
  fontSize: "Small" | "Medium" | "Large";
  displayUnitPrice: boolean;
  footer: string;
}

interface Salesperson {
  id: number;
  name: string;
}

export default function SettlementModal({ 
  isOpen, 
  onClose, 
  cartItems, 
  onSaleComplete 
}: SettlementModalProps) {
  const [promotion, setPromotion] = useState(0);
  const [customReduce, setCustomReduce] = useState(0);
  const [customDiscount, setCustomDiscount] = useState(0);
  const [showCustomReduceModal, setShowCustomReduceModal] = useState(false);
  const [showCustomDiscountModal, setShowCustomDiscountModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [tempCustomReduce, setTempCustomReduce] = useState("");
  const [tempCustomDiscount, setTempCustomDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "member" | "others">("cash");
  const [selectedOtherPayment, setSelectedOtherPayment] = useState<string>("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [salespersonId, setSalespersonId] = useState<string>("none");
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [paidAmount, setPaidAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showOtherPaymentModal, setShowOtherPaymentModal] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([
    { id: "shop-coupon", name: "Shop Coupon", enabled: false },
    { id: "bibd-online", name: "BIBD Online", enabled: true },
    { id: "visa", name: "VISA", enabled: true },
    { id: "mastercard", name: "MasterCard", enabled: true },
    { id: "quickpay", name: "QuickPay", enabled: true },
    { id: "card", name: "Card", enabled: true },
    { id: "qr-code", name: "QR Code Payment", enabled: true },
    { id: "ding", name: "DING!", enabled: true },
  ]);
  const [showQRPaymentModal, setShowQRPaymentModal] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();
  const auth = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadSalespersons();
    }
  }, [isOpen]);

  const loadSalespersons = async () => {
    try {
      const response = await backend.auth.listSalespersons();
      setSalespersons(response.salespersons.filter(sp => sp.isActive));
    } catch (error) {
      console.error("Error loading salespersons:", error);
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const discountAmount = (subtotal * customDiscount) / 100;
  const totalDiscount = promotion + customReduce + discountAmount;
  const actualAmount = subtotal - totalDiscount;
  const paid = parseFloat(paidAmount) || 0;
  const change = paid - actualAmount;

  const handleKeypadInput = (value: string) => {
    if (value === "⌫") {
      setPaidAmount(prev => prev.slice(0, -1));
    } else if (value === ".") {
      if (!paidAmount.includes(".")) {
        setPaidAmount(prev => prev + value);
      }
    } else {
      setPaidAmount(prev => prev + value);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setPaidAmount(amount.toString());
  };

  const handlePaymentMethodSelect = (method: "cash" | "member" | "others") => {
    setPaymentMethod(method);
    if (method === "others") {
      setShowOtherPaymentModal(true);
    } else {
      setSelectedOtherPayment("");
    }
  };

  const handleOtherPaymentSelect = (paymentName: string) => {
    setSelectedOtherPayment(paymentName);
    setShowOtherPaymentModal(false);
    
    if (paymentName === "QR Code Payment" || paymentName === "DING!") {
      setPaidAmount(actualAmount.toString());
      setShowQRPaymentModal(true);
    }
  };

  const handlePaymentOptionsUpdate = (options: PaymentOption[]) => {
    setPaymentOptions(options);
  };

  const getPaymentMethodForAPI = () => {
    if (paymentMethod === "others" && selectedOtherPayment) {
      return selectedOtherPayment;
    }
    return paymentMethod;
  };

  const getPaymentMethodDisplay = () => {
    if (paymentMethod === "others" && selectedOtherPayment) {
      return selectedOtherPayment;
    }
    return paymentMethod === "cash" ? "Cash" : paymentMethod === "member" ? "Member" : "Others";
  };

  const getReceiptSettings = (): ReceiptSettings => {
    const savedSettings = localStorage.getItem('receiptSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    
    return {
      size: "80mm",
      printCopies: 1,
      topLogo: "None",
      companyName: "POSX SOLUTION",
      address: "Unit 4, First Floor, Jin Pg Babu Raja, Kg Kiarong, Brunei Darussalam",
      telephone: "+673 818 4877",
      headerSize: "Large",
      fontSize: "Small",
      displayUnitPrice: true,
      footer: "Thank You & Come Again!"
    };
  };

  const generateReceiptContent = (saleId: number) => {
    const settings = getReceiptSettings();
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    // Calculate totals
    const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
    
    let receiptContent = `
      <div style="font-family: monospace; font-size: ${settings.fontSize === 'Small' ? '12px' : settings.fontSize === 'Medium' ? '14px' : '16px'}; line-height: 1.2; width: ${settings.size === '58mm' ? '56mm' : '76mm'}; margin: 0 auto; word-break: break-word;">
    `;

    // Top Logo
    if (settings.topLogoFile) {
      receiptContent += `
        <div style="text-align: center; margin-bottom: 10px;">
          <img src="${settings.topLogoFile}" alt="Logo" style="max-width: 80%; max-height: 60px; margin: 0 auto; display: block;" />
        </div>
      `;
    }

    // Company Name
    if (settings.companyName) {
      receiptContent += `
        <div style="text-align: center; margin-bottom: 10px; font-size: ${settings.headerSize === 'Small' ? '14px' : settings.headerSize === 'Medium' ? '18px' : '22px'}; font-weight: bold;">
          ${settings.companyName}
        </div>
      `;
    }

    // Store info
    if (settings.address || settings.telephone) {
      receiptContent += `
        <div style="text-align: center; margin-bottom: 10px; font-size: 10px;">
          ${settings.address ? settings.address.replace(/\n/g, '<br>') : ''}
          ${settings.address && settings.telephone ? '<br>' : ''}
          ${settings.telephone ? 'Tel ' + settings.telephone : ''}
        </div>
      `;
    }

    // Separator
    receiptContent += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

    // Date and time
    receiptContent += `
      <div style="text-align: center; margin-bottom: 10px;">
        Receipt #${saleId}<br>
        ${currentDate} ${currentTime}
      </div>
    `;

    // Separator
    receiptContent += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

    // Items header
    if (settings.displayUnitPrice) {
      receiptContent += `
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
          <span>Total</span>
        </div>
      `;
    } else {
      receiptContent += `
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
          <span>Item</span>
          <span>Qty</span>
          <span>Total</span>
        </div>
      `;
    }

    // Separator
    receiptContent += `<div style="border-top: 1px dashed #000; margin: 5px 0;"></div>`;

    // Items
    cartItems.forEach(item => {
      if (settings.displayUnitPrice) {
        receiptContent += `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; font-size: 11px;">
            <span style="flex: 1; word-break: break-word;">${item.product.name}</span>
            <span style="width: 30px; text-align: center; flex-shrink: 0; margin-left: 5px;">${item.quantity}</span>
            <span style="width: 45px; text-align: right; flex-shrink: 0; margin-left: 5px;">$${item.product.price.toFixed(2)}</span>
            <span style="width: 45px; text-align: right; flex-shrink: 0; margin-left: 5px;">$${(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        `;
      } else {
        receiptContent += `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; font-size: 11px;">
            <span style="flex: 1; word-break: break-word;">${item.product.name}</span>
            <span style="width: 30px; text-align: center; flex-shrink: 0; margin-left: 5px;">${item.quantity}</span>
            <span style="width: 60px; text-align: right; flex-shrink: 0; margin-left: 5px;">$${(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        `;
      }
    });

    // Separator
    receiptContent += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

    // Totals
    receiptContent += `
      <div style="margin-bottom: 5px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Total QTY</span>
          <span>${totalQuantity}</span>
        </div>
      </div>
    `;

    if (totalDiscount > 0) {
      receiptContent += `
        <div style="margin-bottom: 5px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
      `;
      
      if (customReduce > 0) {
        receiptContent += `
          <div style="display: flex; justify-content: space-between;">
            <span>Custom Reduce</span>
            <span>-$${customReduce.toFixed(2)}</span>
          </div>
        `;
      }
      
      if (customDiscount > 0) {
        receiptContent += `
          <div style="display: flex; justify-content: space-between;">
            <span>Custom Discount (${customDiscount}%)</span>
            <span>-$${discountAmount.toFixed(2)}</span>
          </div>
        `;
      }
      
      if (promotion > 0) {
        receiptContent += `
          <div style="display: flex; justify-content: space-between;">
            <span>Promotion</span>
            <span>-$${promotion.toFixed(2)}</span>
          </div>
        `;
      }
      
      receiptContent += `
        </div>
      `;
    }

    receiptContent += `
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
        <span>Total Amount</span>
        <span>$${actualAmount.toFixed(2)}</span>
      </div>
    `;

    // Payment info
    receiptContent += `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Payment Method</span>
          <span>${getPaymentMethodDisplay()}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Paid</span>
          <span>$${paid.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Change</span>
          <span>$${change.toFixed(2)}</span>
        </div>
      </div>
    `;

    // Separator
    receiptContent += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

    // Remarks
    if (remarks) {
      receiptContent += `
        <div style="text-align: center; margin-bottom: 10px; font-size: 10px;">
          Remarks: ${remarks}
        </div>
      `;
    }

    // Sales person
    const salespersonName = salespersonId !== "none" 
      ? salespersons.find(sp => sp.id === parseInt(salespersonId))?.name 
      : auth.salespersonName || (auth.isSalesperson ? "Unknown Salesperson" : null);
      
    if (salespersonName) {
      receiptContent += `
        <div style="text-align: center; margin-bottom: 10px; font-size: 10px;">
          Served by: ${salespersonName}
        </div>
      `;
    }

    // Footer
    if (settings.footer) {
      receiptContent += `
        <div style="text-align: center; margin-top: 10px; font-size: 10px;">
          ${settings.footer}
        </div>
      `;
    }

    receiptContent += `</div>`;
    
    return receiptContent;
  };

  const handlePrintReceipt = async (saleId: number) => {
    if (!printReceipt) return;

    try {
      const settings = getReceiptSettings();
      const receiptContent = generateReceiptContent(saleId);

      // Print the specified number of copies
      for (let copy = 1; copy <= settings.printCopies; copy++) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Receipt - Copy ${copy}</title>
                <style>
                  body { 
                    margin: 0; 
                    padding: 0; 
                    font-family: monospace;
                  }
                  @media print {
                    @page {
                      size: ${settings.size === '58mm' ? '58mm auto' : '80mm auto'};
                      margin: 3mm;
                    }
                  }
                </style>
              </head>
              <body>
                ${receiptContent}
                ${settings.printCopies > 1 ? `<div style="text-align: center; margin-top: 10px; font-size: 8px;">Copy ${copy} of ${settings.printCopies}</div>` : ''}
              </body>
            </html>
          `);
          printWindow.document.close();
          
          // Add a small delay between copies
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, copy * 500);
        }
      }

      toast({
        title: "Receipt Printed",
        description: `Receipt printed successfully (${settings.printCopies} ${settings.printCopies === 1 ? 'copy' : 'copies'})`,
      });
    } catch (error) {
      console.error("Error printing receipt:", error);
      toast({
        title: "Print Error",
        description: "Failed to print receipt. Please check printer settings.",
        variant: "destructive",
      });
    }
  };

  const handleFinish = async () => {
    if (paid < actualAmount) {
      toast({
        title: "Error",
        description: "Insufficient payment amount",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "others" && !selectedOtherPayment) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const saleItems = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: item.product.price * item.quantity
      }));

      const salespersonNameForSale = salespersonId !== "none" 
        ? salespersons.find(sp => sp.id === parseInt(salespersonId))?.name 
        : auth.salespersonName || undefined;

      const salespersonIdForSale = salespersonId !== "none" 
        ? parseInt(salespersonId)
        : auth.salespersonId || undefined;

      const saleResponse = await backend.pos.createSale({
        items: saleItems,
        totalAmount: actualAmount,
        paymentMethod: getPaymentMethodForAPI(),
        promotion: promotion > 0 ? promotion : undefined,
        discount: (customReduce + discountAmount) > 0 ? (customReduce + discountAmount) : undefined,
        customReduce: customReduce > 0 ? customReduce : undefined,
        customDiscount: customDiscount > 0 ? customDiscount : undefined,
        printReceipt: printReceipt,
        salesPerson: salespersonNameForSale,
        salespersonId: salespersonIdForSale,
        remarks: remarks || undefined
      });

      toast({
        title: "Sale Completed",
        description: `Sale of $${actualAmount.toFixed(2)} completed successfully via ${getPaymentMethodDisplay()}`,
      });

      // Print receipt if enabled and we have a valid sale response
      if (printReceipt && saleResponse && saleResponse.sale && saleResponse.sale.id) {
        await handlePrintReceipt(saleResponse.sale.id);
      }

      onSaleComplete();
    } catch (error) {
      console.error("Error completing sale:", error);
      toast({
        title: "Error",
        description: "Failed to complete sale",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleFinish();
    }
  };

  const keypadNumbers = [
    ["7", "8", "9", "50"],
    ["4", "5", "6", "20"],
    ["1", "2", "3", "10"],
    [".", "0", "⌫", "6"]
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                Settlement
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex gap-6">
            {/* Left Side - Settlement Details */}
            <div className="flex-1 space-y-6">
              {/* Total Amount */}
              <div className="flex justify-between items-center">
                <span className="text-lg">Total Amount</span>
                <span className="text-lg font-semibold">${subtotal.toFixed(2)}</span>
              </div>

              {/* Promotion */}
              <div className="flex justify-between items-center">
                <span className="text-lg">Promotion</span>
                <span className="text-lg">${promotion.toFixed(2)}</span>
              </div>

              {/* Actual Amount */}
              <div className="flex justify-between items-center">
                <span className="text-lg">Actual</span>
                <span className="text-lg text-orange-500 font-semibold">${actualAmount.toFixed(2)}</span>
              </div>

              {/* Custom Buttons */}
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    if (auth.isSalesperson && !auth.canGiveDiscounts) {
                      toast({
                        title: "Permission Denied",
                        description: "You don't have permission to give discounts",
                        variant: "destructive",
                      });
                      return;
                    }
                    setShowCustomReduceModal(true);
                  }}
                >
                  Custom Reduce
                  {customReduce > 0 && <span className="ml-2 text-orange-500">(-${customReduce.toFixed(2)})</span>}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    if (auth.isSalesperson && !auth.canGiveDiscounts) {
                      toast({
                        title: "Permission Denied",
                        description: "You don't have permission to give discounts",
                        variant: "destructive",
                      });
                      return;
                    }
                    setShowCustomDiscountModal(true);
                  }}
                >
                  Custom Discount
                  {customDiscount > 0 && <span className="ml-2 text-orange-500">(-{customDiscount}%)</span>}
                </Button>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">Payment</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowPaymentOptions(true)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex gap-4">
                  <Button
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    className={`flex-1 ${paymentMethod === "cash" ? "text-white hover:opacity-90" : ""}`}
                    style={paymentMethod === "cash" ? { backgroundColor: 'hsl(163.1, 88.1%, 19.8%)' } : undefined}
                    onClick={() => handlePaymentMethodSelect("cash")}
                  >
                    💵 Cash
                  </Button>
                  <Button
                    variant={paymentMethod === "member" ? "default" : "outline"}
                    className={`flex-1 ${paymentMethod === "member" ? "text-white hover:opacity-90" : ""}`}
                    style={paymentMethod === "member" ? { backgroundColor: 'hsl(163.1, 88.1%, 19.8%)' } : undefined}
                    onClick={() => handlePaymentMethodSelect("member")}
                  >
                    👑 Member
                  </Button>
                  <Button
                    variant={paymentMethod === "others" ? "default" : "outline"}
                    className={`flex-1 ${paymentMethod === "others" ? "text-white hover:opacity-90" : ""}`}
                    style={paymentMethod === "others" ? { backgroundColor: 'hsl(163.1, 88.1%, 19.8%)' } : undefined}
                    onClick={() => handlePaymentMethodSelect("others")}
                  >
                    ••• {paymentMethod === "others" && selectedOtherPayment ? selectedOtherPayment : "Others"}
                  </Button>
                </div>

                {/* Selected Other Payment Display */}
                {paymentMethod === "others" && selectedOtherPayment && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-700">Selected Payment Method:</span>
                      <span className="font-medium text-orange-800">{selectedOtherPayment}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Number and Split Bill */}
              <div className="flex justify-between items-center">
                <span className="text-lg">Number</span>
                <div className="flex items-center gap-4">
                  <span className="text-orange-500">1</span>
                  <Button 
                    variant="outline" 
                    className="text-white hover:opacity-90 border-0"
                    style={{ backgroundColor: 'hsl(163.1, 88.1%, 19.8%)' }}
                    onClick={() => {/* TODO: Implement split bill */}}
                  >
                    Split bill
                  </Button>
                </div>
              </div>

              {/* Print */}
              <div className="flex justify-between items-center">
                <span className="text-lg">Print</span>
                <Switch
                  checked={printReceipt}
                  onCheckedChange={setPrintReceipt}
                  className="data-[state=checked]:bg-red-500"
                />
              </div>

              {/* Sales Person */}
              <div className="flex justify-between items-center">
                <span className="text-lg">Sales Person</span>
                <Select value={salespersonId} onValueChange={setSalespersonId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {auth.isSalesperson ? auth.salespersonName || "Me" : "None"}
                    </SelectItem>
                    {!auth.isSalesperson && salespersons.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id.toString()}>
                        {sp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Remarks */}
              <div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowRemarksModal(true)}
                >
                  Remarks
                  {remarks && <span className="ml-2 text-orange-500">✓</span>}
                </Button>
                {remarks && (
                  <div className="mt-2 text-sm text-gray-600 italic">"{remarks}"</div>
                )}
              </div>

              {/* Change Display */}
              {paid > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Change:</span>
                    <span className="text-xl font-bold text-green-600">
                      ${change >= 0 ? change.toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Payment */}
            <div className="flex-1 space-y-4">
              {/* Paid Amount Display */}
              <div className="text-right">
                <div className="text-sm text-gray-500">Paid</div>
                <div className="text-4xl font-bold bg-cyan-100 p-4 rounded text-right">
                  <input
                    type="text"
                    value={paidAmount || actualAmount.toFixed(2)}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-transparent border-none outline-none text-right w-full"
                    autoFocus
                  />
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-4 gap-3">
                {keypadNumbers.flat().map((key, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`h-16 text-xl font-semibold ${
                      ["50", "20", "10", "6"].includes(key) ? "bg-gray-100" : ""
                    }`}
                    onClick={() => {
                      if (["50", "20", "10", "6"].includes(key)) {
                        handleQuickAmount(parseInt(key));
                      } else {
                        handleKeypadInput(key);
                      }
                    }}
                  >
                    {key}
                  </Button>
                ))}
              </div>

              {/* Finish Button */}
              <Button
                onClick={handleFinish}
                disabled={isLoading}
                className="w-full h-16 text-2xl font-bold text-white hover:opacity-90"
                style={{ backgroundColor: 'hsl(163.1, 88.1%, 19.8%)' }}
              >
                {isLoading ? "Processing..." : "Finish"}
              </Button>

              {/* Print Info */}
              {printReceipt && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-700">
                    <strong>Print Settings:</strong> Receipt will be printed automatically after payment completion using your configured printer settings.
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Options Modal */}
      <PaymentOptionsModal
        isOpen={showPaymentOptions}
        onClose={() => setShowPaymentOptions(false)}
        onSave={handlePaymentOptionsUpdate}
      />

      {/* Other Payment Selection Modal */}
      <OtherPaymentModal
        isOpen={showOtherPaymentModal}
        onClose={() => setShowOtherPaymentModal(false)}
        onSelect={handleOtherPaymentSelect}
        paymentOptions={paymentOptions}
      />

      {/* QR Payment Modal */}
      <QRPaymentModal
        isOpen={showQRPaymentModal}
        onClose={() => {
          setShowQRPaymentModal(false);
          setPaymentMethod("cash");
          setSelectedOtherPayment("");
        }}
        onConfirm={handleFinish}
        totalAmount={actualAmount}
      />

      {/* Custom Reduce Modal */}
      <Dialog open={showCustomReduceModal} onOpenChange={setShowCustomReduceModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom Reduce (Amount)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Enter amount to deduct:</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={subtotal}
                value={tempCustomReduce}
                onChange={(e) => setTempCustomReduce(e.target.value)}
                className="w-full mt-2 px-3 py-2 border rounded-md"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="text-sm text-gray-600">
              Current subtotal: ${subtotal.toFixed(2)}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setTempCustomReduce("");
                  setShowCustomReduceModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={() => {
                  const amount = parseFloat(tempCustomReduce) || 0;
                  setCustomReduce(Math.min(amount, subtotal));
                  setTempCustomReduce("");
                  setShowCustomReduceModal(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Discount Modal */}
      <Dialog open={showCustomDiscountModal} onOpenChange={setShowCustomDiscountModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom Discount (Percentage)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Enter discount percentage:</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={tempCustomDiscount}
                onChange={(e) => setTempCustomDiscount(e.target.value)}
                className="w-full mt-2 px-3 py-2 border rounded-md"
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="text-sm text-gray-600">
              Current subtotal: ${subtotal.toFixed(2)}<br />
              {tempCustomDiscount && parseFloat(tempCustomDiscount) > 0 && (
                <>Discount amount: ${((subtotal * parseFloat(tempCustomDiscount)) / 100).toFixed(2)}</>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setTempCustomDiscount("");
                  setShowCustomDiscountModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={() => {
                  const percentage = parseFloat(tempCustomDiscount) || 0;
                  setCustomDiscount(Math.min(percentage, 100));
                  setTempCustomDiscount("");
                  setShowCustomDiscountModal(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remarks Modal */}
      <Dialog open={showRemarksModal} onOpenChange={setShowRemarksModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Remarks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Remarks:</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full mt-2 px-3 py-2 border rounded-md min-h-[100px]"
                placeholder="Enter any remarks for this sale..."
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRemarksModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={() => setShowRemarksModal(false)}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
