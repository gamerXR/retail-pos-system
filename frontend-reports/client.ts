const API_BASE_URL = import.meta.env.VITE_API_URL || "https://retail-pos-system-d299vgk82vjrnuv4rmbg.api.lp.dev";

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("client_token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
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
