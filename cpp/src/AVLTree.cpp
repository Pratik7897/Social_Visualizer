#include "../include/AVLTree.hpp"
#include <iomanip>


AVLTree::AVLTree() : root(nullptr) {}

int AVLTree::getHeight(std::shared_ptr<AVLNode> node) {
    return node ? node->height : 0;
}

int AVLTree::getBalanceFactor(std::shared_ptr<AVLNode> node) {
    return node ? getHeight(node->left) - getHeight(node->right) : 0;
}

void AVLTree::updateHeight(std::shared_ptr<AVLNode> node) {
    if (node) {
        node->height = 1 + std::max(getHeight(node->left), getHeight(node->right));
    }
}

std::shared_ptr<AVLNode> AVLTree::rotateRight(std::shared_ptr<AVLNode> y) {
    std::shared_ptr<AVLNode> x = y->left;
    std::shared_ptr<AVLNode> T2 = x->right;

    x->right = y;
    y->left = T2;

    updateHeight(y);
    updateHeight(x);

    rotationLog.push_back({"RIGHT", y->displayName, x->displayName});
    return x;
}

std::shared_ptr<AVLNode> AVLTree::rotateLeft(std::shared_ptr<AVLNode> x) {
    std::shared_ptr<AVLNode> y = x->right;
    std::shared_ptr<AVLNode> T2 = y->left;

    y->left = x;
    x->right = T2;

    updateHeight(x);
    updateHeight(y);

    rotationLog.push_back({"LEFT", x->displayName, y->displayName});
    return y;
}

void AVLTree::insert(std::string key, std::string value) {
    root = _insert(root, key, value);
}

std::shared_ptr<AVLNode> AVLTree::_insert(std::shared_ptr<AVLNode> node, std::string key, std::string value) {
    std::string lowerKey = key;
    std::transform(lowerKey.begin(), lowerKey.end(), lowerKey.begin(), ::tolower);

    if (!node) return std::make_shared<AVLNode>(key, value);

    if (lowerKey < node->key) {
        node->left = _insert(node->left, key, value);
    } else if (lowerKey > node->key) {
        node->right = _insert(node->right, key, value);
    } else {
        node->value = value;
        return node;
    }

    updateHeight(node);
    int balance = getBalanceFactor(node);

    // Left Left Case
    if (balance > 1 && lowerKey < node->left->key)
        return rotateRight(node);

    // Right Right Case
    if (balance < -1 && lowerKey > node->right->key)
        return rotateLeft(node);

    // Left Right Case
    if (balance > 1 && lowerKey > node->left->key) {
        node->left = rotateLeft(node->left);
        return rotateRight(node);
    }

    // Right Left Case
    if (balance < -1 && lowerKey < node->right->key) {
        node->right = rotateRight(node->right);
        return rotateLeft(node);
    }

    return node;
}

void AVLTree::remove(std::string key) {
    std::string lowerKey = key;
    std::transform(lowerKey.begin(), lowerKey.end(), lowerKey.begin(), ::tolower);
    root = _delete(root, lowerKey);
}

std::shared_ptr<AVLNode> AVLTree::_getMinNode(std::shared_ptr<AVLNode> node) {
    std::shared_ptr<AVLNode> current = node;
    while (current->left) current = current->left;
    return current;
}

std::shared_ptr<AVLNode> AVLTree::_delete(std::shared_ptr<AVLNode> node, std::string key) {
    if (!node) return nullptr;

    if (key < node->key) {
        node->left = _delete(node->left, key);
    } else if (key > node->key) {
        node->right = _delete(node->right, key);
    } else {
        if (!node->left || !node->right) {
            std::shared_ptr<AVLNode> temp = node->left ? node->left : node->right;
            if (!temp) {
                temp = node;
                node = nullptr;
            } else {
                *node = *temp;
            }
        } else {
            std::shared_ptr<AVLNode> temp = _getMinNode(node->right);
            node->key = temp->key;
            node->value = temp->value;
            node->displayName = temp->displayName;
            node->right = _delete(node->right, temp->key);
        }
    }

    if (!node) return nullptr;

    updateHeight(node);
    int balance = getBalanceFactor(node);

    if (balance > 1 && getBalanceFactor(node->left) >= 0)
        return rotateRight(node);

    if (balance > 1 && getBalanceFactor(node->left) < 0) {
        node->left = rotateLeft(node->left);
        return rotateRight(node);
    }

    if (balance < -1 && getBalanceFactor(node->right) <= 0)
        return rotateLeft(node);

    if (balance < -1 && getBalanceFactor(node->right) > 0) {
        node->right = rotateRight(node->right);
        return rotateLeft(node);
    }

    return node;
}

bool AVLTree::search(std::string key, std::string& value) {
    std::string lowerKey = key;
    std::transform(lowerKey.begin(), lowerKey.end(), lowerKey.begin(), ::tolower);
    
    std::shared_ptr<AVLNode> curr = root;
    while (curr) {
        if (lowerKey == curr->key) {
            value = curr->value;
            return true;
        }
        if (lowerKey < curr->key) curr = curr->left;
        else curr = curr->right;
    }
    return false;
}

std::vector<std::pair<std::string, std::string>> AVLTree::prefixSearch(std::string prefix) {
    std::vector<std::pair<std::string, std::string>> results;
    std::string lowerPrefix = prefix;
    std::transform(lowerPrefix.begin(), lowerPrefix.end(), lowerPrefix.begin(), ::tolower);
    _prefixSearch(root, lowerPrefix, results);
    return results;
}

void AVLTree::_prefixSearch(std::shared_ptr<AVLNode> node, std::string prefix, std::vector<std::pair<std::string, std::string>>& results) {
    if (!node) return;
    
    if (node->key.find(prefix) == 0) {
        results.push_back({node->displayName, node->value});
    }
    
    if (prefix <= node->key) _prefixSearch(node->left, prefix, results);
    if (prefix >= node->key.substr(0, prefix.length())) _prefixSearch(node->right, prefix, results);
}

std::vector<std::string> AVLTree::inorder() {
    std::vector<std::string> result;
    _inorder(root, result);
    return result;
}

void AVLTree::_inorder(std::shared_ptr<AVLNode> node, std::vector<std::string>& result) {
    if (!node) return;
    _inorder(node->left, result);
    result.push_back(node->displayName);
    _inorder(node->right, result);
}

void AVLTree::clearRotationLog() {
    rotationLog.clear();
}

const std::vector<RotationEvent>& AVLTree::getRotationLog() const {
    return rotationLog;
}

void AVLTree::printTree(std::shared_ptr<AVLNode> node, int indent) {
    if (node) {
        if (node->right) printTree(node->right, indent + 4);
        if (indent) std::cout << std::setw(indent) << ' ';
        std::cout << node->displayName << " (" << getBalanceFactor(node) << ")\n";
        if (node->left) printTree(node->left, indent + 4);
    }
}
