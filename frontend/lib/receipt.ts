export interface ReceiptSettings {
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

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
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

export function getReceiptSettings(): ReceiptSettings {
  const savedSettings = localStorage.getItem('receiptSettings');
  if (savedSettings) {
    try {
      return JSON.parse(savedSettings);
    } catch (error) {
      console.error("Error loading receipt settings:", error);
      return DEFAULT_RECEIPT_SETTINGS;
    }
  }
  return DEFAULT_RECEIPT_SETTINGS;
}

interface ReceiptData {
  receiptNumber: string;
  date: string;
  time: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalQuantity: number;
  totalAmount: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  memberName?: string;
  memberPhone?: string;
  balance?: number;
  salesperson?: string;
}

export function generateReceiptHTML(data: ReceiptData, settings: ReceiptSettings): string {
  let content = `
    <div style="font-family: monospace; font-size: ${settings.fontSize === 'Small' ? '12px' : settings.fontSize === 'Medium' ? '14px' : '16px'}; line-height: 1.2; width: ${settings.size === '58mm' ? '56mm' : '76mm'}; margin: 0 auto; word-break: break-word;">
  `;

  if (settings.topLogoFile) {
    content += `
      <div style="text-align: center; margin-bottom: 10px;">
        <img src="${settings.topLogoFile}" alt="Logo" style="max-width: 80%; max-height: 60px; margin: 0 auto; display: block;" />
      </div>
    `;
  }

  if (settings.companyName) {
    content += `
      <div style="text-align: center; margin-bottom: 10px; font-size: ${settings.headerSize === 'Small' ? '14px' : settings.headerSize === 'Medium' ? '18px' : '22px'}; font-weight: bold;">
        ${settings.companyName}
      </div>
    `;
  }

  if (settings.address || settings.telephone) {
    content += `
      <div style="text-align: center; margin-bottom: 10px; font-size: 10px;">
        ${settings.address ? settings.address.replace(/\n/g, '<br>') : ''}
        ${settings.address && settings.telephone ? '<br>' : ''}
        ${settings.telephone ? 'Tel ' + settings.telephone : ''}
      </div>
    `;
  }

  content += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

  content += `
    <div style="text-align: center; margin-bottom: 10px;">
      Receipt #${data.receiptNumber}<br>
      ${data.date} ${data.time}
    </div>
  `;

  if (data.salesperson) {
    content += `
      <div style="text-align: center; margin-bottom: 10px; font-size: 10px;">
        Served by: ${data.salesperson}
      </div>
    `;
  }

  content += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

  if (settings.displayUnitPrice) {
    content += `
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
        <span>Item</span>
        <span>Qty</span>
        <span>Price</span>
        <span>Total</span>
      </div>
    `;
  } else {
    content += `
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
        <span>Item</span>
        <span>Qty</span>
        <span>Total</span>
      </div>
    `;
  }

  content += `<div style="border-top: 1px dashed #000; margin: 5px 0;"></div>`;

  data.items.forEach(item => {
    if (settings.displayUnitPrice) {
      content += `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; font-size: 11px;">
          <span style="flex: 1; word-break: break-word;">${item.name}</span>
          <span style="width: 30px; text-align: center; flex-shrink: 0; margin-left: 5px;">${item.quantity}</span>
          <span style="width: 45px; text-align: right; flex-shrink: 0; margin-left: 5px;">$${item.price.toFixed(2)}</span>
          <span style="width: 45px; text-align: right; flex-shrink: 0; margin-left: 5px;">$${item.total.toFixed(2)}</span>
        </div>
      `;
    } else {
      content += `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; font-size: 11px;">
          <span style="flex: 1; word-break: break-word;">${item.name}</span>
          <span style="width: 30px; text-align: center; flex-shrink: 0; margin-left: 5px;">${item.quantity}</span>
          <span style="width: 60px; text-align: right; flex-shrink: 0; margin-left: 5px;">$${item.total.toFixed(2)}</span>
        </div>
      `;
    }
  });

  content += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

  content += `
    <div style="margin-bottom: 5px;">
      <div style="display: flex; justify-content: space-between;">
        <span>Total QTY</span>
        <span>${data.totalQuantity}</span>
      </div>
    </div>
    <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
      <span>Total Amount</span>
      <span>$${data.totalAmount.toFixed(2)}</span>
    </div>
  `;

  content += `
    <div style="margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between;">
        <span>Payment Method</span>
        <span>${data.paymentMethod}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Paid</span>
        <span>$${data.amountPaid.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Change</span>
        <span>$${data.change.toFixed(2)}</span>
      </div>
    </div>
  `;

  if (data.memberName || data.memberPhone) {
    content += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;
    content += `<div style="margin-bottom: 10px;">`;
    if (data.memberName) {
      content += `
        <div style="display: flex; justify-content: space-between;">
          <span>Member</span>
          <span>${data.memberName}</span>
        </div>
      `;
    }
    if (data.memberPhone) {
      content += `
        <div style="display: flex; justify-content: space-between;">
          <span>Phone</span>
          <span>${data.memberPhone}</span>
        </div>
      `;
    }
    if (data.balance !== undefined) {
      content += `
        <div style="display: flex; justify-content: space-between;">
          <span>Balance</span>
          <span>$${data.balance.toFixed(2)}</span>
        </div>
      `;
    }
    content += `</div>`;
  }

  content += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

  if (settings.footer) {
    content += `
      <div style="text-align: center; margin-top: 10px; font-size: 10px;">
        ${settings.footer}
      </div>
    `;
  }

  content += `</div>`;
  
  return content;
}

export function printReceipt(data: ReceiptData): void {
  const settings = getReceiptSettings();
  const receiptHTML = generateReceiptHTML(data, settings);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${data.receiptNumber}</title>
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
          ${receiptHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      for (let i = 0; i < settings.printCopies; i++) {
        printWindow.print();
      }
      printWindow.close();
    }, 500);
  }
}
