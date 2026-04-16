#include "../include/BTree.hpp"

BTreeNode::BTreeNode(bool leaf) : isLeaf(leaf), n(0) {}

BTree::BTree() : root(std::make_shared<BTreeNode>(true)), size(0) {}

void BTree::insert(long long timestamp, std::string postId, std::string title) {
    std::shared_ptr<BTreeNode> r = root;
    if (r->n == 2 * T - 1) {
        std::shared_ptr<BTreeNode> s = std::make_shared<BTreeNode>(false);
        s->children.push_back(root);
        _splitChild(s, 0);
        root = s;
        splitLog.push_back({"root_split", timestamp});
    }
    _insertNonFull(root, timestamp, postId, title);
    size++;
}

void BTree::_splitChild(std::shared_ptr<BTreeNode> parent, int i) {
    std::shared_ptr<BTreeNode> fullChild = parent->children[i];
    std::shared_ptr<BTreeNode> newChild = std::make_shared<BTreeNode>(fullChild->isLeaf);
    
    newChild->n = T - 1;
    for (int j = 0; j < T - 1; j++) {
        newChild->keys.push_back(fullChild->keys[j + T]);
    }
    
    if (!fullChild->isLeaf) {
        for (int j = 0; j < T; j++) {
            newChild->children.push_back(fullChild->children[j + T]);
        }
    }
    
    BTreeKey promotedKey = fullChild->keys[T - 1];
    
    fullChild->keys.resize(T - 1);
    if (!fullChild->isLeaf) {
        fullChild->children.resize(T);
    }
    fullChild->n = T - 1;
    
    parent->children.insert(parent->children.begin() + i + 1, newChild);
    parent->keys.insert(parent->keys.begin() + i, promotedKey);
    parent->n++;
}

void BTree::_insertNonFull(std::shared_ptr<BTreeNode> node, long long timestamp, std::string postId, std::string title) {
    int i = node->n - 1;
    if (node->isLeaf) {
        BTreeKey newKey = {timestamp, postId, title};
        node->keys.push_back({0, "", ""}); // Temporary space
        while (i >= 0 && timestamp < node->keys[i].timestamp) {
            node->keys[i + 1] = node->keys[i];
            i--;
        }
        node->keys[i + 1] = newKey;
        node->n++;
    } else {
        while (i >= 0 && timestamp < node->keys[i].timestamp) i--;
        i++;
        if (node->children[i]->n == 2 * T - 1) {
            _splitChild(node, i);
            splitLog.push_back({"node_split", timestamp});
            if (timestamp > node->keys[i].timestamp) i++;
        }
        _insertNonFull(node->children[i], timestamp, postId, title);
    }
}

std::vector<BTreeKey> BTree::rangeSearch(long long startTime, long long endTime) {
    std::vector<BTreeKey> results;
    _rangeSearch(root, startTime, endTime, results);
    return results;
}

void BTree::_rangeSearch(std::shared_ptr<BTreeNode> node, long long startTime, long long endTime, std::vector<BTreeKey>& results) {
    int i = 0;
    while (i < node->n && node->keys[i].timestamp < startTime) i++;

    while (i < node->n && node->keys[i].timestamp <= endTime) {
        if (!node->isLeaf) {
            _rangeSearch(node->children[i], startTime, endTime, results);
        }
        results.push_back(node->keys[i]);
        i++;
    }

    if (!node->isLeaf && i < (int)node->children.size()) {
        _rangeSearch(node->children[i], startTime, endTime, results);
    }
}

bool BTree::search(long long timestamp, BTreeKey& result) {
    std::shared_ptr<BTreeNode> curr = root;
    while (curr) {
        int i = 0;
        while (i < curr->n && timestamp > curr->keys[i].timestamp) i++;
        if (i < curr->n && timestamp == curr->keys[i].timestamp) {
            result = curr->keys[i];
            return true;
        }
        if (curr->isLeaf) break;
        curr = curr->children[i];
    }
    return false;
}

std::vector<BTreeKey> BTree::getAllSorted() {
    std::vector<BTreeKey> results;
    _inorder(root, results);
    return results;
}

void BTree::_inorder(std::shared_ptr<BTreeNode> node, std::vector<BTreeKey>& results) {
    for (int i = 0; i < node->n; i++) {
        if (!node->isLeaf) _inorder(node->children[i], results);
        results.push_back(node->keys[i]);
    }
    if (!node->isLeaf) _inorder(node->children[node->n], results);
}

void BTree::printTree() {
    _printStructure(root, 0);
}

void BTree::_printStructure(std::shared_ptr<BTreeNode> node, int level) {
    std::cout << "Level " << level << ": ";
    for (int i = 0; i < node->n; i++) {
        std::cout << node->keys[i].timestamp << " ";
    }
    std::cout << "\n";
    if (!node->isLeaf) {
        for (int i = 0; i <= node->n; i++) {
            _printStructure(node->children[i], level + 1);
        }
    }
}

void BTree::clearSplitLog() {
    splitLog.clear();
}

const std::vector<SplitEvent>& BTree::getSplitLog() const {
    return splitLog;
}
