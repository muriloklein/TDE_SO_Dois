let disk = [];
let files = [];
let diskSize = 20;
let allocationType = "contigua";

document.getElementById("initialize").addEventListener("click", () => {
  diskSize = parseInt(document.getElementById("disk-size").value);
  allocationType = document.getElementById("allocation-type").value;
  initializeDisk(diskSize);
  renderDisk();
  renderAllocationTable();
});

document.getElementById("create-file").addEventListener("click", () => {
  const fileName = document.getElementById("file-name").value;
  const fileBlocks = parseInt(document.getElementById("file-blocks").value);
  createFile(fileName, fileBlocks);
});

document.getElementById("delete-file").addEventListener("click", () => {
  const fileName = document.getElementById("file-name").value;
  deleteFile(fileName);
});

function initializeDisk(size) {
  disk = new Array(size).fill({ free: true });
  files = [];
}

function renderDisk() {
  const diskContainer = document.getElementById("disk");
  diskContainer.innerHTML = "";
  disk.forEach((block, index) => {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block");
    blockElement.classList.add(block.free ? "free" : "allocated");
    blockElement.textContent = block.free ? "" : "X";
    diskContainer.appendChild(blockElement);
  });
}

function createFile(fileName, fileBlocks) {
  if (fileBlocks <= 0) return;
  let startBlock = -1;

  if (allocationType === "contigua") {
    startBlock = findContiguousBlocks(fileBlocks);
    if (startBlock !== -1) {
      allocateContiguousBlocks(startBlock, fileBlocks, fileName);
    }
  } else if (allocationType === "encadeada") {
    startBlock = findFreeBlock();
    if (startBlock !== -1) {
      allocateChainedBlocks(startBlock, fileBlocks, fileName);
    }
  } else if (allocationType === "indexada") {
    startBlock = findFreeBlock();
    if (startBlock !== -1) {
      allocateIndexedBlocks(startBlock, fileBlocks, fileName);
    }
  }

  if (startBlock !== -1) {
    renderDisk();
    renderAllocationTable();
  }
}

function findContiguousBlocks(fileBlocks) {
  for (let i = 0; i < disk.length - fileBlocks + 1; i++) {
    let found = true;
    for (let j = 0; j < fileBlocks; j++) {
      if (!disk[i + j].free) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

function allocateContiguousBlocks(start, fileBlocks, fileName) {
  for (let i = 0; i < fileBlocks; i++) {
    disk[start + i] = { free: false, file: fileName };
  }
  files.push({
    name: fileName,
    blocks: Array.from({ length: fileBlocks }, (_, i) => start + i),
  });
}

function findFreeBlock() {
  for (let i = 0; i < disk.length; i++) {
    if (disk[i].free) return i;
  }
  return -1;
}

function allocateChainedBlocks(start, fileBlocks, fileName) {
  let currentBlock = start;
  for (let i = 0; i < fileBlocks; i++) {
    disk[currentBlock] = {
      free: false,
      file: fileName,
      next: i < fileBlocks - 1 ? currentBlock + 1 : null,
    };
    currentBlock = currentBlock + 1;
  }
  files.push({ name: fileName, blocks: [start] });
}

function allocateIndexedBlocks(start, fileBlocks, fileName) {
  let blocks = [];
  for (let i = 0; i < fileBlocks; i++) {
    let block = findFreeBlock();
    if (block !== -1) {
      disk[block] = { free: false, file: fileName };
      blocks.push(block);
    }
  }
  files.push({ name: fileName, blocks: blocks });
}

function renderAllocationTable() {
  const tableBody = document
    .getElementById("allocation-table")
    .querySelector("tbody");
  tableBody.innerHTML = "";
  files.forEach((file) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${file.name}</td><td>${file.blocks.join(", ")}</td>`;
    tableBody.appendChild(row);
  });
}

function deleteFile(fileName) {
  const file = files.find((f) => f.name === fileName);
  if (file) {
    file.blocks.forEach((block) => {
      disk[block] = { free: true };
    });
    files = files.filter((f) => f.name !== fileName);
    renderDisk();
    renderAllocationTable();
  }
}
