#include <iostream>
#include <vector>
#include <map>
#include <string>

using namespace std;

// Representa um bloco lógico
struct Block {
    int id;       // Identificador do bloco
    bool free;    // Estado do bloco
    string file;  // Nome do arquivo que ocupa este bloco (se ocupado)
};

// Representa um arquivo
struct File {
    string name;               // Nome do arquivo
    vector<int> allocatedBlocks; // Blocos alocados ao arquivo
};

// Classe base para os mecanismos de alocação
class Allocator {
protected:
    vector<Block>& disk; // Referência ao disco
public:
    Allocator(vector<Block>& d) : disk(d) {}
    virtual bool allocate(File& file, int size) = 0;
    virtual void deallocate(File& file) = 0;
    virtual void displayTable(const map<string, File>& files) = 0;
};

// Alocação Contígua
class ContiguousAllocator : public Allocator {
public:
    ContiguousAllocator(vector<Block>& d) : Allocator(d) {}

    bool allocate(File& file, int size) override {
        int freeCount = 0, start = -1;
        for (int i = 0; i < disk.size(); i++) {
            if (disk[i].free) {
                if (freeCount == 0) start = i;
                freeCount++;
                if (freeCount == size) {
                    for (int j = start; j < start + size; j++) {
                        disk[j].free = false;
                        disk[j].file = file.name;
                        file.allocatedBlocks.push_back(j);
                    }
                    return true;
                }
            } else {
                freeCount = 0;
            }
        }
        return false; // Espaço contíguo insuficiente
    }

    void deallocate(File& file) override {
        for (int blockID : file.allocatedBlocks) {
            disk[blockID].free = true;
            disk[blockID].file = "";
        }
        file.allocatedBlocks.clear();
    }

    void displayTable(const map<string, File>& files) override {
        cout << "Contiguous Allocation Table:\n";
        for (const auto& pair : files) {
            cout << "File: " << pair.second.name << " -> Blocks: ";
            for (int block : pair.second.allocatedBlocks) {
                cout << block << " ";
            }
            cout << endl;
        }
    }
};

// Alocação Encadeada
class LinkedAllocator : public Allocator {
public:
    LinkedAllocator(vector<Block>& d) : Allocator(d) {}

    bool allocate(File& file, int size) override {
        int allocated = 0;
        for (int i = 0; i < disk.size(); i++) {
            if (disk[i].free) {
                disk[i].free = false;
                disk[i].file = file.name;
                file.allocatedBlocks.push_back(i);
                allocated++;
                if (allocated == size) return true;
            }
        }
        return false; // Espaço insuficiente
    }

    void deallocate(File& file) override {
        for (int blockID : file.allocatedBlocks) {
            disk[blockID].free = true;
            disk[blockID].file = "";
        }
        file.allocatedBlocks.clear();
    }

    void displayTable(const map<string, File>& files) override {
        cout << "Linked Allocation Table:\n";
        for (const auto& pair : files) {
            cout << "File: " << pair.second.name << " -> Blocks: ";
            for (int block : pair.second.allocatedBlocks) {
                cout << block << " -> ";
            }
            cout << "NULL\n";
        }
    }
};

// Simulador
class Simulator {
    vector<Block> disk;
    map<string, File> files;
    Allocator* allocator;

public:
    Simulator(int diskSize, Allocator* alloc) : allocator(alloc) {
        for (int i = 0; i < diskSize; i++) {
            disk.push_back({i, true, ""});
        }
    }

    void createFile(const string& name, int size) {
        if (files.count(name)) {
            cout << "File already exists.\n";
            return;
        }
        File file = {name, {}};
        if (allocator->allocate(file, size)) {
            files[name] = file;
            cout << "File created successfully.\n";
        } else {
            cout << "Not enough space for the file.\n";
        }
    }

    void deleteFile(const string& name) {
        if (!files.count(name)) {
            cout << "File not found.\n";
            return;
        }
        allocator->deallocate(files[name]);
        files.erase(name);
        cout << "File deleted successfully.\n";
    }

    void displayDisk() {
        cout << "Disk Status:\n";
        for (const auto& block : disk) {
            cout << (block.free ? "[ ]" : "[" + block.file + "]") << " ";
        }
        cout << endl;
    }

    void displayTable() {
        allocator->displayTable(files);
    }
};

// Main
int main() {
    int diskSize;
    cout << "Enter disk size (number of blocks): ";
    cin >> diskSize;

    ContiguousAllocator contiguousAllocator(diskSize);
    Simulator simulator(diskSize, &contiguousAllocator);

    int choice;
    do {
        cout << "\n1. Create File\n2. Delete File\n3. Display Disk\n4. Display Table\n5. Exit\nChoice: ";
        cin >> choice;

        string name;
        int size;

        switch (choice) {
            case 1:
                cout << "Enter file name: ";
                cin >> name;
                cout << "Enter file size (blocks): ";
                cin >> size;
                simulator.createFile(name, size);
                break;
            case 2:
                cout << "Enter file name: ";
                cin >> name;
                simulator.deleteFile(name);
                break;
            case 3:
                simulator.displayDisk();
                break;
            case 4:
                simulator.displayTable();
                break;
        }
    } while (choice != 5);

    return 0;
}
