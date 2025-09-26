import { writeFile } from "fs/promises";
import prompts from "prompts";
import si from "systeminformation";
import { stringify } from "yaml";

async function main() {
  const usbPartitions = await getAllUSBPartitions();
  if (usbPartitions.length === 0) {
    // console.log("No USB partitions to mount");
    return;
  }
  const response = await prompts({
    type: "multiselect",
    name: "partitions",
    message: "Choose storage partitions",
    choices: usbPartitions.map((partition) => ({
      title: `${partition.name} (${partition.fsType}) @ ${partition.parent.device} - ${partition.parent.model}`,
      value: partition,
    })),
  });

  if (!response.partitions || response.partitions.length === 0) {
    return;
  }

  for (const [index, partition] of response.partitions.entries()) {
    const partitionMountPath = await prompts({
      type: "text",
      name: "mountPath",
      message: `Enter mount path for partition: "${partition.device}"`,
      initial: `/media/disk${index + 1}`,
    });
    partition.mountPath = partitionMountPath.mountPath;
  }

  await writeFile("../partitions.yaml", stringify(response));
  console.log("Partitions written to partitions.yaml");
}

async function getAllUSBPartitions() {
  const blockDevices = await si.blockDevices();

  const usbDevices = blockDevices.filter((device) => device.protocol === "usb");

  const usbPartitions = blockDevices
    .filter(
      (device) => device.type === "part" && device.device && !device.mount
    )
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
