# Frontend Reports - Complete Code Changes

This file contains ALL the code changes needed for the redesigned reports system.
Copy and paste each section into the corresponding file.

---

## File 1: frontend-reports/client.ts

```typescript
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
```

---

## File 2: frontend-reports/index.css

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer utilities {
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-background-clip: text;
    -webkit-text-fill-color: inherit;
    transition: background-color 5000s ease-in-out 0s;
    box-shadow: inset 0 0 20px 20px transparent;
  }

  .animate-in {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .fade-in {
    animation-name: fadeIn;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

@layer components {
  .gradient-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .card-hover {
    @apply transition-all duration-300 hover:shadow-xl hover:-translate-y-1;
  }

  .btn-gradient {
    @apply bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200;
  }

  .section-heading {
    @apply text-2xl font-bold text-gray-900 mb-6;
  }

  .stat-card {
    @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow;
  }
}
```

---

## File 3: frontend-reports/components/ui/card.tsx (NEW FILE)

```typescript
import * as React from "react"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ""}`}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-6 ${className || ""}`}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-2xl font-semibold leading-none tracking-tight ${className || ""}`}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-muted-foreground ${className || ""}`}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className || ""}`} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center p-6 pt-0 ${className || ""}`}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

---

## File 4: frontend-reports/components/ui/badge.tsx (NEW FILE)

```typescript
import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground border border-input",
    success: "bg-green-500 text-white hover:bg-green-600"
  }

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className || ""}`}
      {...props}
    />
  )
}

export { Badge }
```

---

## File 5: frontend-reports/components/LoginPage.tsx

Due to length, this file is very long. I'll continue in the next section...

---

**CONTINUED IN NEXT MESSAGE - Files are too large to fit in one response**

Would you like me to:
1. Create individual files for each component that you can download?
2. Create a ZIP file with all changes?
3. Provide a script that automatically applies all changes?