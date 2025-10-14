import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Settings } from "lucide-react";
import { useBackend } from "../lib/auth";
import type { Product } from "~backend/pos/products";
import PaymentOptionsModal from "./PaymentOptionsModal";
import OtherPaymentModal from "./OtherPaymentModal";

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
  title: string;
  header: string;
  headerSize: "Small" | "Medium" | "Large";
  fontSize: "Small" | "Medium" | "Large";
  displayUnitPrice: boolean;
  footer: string;
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
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "member" | "others">("cash");
  const [selectedOtherPayment, setSelectedOtherPayment] = useState<string>("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [salesPerson, setSalesPerson] = useState("None");
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
  ]);
  const { toast } = useToast();
  const backend = useBackend();

  const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const totalDiscount = promotion + customReduce + customDiscount;
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
    // Get receipt settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('receiptSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    
    // Default settings
    return {
      size: "80mm",
      printCopies: 1,
      topLogo: "None",
      title: "shop",
      header: "POSX SOLUTION",
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

    // Header
    if (settings.header) {
      receiptContent += `
        <div style="text-align: center; margin-bottom: 10px; font-size: ${settings.headerSize === 'Small' ? '14px' : settings.headerSize === 'Medium' ? '18px' : '22px'}; font-weight: bold;">
          ${settings.header}
        </div>
      `;
    }

    // Store info
    receiptContent += `
      <div style="text-align: center; margin-bottom: 10px; font-size: 10px;">
        Unit 4, First Floor, Jin Pg Babu Raja, Kg<br>
        Kiarong, Brunei Darussalam<br>
        Tel +673 818 4877
      </div>
    `;

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
          <div style="display: flex; justify-content: space-between;">
            <span>Discount</span>
            <span>-$${totalDiscount.toFixed(2)}</span>
          </div>
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

    // Sales person
    if (salesPerson && salesPerson !== "None") {
      receiptContent += `
        <div style="text-align: center; margin-bottom: 10px; font-size: 10px;">
          Served by: ${salesPerson}
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

      const saleResponse = await backend.pos.createSale({
        items: saleItems,
        totalAmount: actualAmount,
        paymentMethod: getPaymentMethodForAPI(),
        promotion: promotion > 0 ? promotion : undefined,
        discount: (customReduce + customDiscount) > 0 ? (customReduce + customDiscount) : undefined,
        printReceipt: printReceipt,
        salesPerson: salesPerson !== "None" ? salesPerson : undefined
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
                <Button variant="outline" className="flex-1">
                  Custom Reduce
                </Button>
                <Button variant="outline" className="flex-1">
                  Custom Discount
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
                    className={`flex-1 ${paymentMethod === "cash" ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                    onClick={() => handlePaymentMethodSelect("cash")}
                  >
                    💵 Cash
                  </Button>
                  <Button
                    variant={paymentMethod === "member" ? "default" : "outline"}
                    className={`flex-1 ${paymentMethod === "member" ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                    onClick={() => handlePaymentMethodSelect("member")}
                  >
                    👑 Member
                  </Button>
                  <Button
                    variant={paymentMethod === "others" ? "default" : "outline"}
                    className={`flex-1 ${paymentMethod === "others" ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
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
                  <Button variant="outline" className="text-red-500 border-red-500">
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
                <span className="text-orange-500">{salesPerson}</span>
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
                className="w-full h-16 text-2xl font-bold bg-red-500 hover:bg-red-600 text-white"
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
    </>
  );
}
