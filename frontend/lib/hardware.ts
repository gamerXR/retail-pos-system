import { toast } from "@/components/ui/use-toast";

export interface ConnectedPrinter {
  id: string;
  name: string;
  connectionType: "usb" | "ip" | "bluetooth";
  address: string;
  status: "ready" | "busy" | "error";
}

/**
 * Sends a raw ESC/POS command to open a USB-connected cash drawer
 * without showing a print dialog.
 * This requires a USB printer to be selected and granted permission in the Printer settings.
 */
export const openCashDrawer = async () => {
  const savedPrinter = localStorage.getItem('selectedPrinter');
  if (!savedPrinter) {
    throw new Error("No printer selected. Please select a printer in Hardware Settings > Printers.");
  }

  const printerInfo: ConnectedPrinter = JSON.parse(savedPrinter);

  if (printerInfo.connectionType === 'bluetooth') {
    return openCashDrawerBluetooth(printerInfo);
  } else if (printerInfo.connectionType === 'ip') {
    return openCashDrawerIP(printerInfo);
  } else if (printerInfo.connectionType !== 'usb') {
    throw new Error("Unsupported printer type.");
  }

  if (!('usb' in navigator)) {
    throw new Error("WebUSB is not supported in this browser. Please use Chrome, Edge, or Opera.");
  }

  try {
    const devices = await (navigator as any).usb.getDevices();
    
    const [vendorIdHex, productIdHex] = printerInfo.address.split(':').slice(1);
    const vendorId = parseInt(vendorIdHex, 16);
    const productId = parseInt(productIdHex, 16);

    const device = devices.find((d: any) => d.vendorId === vendorId && d.productId === productId);

    if (!device) {
      throw new Error("Printer not found or permission not granted. Please go to Hardware Settings > Printers and connect to your USB printer.");
    }

    // Check if device is already open
    if (!device.opened) {
      await device.open();
    }

    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    // Find the correct interface and endpoint
    const printerInterface = device.configuration?.interfaces.find((iface: any) => 
      iface.alternate.interfaceClass === 7 // 7 is the printer class
    );
    
    if (!printerInterface) {
      throw new Error("Printer interface not found. This device may not be a compatible printer.");
    }
    
    // Check if interface is already claimed
    if (!printerInterface.claimed) {
      await device.claimInterface(printerInterface.interfaceNumber);
    }

    const outEndpoint = printerInterface.alternate.endpoints.find((ep: any) => ep.direction === 'out');
    if (!outEndpoint) {
      throw new Error("Printer OUT endpoint not found. Cannot send commands to this printer.");
    }

    // ESC/POS command to kick the drawer (pulse pin 2)
    // ESC p m t1 t2 - where m=0 (pin 2), t1=25 (on time), t2=250 (off time)
    const command = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]); // ESC p 0 25 250

    await device.transferOut(outEndpoint.endpointNumber, command);

    // Release the interface so other applications can use it
    if (printerInterface.claimed) {
      await device.releaseInterface(printerInterface.interfaceNumber);
    }

    // Close the device if we opened it
    if (device.opened) {
      await device.close();
    }

  } catch (error: any) {
    console.error("Error opening cash drawer via WebUSB:", error);
    throw new Error(`Failed to open cash drawer: ${error.message}`);
  }
};

const openCashDrawerBluetooth = async (printerInfo: ConnectedPrinter) => {
  try {
    if (!('bluetooth' in navigator)) {
      throw new Error("Web Bluetooth is not supported in this browser.");
    }

    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

    const command = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
    await characteristic.writeValue(command);

    await device.gatt.disconnect();

    toast({
      title: "Cash Drawer Opened",
      description: "Command sent via Bluetooth"
    });
  } catch (error: any) {
    console.error("Error opening cash drawer via Bluetooth:", error);
    throw new Error(`Failed to open cash drawer via Bluetooth: ${error.message}`);
  }
};

const openCashDrawerIP = async (printerInfo: ConnectedPrinter) => {
  try {
    const [ip, port] = printerInfo.address.split(':');
    
    const command = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
    const base64Command = btoa(String.fromCharCode(...command));
    
    const response = await fetch(`http://${ip}:${port}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: command,
      mode: 'no-cors'
    });

    toast({
      title: "Cash Drawer Command Sent",
      description: "Command sent to network printer"
    });
  } catch (error: any) {
    console.error("Error opening cash drawer via IP:", error);
    throw new Error(`Failed to open cash drawer via IP: ${error.message}`);
  }
};

export const printReceiptViaPrinter = async (content: string, printerInfo: ConnectedPrinter) => {
  if (printerInfo.connectionType === 'usb') {
    return printViaUSB(content, printerInfo);
  } else if (printerInfo.connectionType === 'bluetooth') {
    return printViaBluetooth(content, printerInfo);
  } else if (printerInfo.connectionType === 'ip') {
    return printViaIP(content, printerInfo);
  }
};

const printViaUSB = async (content: string, printerInfo: ConnectedPrinter) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }
};

const printViaBluetooth = async (content: string, printerInfo: ConnectedPrinter) => {
  try {
    if (!('bluetooth' in navigator)) {
      throw new Error("Web Bluetooth is not supported in this browser.");
    }

    const escposData = htmlToESCPOS(content);
    
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

    await characteristic.writeValue(escposData);
    await device.gatt.disconnect();

    toast({
      title: "Print Sent",
      description: "Receipt sent to Bluetooth printer"
    });
  } catch (error: any) {
    console.error("Error printing via Bluetooth:", error);
    throw new Error(`Failed to print via Bluetooth: ${error.message}`);
  }
};

const printViaIP = async (content: string, printerInfo: ConnectedPrinter) => {
  try {
    const [ip, port] = printerInfo.address.split(':');
    const escposData = htmlToESCPOS(content);

    const response = await fetch(`http://${ip}:${port}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: escposData,
      mode: 'no-cors'
    });

    toast({
      title: "Print Sent",
      description: "Receipt sent to network printer"
    });
  } catch (error: any) {
    console.error("Error printing via IP:", error);
    throw new Error(`Failed to print via IP: ${error.message}`);
  }
};

const htmlToESCPOS = (html: string): Uint8Array => {
  const commands: number[] = [];
  
  commands.push(0x1B, 0x40);
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || '';
  
  const lines = text.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed) {
      for (let i = 0; i < trimmed.length; i++) {
        commands.push(trimmed.charCodeAt(i));
      }
      commands.push(0x0A);
    }
  });
  
  commands.push(0x1D, 0x56, 0x42, 0x00);
  
  return new Uint8Array(commands);
};
