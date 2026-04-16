#ifndef SOCIAL_GRAPH_HPP
#define SOCIAL_GRAPH_HPP

#include <string>
#include <vector>
#include <map>
#include <set>
#include <queue>
#include <algorithm>
#include <iostream>

struct TraversalEvent {
    std::string node;
    int depth;
    std::string action;
    std::string from;
    std::vector<std::string> stack;
};

class SocialGraph {
private:
    std::map<std::string, std::set<std::string>> adjacencyList;
    int nodeCount;
    int edgeCount;

public:
    SocialGraph();
    
    void addUser(std::string userId);
    void removeUser(std::string userId);
    void addFriendship(std::string userId1, std::string userId2);
    void removeFriendship(std::string userId1, std::string userId2);
    
    bool areFriends(std::string userId1, std::string userId2);
    std::vector<std::string> getFriends(std::string userId);
    int getDegree(std::string userId);
    
    // BFS Traversal
    std::vector<std::string> bfs(std::string startId, int maxDepth = 3);
    
    // DFS Traversal
    std::vector<std::string> dfs(std::string startId, int maxDepth = 4);
    
    // Shortest Path
    std::vector<std::string> shortestPath(std::string sourceId, std::string targetId);
    
    // Mutual Friends
    std::vector<std::string> getMutualFriends(std::string userId1, std::string userId2);
    
    // Friend Suggestions
    struct Suggestion {
        std::string userId;
        int mutualCount;
    };
    std::vector<Suggestion> getFriendSuggestions(std::string userId, int limit = 10);
    
    int getNodeCount() const { return nodeCount; }
    int getEdgeCount() const { return edgeCount; }
};

#endif
