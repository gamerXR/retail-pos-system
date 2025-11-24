import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import backend from "~backend/client";

interface SalesTransactionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TransactionItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SalesTransaction {
  receipt_number: string;
  sale_date: Date;
  sale_time: string;
  payment_method: string;
  total_amount: number;
  items: TransactionItem[];
}

export default function SalesTransactionReportModal({ isOpen, onClose }: SalesTransactionReportModalProps) {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      fetchTransactions(today, today);
    }
  }, [isOpen]);

  const fetchTransactions = async (start: string, end: string) => {
    try {
      setLoading(true);
      const startDateTime = new Date(start + 'T00:00:00');
      const endDateTime = new Date(end + 'T23:59:59');
      
      const response = await backend.pos.getSalesTransactions({
        startDate: startDateTime,
        endDate: endDateTime
      });
      
      setTransactions(response.transactions);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load sales transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (startDate && endDate) {
      fetchTransactions(startDate, endDate);
      setExpandedReceipt(null);
    }
  };

  const toggleReceipt = (receiptNumber: string) => {
    setExpandedReceipt(expandedReceipt === receiptNumber ? null : receiptNumber);
  };

  const getPaymentMethodBadgeColor = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "member":
        return "bg-blue-100 text-blue-800";
      case "others":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalTransactions = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Sales Transaction Report
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Loading..." : "Search"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Total Transactions</div>
              <div className="text-2xl font-bold text-gray-900">{totalTransactions}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-500">Loading...</div>
              ) : transactions.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">No transactions found</div>
              ) : (
                <div className="divide-y">
                  {transactions.map((transaction) => (
                    <div key={transaction.receipt_number} className="bg-white">
                      <div
                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                        onClick={() => toggleReceipt(transaction.receipt_number)}
                      >
                        <div className="flex-1 grid grid-cols-5 gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Receipt #</div>
                            <div className="font-semibold text-gray-900">{transaction.receipt_number}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Date</div>
                            <div className="text-sm text-gray-900">
                              {new Date(transaction.sale_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Time</div>
                            <div className="text-sm text-gray-900">{transaction.sale_time}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Payment</div>
                            <div>
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPaymentMethodBadgeColor(transaction.payment_method)}`}>
                                {transaction.payment_method}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Total</div>
                            <div className="font-bold text-gray-900">${transaction.total_amount.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {expandedReceipt === transaction.receipt_number ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedReceipt === transaction.receipt_number && (
                        <div className="px-4 pb-4 bg-gray-50">
                          <div className="mt-2">
                            <div className="text-sm font-semibold text-gray-700 mb-2">Items:</div>
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-3 py-2 text-left text-gray-600">Product</th>
                                  <th className="px-3 py-2 text-right text-gray-600">Qty</th>
                                  <th className="px-3 py-2 text-right text-gray-600">Unit Price</th>
                                  <th className="px-3 py-2 text-right text-gray-600">Total</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white">
                                {transaction.items.map((item, index) => (
                                  <tr key={index} className="border-b border-gray-100">
                                    <td className="px-3 py-2 text-gray-900">{item.product_name}</td>
                                    <td className="px-3 py-2 text-right text-gray-900">{item.quantity}</td>
                                    <td className="px-3 py-2 text-right text-gray-900">${item.unit_price.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                      ${item.total_price.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
