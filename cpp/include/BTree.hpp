#ifndef B_TREE_HPP
#define B_TREE_HPP

#include <vector>
#include <string>
#include <iostream>
#include <algorithm>
#include <memory>

const int T = 3; // Minimum degree

struct BTreeKey {
    long long timestamp;
    std::string postId;
    std::string title;
};

struct SplitEvent {
    std::string type;
    long long timestamp;
};

class BTreeNode {
public:
    std::vector<BTreeKey> keys;
    std::vector<std::shared_ptr<BTreeNode>> children;
    bool isLeaf;
    int n;

    BTreeNode(bool leaf = true);
};

class BTree {
private:
    std::shared_ptr<BTreeNode> root;
    std::vector<SplitEvent> splitLog;
    int size;

    void _splitChild(std::shared_ptr<BTreeNode> parent, int i);
    void _insertNonFull(std::shared_ptr<BTreeNode> node, long long timestamp, std::string postId, std::string title);
    void _rangeSearch(std::shared_ptr<BTreeNode> node, long long startTime, long long endTime, std::vector<BTreeKey>& results);
    void _inorder(std::shared_ptr<BTreeNode> node, std::vector<BTreeKey>& results);
    void _printStructure(std::shared_ptr<BTreeNode> node, int level);

public:
    BTree();
    void insert(long long timestamp, std::string postId, std::string title = "");
    std::vector<BTreeKey> rangeSearch(long long startTime, long long endTime);
    bool search(long long timestamp, BTreeKey& result);
    std::vector<BTreeKey> getAllSorted();
    
    void printTree();
    void clearSplitLog();
    const std::vector<SplitEvent>& getSplitLog() const;
    int getSize() const { return size; }
};

#endif
