import prompts from "prompts";
import si from "systeminformation";

async function main() {
  const devices = await getAllUSBPartitions();
  if (devices.length === 0) {
    console.log("No USB devices found");
    return "";
  }
  const response = await prompts({
    type: "multiselect",
    name: "devices",
    message: "Choose storage devices",
    choices: devices.map((device) => ({
      title: `${device.name} (${device.fstype})`,
      value: device.id,
    })),
  });
  console.log(response.devices);
}

async function getAllUSBPartitions() {
  const blockDevices = await si.blockDevices();

  const devices = blockDevices
    //.filter((device) => device.protocol === "usb")
    .filter((device) => device.type === 'part' &&
	    device.device &&
	    blockDevices.find(parent =>
    		parent.device === device.device && parent.protocol === 'usb'
  	    )
    )
    .map((device) => ({
      name: device.name,
      id: device.uuid,
      fstype: device.fsType,
    }));
  return devices;
}

main();
