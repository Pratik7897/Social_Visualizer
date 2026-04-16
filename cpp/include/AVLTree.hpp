#ifndef AVL_TREE_HPP
#define AVL_TREE_HPP

#include <string>
#include <vector>
#include <algorithm>
#include <iostream>
#include <memory>

struct RotationEvent {
    std::string type;
    std::string node;
    std::string pivot;
};

class AVLNode {
public:
    std::string key;
    std::string value;
    std::string displayName;
    int height;
    std::shared_ptr<AVLNode> left;
    std::shared_ptr<AVLNode> right;

    AVLNode(std::string k, std::string v) 
        : value(v), displayName(k), height(1), left(nullptr), right(nullptr) {
        key = k;
        std::transform(key.begin(), key.end(), key.begin(), ::tolower);
    }
};

class AVLTree {
private:
    std::shared_ptr<AVLNode> root;
    std::vector<RotationEvent> rotationLog;

    int getHeight(std::shared_ptr<AVLNode> node);
    int getBalanceFactor(std::shared_ptr<AVLNode> node);
    void updateHeight(std::shared_ptr<AVLNode> node);
    
    std::shared_ptr<AVLNode> rotateRight(std::shared_ptr<AVLNode> y);
    std::shared_ptr<AVLNode> rotateLeft(std::shared_ptr<AVLNode> x);
    
    std::shared_ptr<AVLNode> _insert(std::shared_ptr<AVLNode> node, std::string key, std::string value);
    std::shared_ptr<AVLNode> _delete(std::shared_ptr<AVLNode> node, std::string key);
    std::shared_ptr<AVLNode> _getMinNode(std::shared_ptr<AVLNode> node);
    
    void _inorder(std::shared_ptr<AVLNode> node, std::vector<std::string>& result);
    void _prefixSearch(std::shared_ptr<AVLNode> node, std::string prefix, std::vector<std::pair<std::string, std::string>>& results);

public:
    AVLTree();
    void insert(std::string key, std::string value);
    void remove(std::string key);
    bool search(std::string key, std::string& value);
    std::vector<std::pair<std::string, std::string>> prefixSearch(std::string prefix);
    std::vector<std::string> inorder();
    
    void clearRotationLog();
    const std::vector<RotationEvent>& getRotationLog() const;
    
    // For visualization-like structure print
    void printTree(std::shared_ptr<AVLNode> node, int indent = 0);
    std::shared_ptr<AVLNode> getRoot() { return root; }
};

#endif
