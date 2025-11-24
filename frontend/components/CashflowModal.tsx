import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Plus, Trash2, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useBackend } from "../lib/auth";
import type { Expense } from "~backend/pos/cashflow";

interface CashflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CashflowModal({ isOpen, onClose }: CashflowModalProps) {
  const [activeTab, setActiveTab] = useState<"add" | "report">("add");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    if (isOpen && activeTab === "report") {
      loadCashflowReport();
    }
  }, [isOpen, activeTab]);

  const loadCashflowReport = async () => {
    try {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const report = await backend.pos.getCashflowReport({
        startDate,
        endDate
      });

      setExpenses(report.expenses);
      setTotalSales(report.totalSales);
      setTotalExpenses(report.totalExpenses);
    } catch (error) {
      console.error("Error loading cashflow report:", error);
      toast({
        title: "Error",
        description: "Failed to load cashflow report",
        variant: "destructive",
      });
    }
  };

  const handleAddExpense = async () => {
    if (!description.trim() || !amount) {
      toast({
        title: "Error",
        description: "Please enter description and amount",
        variant: "destructive",
      });
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await backend.pos.createExpense({
        description: description.trim(),
        amount: expenseAmount,
        category: category.trim() || undefined
      });

      toast({
        title: "Success",
        description: "Expense added successfully",
      });

      setDescription("");
      setAmount("");
      setCategory("");
      
      if (activeTab === "report") {
        await loadCashflowReport();
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await backend.pos.deleteExpense({ id: id.toString() });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
      await loadCashflowReport();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const netCashflow = totalSales - totalExpenses;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Cashflow Management
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex gap-2 border-b pb-4">
          <Button
            variant={activeTab === "add" ? "default" : "outline"}
            onClick={() => setActiveTab("add")}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
          <Button
            variant={activeTab === "report" ? "default" : "outline"}
            onClick={() => setActiveTab("report")}
            className="flex-1"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            View Report
          </Button>
        </div>

        {activeTab === "add" && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                Add expenses that will be deducted from your total sales in the day closing report.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Description *</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Office Supplies, Utilities, etc."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Amount ($) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Category (Optional)</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Operations, Marketing, etc."
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleAddExpense}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </div>
        )}

        {activeTab === "report" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">Total Sales</span>
                </div>
                <div className="text-2xl font-bold text-green-800">
                  ${totalSales.toFixed(2)}
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <TrendingDown className="w-5 h-5" />
                  <span className="text-sm font-medium">Total Expenses</span>
                </div>
                <div className="text-2xl font-bold text-red-800">
                  ${totalExpenses.toFixed(2)}
                </div>
              </div>

              <div className={`${netCashflow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
                <div className={`flex items-center gap-2 ${netCashflow >= 0 ? 'text-blue-700' : 'text-orange-700'} mb-2`}>
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium">Net Cashflow</span>
                </div>
                <div className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                  ${netCashflow.toFixed(2)}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Today's Expenses</h3>
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No expenses recorded for today
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(expense.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {expense.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {expense.category || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                            -${expense.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
