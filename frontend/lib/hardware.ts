import { toast } from "@/components/ui/use-toast";

export interface ConnectedPrinter {
  id: string;
  name: string;
  connectionType: "usb" | "ip" | "bluetooth";
  address: string; // For USB, "USB:vendorId(hex):productId(hex)"
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
    throw new Error("No printer selected. Please select a USB printer in Hardware Settings > Printers and grant permission.");
  }

  const printerInfo: ConnectedPrinter = JSON.parse(savedPrinter);

  if (printerInfo.connectionType !== 'usb') {
    throw new Error("Silent cash drawer opening is only supported for USB printers.");
  }

  if (!('usb' in navigator)) {
    throw new Error("WebUSB is not supported in this browser. Please use Chrome, Edge, or Opera.");
  }

  try {
    const devices = await navigator.usb.getDevices();
    
    const [vendorIdHex, productIdHex] = printerInfo.address.split(':').slice(1);
    const vendorId = parseInt(vendorIdHex, 16);
    const productId = parseInt(productIdHex, 16);

    const device = devices.find(d => d.vendorId === vendorId && d.productId === productId);

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
    const printerInterface = device.configuration?.interfaces.find(iface => 
      iface.alternate.interfaceClass === 7 // 7 is the printer class
    );
    
    if (!printerInterface) {
      throw new Error("Printer interface not found. This device may not be a compatible printer.");
    }
    
    // Check if interface is already claimed
    if (!printerInterface.claimed) {
      await device.claimInterface(printerInterface.interfaceNumber);
    }

    const outEndpoint = printerInterface.alternate.endpoints.find(ep => ep.direction === 'out');
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
