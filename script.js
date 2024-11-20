let disk = [];
let files = [];
let diskSize = 20;
let allocationType = "contigua";

document.getElementById("initialize").addEventListener("click", () => {
  diskSize = parseInt(document.getElementById("disk-size").value);

  if (!diskSize || diskSize <= 0) {
    alert("Informe um tamanho válido!");
  }

  allocationType = document.getElementById("allocation-type").value;

  if (!allocationType) {
    alert("Informe o tipo de alocação!");
  }

  initializeDisk(diskSize);
  renderDisk();
  renderAllocationTable();
  updateAllocationType(allocationType);
});

document.getElementById("create-file").addEventListener("click", () => {
  const fileName = document.getElementById("file-name").value.trim();
  const fileBlocks = parseInt(document.getElementById("file-blocks").value);

  if (!fileName) {
    alert("Por favor, insira um nome para o arquivo.");
    return;
  }

  if (fileBlocks <= 0 || isNaN(fileBlocks)) {
    alert("Insira uma quantidade válida de blocos.");
    return;
  }

  if (files.some((f) => f.name === fileName)) {
    alert("Um arquivo com este nome já existe.");
    return;
  }

  createFile(fileName, fileBlocks);

  document.getElementById("file-name").value = "";
  document.getElementById("file-blocks").value = "";
});

document.getElementById("delete-file").addEventListener("click", () => {
  const fileName = document.getElementById("file-name").value.trim();

  if (!fileName) {
    alert("Por favor, insira o nome do arquivo a ser excluído.");
    return;
  }

  deleteFile(fileName);

  document.getElementById("file-name").value = "";
});

function initializeDisk(size) {
  disk = new Array(size).fill({ free: true });
  files = [];
}

const colors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A1",
  "#A133FF",
  "#FFC300",
  "#FF5733",
  "#DAF7A6",
  "#C70039",
  "#581845",
];

function getFileColor(fileName) {
  const hash = Array.from(fileName).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  );
  return colors[hash % colors.length];
}

function renderDisk() {
  const diskContainer = document.getElementById("disk");
  diskContainer.innerHTML = "";
  disk.forEach((block, index) => {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block");
    blockElement.classList.add(block.free ? "free" : "allocated");
    if (!block.free) {
      const fileColor = getFileColor(block.file);
      blockElement.style.backgroundColor = fileColor;
      blockElement.dataset.file = block.file;
    }
    blockElement.textContent = block.free ? "" : index;
    diskContainer.appendChild(blockElement);
  });
}

function createFile(fileName, fileBlocks) {
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

  if (startBlock === -1) {
    alert("Não há espaço suficiente para alocar o arquivo.");
  } else {
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
  let blocks = [];
  let currentBlock = start;

  for (let i = 0; i < fileBlocks; i++) {
    const randomBlock = findRandomFreeBlock();
    if (randomBlock === -1) {
      alert("Espaço insuficiente no disco. Desfazer operação.");
      blocks.forEach((block) => (disk[block] = { free: true }));
      return;
    }

    disk[randomBlock] = {
      free: false,
      file: fileName,
      next: null,
    };
    blocks.push(randomBlock);

    if (i < fileBlocks - 1) {
      disk[randomBlock].next = findRandomFreeBlock();
    }
  }

  files.push({ name: fileName, blocks });
}

function allocateIndexedBlocks(start, fileBlocks, fileName) {
  let blocks = [];

  for (let i = 0; i < fileBlocks; i++) {
    const block = findRandomFreeBlock();
    if (block !== -1) {
      disk[block] = { free: false, file: fileName };
      blocks.push(block);
    } else {
      alert("Espaço insuficiente para alocação indexada.");
      blocks.forEach((b) => (disk[b] = { free: true }));
      return;
    }
  }

  files.push({ name: fileName, blocks: blocks });
}

function findRandomFreeBlock() {
  const freeBlocks = [];

  for (let i = 0; i < disk.length; i++) {
    if (disk[i].free) {
      freeBlocks.push(i);
    }
  }

  if (freeBlocks.length === 0) {
    return -1;
  }

  const randomIndex = Math.floor(Math.random() * freeBlocks.length);
  return freeBlocks[randomIndex];
}

function renderAllocationTable() {
  const tableBody = document
    .getElementById("allocation-table")
    .querySelector("tbody");
  tableBody.innerHTML = "";

  files.forEach((file) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${file.name}</td><td>${file.blocks.join(", ")}</td>`;
    row.addEventListener("click", () => highlightFile(file.name));
    tableBody.appendChild(row);
  });
}

function deleteFile(fileName) {
  const file = files.find((f) => f.name === fileName);

  if (!file) {
    alert("Arquivo não encontrado.");
    return;
  }

  file.blocks.forEach((block) => {
    disk[block] = { free: true };
  });

  files = files.filter((f) => f.name !== fileName);
  renderDisk();
  renderAllocationTable();
}

function highlightFile(fileName) {
  const file = files.find((f) => f.name === fileName);
  if (!file) return;

  const blocks = document.querySelectorAll(".block");
  blocks.forEach((block) => block.classList.remove("highlight"));

  file.blocks.forEach((blockIndex) => {
    blocks[blockIndex].classList.add("highlight");
  });
}

function updateAllocationType(type) {
  document.getElementById(
    "allocation-type-text"
  ).innerText = `Tipo de Alocação: ${type}`;
}
