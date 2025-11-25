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
  const is58mm = settings.size === '58mm';
  const baseFontSize = settings.fontSize === 'Small' ? (is58mm ? 9 : 11) : settings.fontSize === 'Medium' ? (is58mm ? 11 : 13) : (is58mm ? 13 : 15);
  
  let content = `
    <div style="font-family: monospace; font-size: ${baseFontSize}px; line-height: 1.3; width: 100%; margin: 0; padding: ${is58mm ? '2mm' : '3mm'}; box-sizing: border-box;">
  `;

  if (settings.topLogoFile) {
    const logoMaxHeight = is58mm ? '35px' : '50px';
    content += `
      <div style="text-align: center; margin-bottom: ${is58mm ? '3px' : '5px'};">
        <img src="${settings.topLogoFile}" alt="Logo" style="max-width: ${is58mm ? '60%' : '70%'}; max-height: ${logoMaxHeight}; margin: 0 auto; display: block;" />
      </div>
    `;
  }

  if (settings.companyName) {
    const headerFontSize = settings.headerSize === 'Small' ? (is58mm ? 12 : 14) : settings.headerSize === 'Medium' ? (is58mm ? 14 : 18) : (is58mm ? 16 : 20);
    content += `
      <div style="text-align: center; margin-bottom: ${is58mm ? '3px' : '5px'}; margin-top: ${settings.topLogoFile ? (is58mm ? '2px' : '3px') : '0'}; font-size: ${headerFontSize}px; font-weight: bold; line-height: 1.2;">
        ${settings.companyName}
      </div>
    `;
  }

  if (settings.address || settings.telephone) {
    const addressFontSize = is58mm ? 8 : 9;
    content += `
      <div style="text-align: center; margin-bottom: ${is58mm ? '4px' : '6px'}; font-size: ${addressFontSize}px; line-height: 1.3;">
        ${settings.address ? settings.address.replace(/\n/g, '<br>') : ''}
        ${settings.address && settings.telephone ? '<br>' : ''}
        ${settings.telephone ? 'Tel ' + settings.telephone : ''}
      </div>
    `;
  }

  content += `<div style="border-top: 1px dashed #000; margin: ${is58mm ? '4px' : '6px'} 0;"></div>`;

  const infoPadding = is58mm ? '3px' : '5px';
  content += `
    <div style="text-align: center; margin-bottom: ${infoPadding}; font-size: ${baseFontSize}px;">
      Receipt #${data.receiptNumber}<br>
      ${data.date} ${data.time}
    </div>
  `;

  if (data.salesperson) {
    const salespersonFontSize = is58mm ? 8 : 9;
    content += `
      <div style="text-align: center; margin-bottom: ${infoPadding}; font-size: ${salespersonFontSize}px;">
        Served by: ${data.salesperson}
      </div>
    `;
  }

  content += `<div style="border-top: 1px dashed #000; margin: ${is58mm ? '4px' : '6px'} 0;"></div>`;

  const headerFontSize = is58mm ? 8 : 9;
  const qtyWidth = is58mm ? '18px' : '25px';
  const priceWidth = is58mm ? '32px' : '42px';
  const totalWidth = is58mm ? '35px' : '45px';
  
  if (settings.displayUnitPrice) {
    content += `
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: ${is58mm ? '2px' : '3px'}; font-size: ${headerFontSize}px;">
        <span style="flex: 1;">Item</span>
        <span style="width: ${qtyWidth}; text-align: center; margin-left: 2px;">Qty</span>
        <span style="width: ${priceWidth}; text-align: right; margin-left: 2px;">Price</span>
        <span style="width: ${totalWidth}; text-align: right; margin-left: 2px;">Total</span>
      </div>
    `;
  } else {
    content += `
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: ${is58mm ? '2px' : '3px'}; font-size: ${headerFontSize}px;">
        <span style="flex: 1;">Item</span>
        <span style="width: ${qtyWidth}; text-align: center; margin-left: 2px;">Qty</span>
        <span style="width: ${is58mm ? '45px' : '55px'}; text-align: right; margin-left: 2px;">Total</span>
      </div>
    `;
  }

  content += `<div style="border-top: 1px dashed #000; margin: ${is58mm ? '2px' : '3px'} 0;"></div>`;

  const itemFontSize = is58mm ? 8 : 10;
  const itemMargin = is58mm ? '1px' : '2px';
  
  data.items.forEach(item => {
    if (settings.displayUnitPrice) {
      content += `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${itemMargin}; font-size: ${itemFontSize}px; line-height: 1.2;">
          <span style="flex: 1; word-break: break-word; padding-right: 2px;">${item.name}</span>
          <span style="width: ${qtyWidth}; text-align: center; flex-shrink: 0; margin-left: 2px;">${item.quantity}</span>
          <span style="width: ${priceWidth}; text-align: right; flex-shrink: 0; margin-left: 2px;">$${item.price.toFixed(2)}</span>
          <span style="width: ${totalWidth}; text-align: right; flex-shrink: 0; margin-left: 2px;">$${item.total.toFixed(2)}</span>
        </div>
      `;
    } else {
      content += `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${itemMargin}; font-size: ${itemFontSize}px; line-height: 1.2;">
          <span style="flex: 1; word-break: break-word; padding-right: 2px;">${item.name}</span>
          <span style="width: ${qtyWidth}; text-align: center; flex-shrink: 0; margin-left: 2px;">${item.quantity}</span>
          <span style="width: ${is58mm ? '45px' : '55px'}; text-align: right; flex-shrink: 0; margin-left: 2px;">$${item.total.toFixed(2)}</span>
        </div>
      `;
    }
  });

  content += `<div style="border-top: 1px dashed #000; margin: ${is58mm ? '4px' : '6px'} 0;"></div>`;

  content += `
    <div style="margin-bottom: ${is58mm ? '3px' : '4px'}; font-size: ${baseFontSize}px;">
      <div style="display: flex; justify-content: space-between;">
        <span>Total QTY</span>
        <span>${data.totalQuantity}</span>
      </div>
    </div>
    <div style="border-top: 1px dashed #000; margin: ${is58mm ? '4px' : '6px'} 0;"></div>
    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: ${is58mm ? 11 : 13}px; margin-bottom: ${is58mm ? '5px' : '7px'};">
      <span>Total Amount</span>
      <span>$${data.totalAmount.toFixed(2)}</span>
    </div>
  `;

  content += `
    <div style="margin-bottom: ${is58mm ? '5px' : '7px'}; font-size: ${baseFontSize}px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: ${is58mm ? '1px' : '2px'};">
        <span>Payment Method</span>
        <span>${data.paymentMethod}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: ${is58mm ? '1px' : '2px'};">
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
    content += `<div style="border-top: 1px dashed #000; margin: ${is58mm ? '4px' : '6px'} 0;"></div>`;
    content += `<div style="margin-bottom: ${is58mm ? '4px' : '6px'}; font-size: ${baseFontSize}px;">`;
    if (data.memberName) {
      content += `
        <div style="display: flex; justify-content: space-between; margin-bottom: ${is58mm ? '1px' : '2px'};">
          <span>Member</span>
          <span>${data.memberName}</span>
        </div>
      `;
    }
    if (data.memberPhone) {
      content += `
        <div style="display: flex; justify-content: space-between; margin-bottom: ${is58mm ? '1px' : '2px'};">
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

  content += `<div style="border-top: 1px dashed #000; margin: ${is58mm ? '4px' : '6px'} 0;"></div>`;

  if (settings.footer) {
    const footerFontSize = is58mm ? 8 : 9;
    content += `
      <div style="text-align: center; margin-top: ${is58mm ? '4px' : '6px'}; font-size: ${footerFontSize}px; line-height: 1.3;">
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
                margin: 0;
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
