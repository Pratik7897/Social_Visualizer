#include <iostream>
#include <string>
#include <vector>
#include "include/AVLTree.hpp"
#include "include/BTree.hpp"
#include "include/SocialGraph.hpp"

int main() {
    std::cout << "===========================================\n";
    std::cout << "   SOCIAL CONNECT - C++ DATA STRUCTURES\n";
    std::cout << "===========================================\n\n";

    // 1. AVL Tree Demo
    std::cout << "[1] AVL TREE DEMO (User Search)\n";
    AVLTree userTree;
    userTree.insert("Alice", "user_1");
    userTree.insert("Bob", "user_2");
    userTree.insert("Charlie", "user_3");
    userTree.insert("David", "user_4");
    userTree.insert("Eve", "user_5");

    std::cout << "Inorder Traversal: ";
    for (const auto& name : userTree.inorder()) std::cout << name << " ";
    std::cout << "\n";

    std::string userId;
    if (userTree.search("Charlie", userId)) {
        std::cout << "Search 'Charlie': Found ID " << userId << "\n";
    }

    auto prefixResults = userTree.prefixSearch("Da");
    std::cout << "Prefix search 'Da': ";
    for (const auto& p : prefixResults) std::cout << p.first << " ";
    std::cout << "\n\n";

    // 2. B-Tree Demo
    std::cout << "[2] B-TREE DEMO (Post Indexing)\n";
    BTree postIndex;
    postIndex.insert(1000, "post_1", "First Post");
    postIndex.insert(2000, "post_2", "Second Post");
    postIndex.insert(1500, "post_3", "Intermediate Post");
    postIndex.insert(500, "post_4", "Early Post");
    postIndex.insert(3000, "post_5", "Latest Post");

    std::cout << "Post count: " << postIndex.getSize() << "\n";
    auto range = postIndex.rangeSearch(1000, 2000);
    std::cout << "Posts in range [1000, 2000]:\n";
    for (const auto& key : range) {
        std::cout << "  - [" << key.timestamp << "] " << key.postId << ": " << key.title << "\n";
    }
    std::cout << "\n";

    // 3. Social Graph Demo
    std::cout << "[3] SOCIAL GRAPH DEMO (Network Analysis)\n";
    SocialGraph graph;
    graph.addFriendship("Alice", "Bob");
    graph.addFriendship("Bob", "Charlie");
    graph.addFriendship("Charlie", "David");
    graph.addFriendship("Alice", "David");
    graph.addFriendship("Alice", "Eve");

    std::cout << "Nodes: " << graph.getNodeCount() << ", Edges: " << graph.getEdgeCount() << "\n";
    
    auto aliceFriends = graph.getFriends("Alice");
    std::cout << "Alice's Friends: ";
    for (const auto& f : aliceFriends) std::cout << f << " ";
    std::cout << "\n";

    auto mutual = graph.getMutualFriends("Alice", "Charlie");
    std::cout << "Mutual friends (Alice, Charlie): ";
    for (const auto& f : mutual) std::cout << f << " ";
    std::cout << "\n";

    auto suggestions = graph.getFriendSuggestions("Eve");
    std::cout << "Friend suggestions for Eve: ";
    for (const auto& s : suggestions) std::cout << s.userId << " (mutual: " << s.mutualCount << ") ";
    std::cout << "\n";

    auto path = graph.shortestPath("Eve", "Charlie");
    std::cout << "Shortest path (Eve -> Charlie): ";
    for (size_t i = 0; i < path.size(); ++i) {
        std::cout << path[i] << (i == path.size() - 1 ? "" : " -> ");
    }
    std::cout << "\n\n";

    std::cout << "===========================================\n";
    std::cout << "   DEMO COMPLETED SUCCESSFULLY!\n";
    std::cout << "===========================================\n";

    return 0;
}
