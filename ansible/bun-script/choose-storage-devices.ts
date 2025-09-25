import prompts from "prompts";
import si from "systeminformation";

async function main() {
  const usbPartitions = await getAllUSBPartitions();
  if (usbPartitions.length === 0) {
    console.log("No USB devices found");
    return "";
  }
  const response = await prompts({
    type: "multiselect",
    name: "devices",
    message: "Choose storage devices",
    choices: usbPartitions.map((device) => ({
      title: `${device.device} (${device.fsType}) @ ${device.parent.device} (${device.parent.model})`,
      value: device.uuid,
    })),
  });

  console.log(response.devices);
}

async function getAllUSBPartitions() {
  const blockDevices = await si.blockDevices();

  const usbDevices = blockDevices.filter((device) => device.protocol === "usb");

  const usbPartitions = blockDevices
    .filter((device) => device.type === "part" && device.device)
    .map((device) => {
      const parent = usbDevices.find(
        (parent) => parent.device === device.device
      );
      if (!parent) {
        return null;
      }
      return {
        ...device,
        parent,
      };
    })
    .filter((device) => device !== null);

  return usbPartitions;
}

main();
