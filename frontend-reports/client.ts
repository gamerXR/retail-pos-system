const API_BASE_URL = import.meta.env.VITE_API_URL || "https://staging-retail-pos-system-mmn2.encr.app";

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("client_token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        errorMessage = await response.text() || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error("Network error. Please check your connection.");
  }
}

const backend = {
  auth: {
    clientLogin: async (data: { phoneNumber: string; password: string }) => {
      return apiCall("/auth/client/login", {
        method: "POST",
        body: JSON.stringify(data)
      });
    }
  },
  pos: {
    getClientDashboard: async () => {
      return apiCall("/pos/client/dashboard", { method: "GET" });
    },
    getClientSalesReport: async (data: { startDate: string; endDate: string }) => {
      return apiCall("/pos/client/sales-report", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    getClientCategorySales: async (data: { startDate: string; endDate: string }) => {
      return apiCall("/pos/client/category-sales", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    getClientTopProducts: async (data: { startDate: string; endDate: string }) => {
      return apiCall("/pos/client/top-products", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    getClientCashflow: async (data: { startDate: string; endDate: string }) => {
      return apiCall("/pos/client/cashflow", {
        method: "POST",
        body: JSON.stringify(data)
      });
    }
  }
};

export default backend;
