#include "../include/SocialGraph.hpp"

SocialGraph::SocialGraph() : nodeCount(0), edgeCount(0) {}

void SocialGraph::addUser(std::string userId) {
    if (adjacencyList.find(userId) == adjacencyList.end()) {
        adjacencyList[userId] = std::set<std::string>();
        nodeCount++;
    }
}

void SocialGraph::removeUser(std::string userId) {
    if (adjacencyList.find(userId) == adjacencyList.end()) return;
    
    for (const std::string& neighborId : adjacencyList[userId]) {
        adjacencyList[neighborId].erase(userId);
        edgeCount--;
    }
    
    adjacencyList.erase(userId);
    nodeCount--;
}

void SocialGraph::addFriendship(std::string userId1, std::string userId2) {
    addUser(userId1);
    addUser(userId2);
    
    if (adjacencyList[userId1].find(userId2) == adjacencyList[userId1].end()) {
        adjacencyList[userId1].insert(userId2);
        adjacencyList[userId2].insert(userId1);
        edgeCount++;
    }
}

void SocialGraph::removeFriendship(std::string userId1, std::string userId2) {
    if (adjacencyList.count(userId1)) adjacencyList[userId1].erase(userId2);
    if (adjacencyList.count(userId2)) adjacencyList[userId2].erase(userId1);
    edgeCount = std::max(0, edgeCount - 1);
}

bool SocialGraph::areFriends(std::string userId1, std::string userId2) {
    return adjacencyList.count(userId1) && adjacencyList[userId1].count(userId2);
}

std::vector<std::string> SocialGraph::getFriends(std::string userId) {
    if (!adjacencyList.count(userId)) return {};
    return std::vector<std::string>(adjacencyList[userId].begin(), adjacencyList[userId].end());
}

int SocialGraph::getDegree(std::string userId) {
    return adjacencyList.count(userId) ? adjacencyList[userId].size() : 0;
}

std::vector<std::string> SocialGraph::bfs(std::string startId, int maxDepth) {
    if (!adjacencyList.count(startId)) return {};

    std::set<std::string> visited = {startId};
    std::queue<std::pair<std::string, int>> q;
    q.push({startId, 0});
    std::vector<std::string> result;

    while (!q.empty()) {
        std::pair<std::string, int> curr = q.front();
        q.pop();
        
        std::string id = curr.first;
        int depth = curr.second;

        if (id != startId) result.push_back(id);
        if (depth >= maxDepth) continue;

        for (const std::string& neighbor : adjacencyList[id]) {
            if (visited.find(neighbor) == visited.end()) {
                visited.insert(neighbor);
                q.push({neighbor, depth + 1});
            }
        }
    }
    return result;
}

std::vector<std::string> SocialGraph::dfs(std::string startId, int maxDepth) {
    if (!adjacencyList.count(startId)) return {};

    std::set<std::string> visited;
    std::vector<std::string> result;

    auto dfsRecursive = [&](auto self, std::string id, int depth) -> void {
        if (depth > maxDepth || visited.count(id)) return;
        visited.insert(id);
        if (id != startId) result.push_back(id);

        for (const std::string& neighbor : adjacencyList[id]) {
            if (!visited.count(neighbor)) {
                self(self, neighbor, depth + 1);
            }
        }
    };

    dfsRecursive(dfsRecursive, startId, 0);
    return result;
}

std::vector<std::string> SocialGraph::shortestPath(std::string sourceId, std::string targetId) {
    if (!adjacencyList.count(sourceId) || !adjacencyList.count(targetId)) return {};
    if (sourceId == targetId) return {sourceId};

    std::set<std::string> visited = {sourceId};
    std::queue<std::string> q;
    q.push(sourceId);
    std::map<std::string, std::string> parent;

    while (!q.empty()) {
        std::string current = q.front();
        q.pop();

        for (const std::string& neighbor : adjacencyList[current]) {
            if (!visited.count(neighbor)) {
                visited.insert(neighbor);
                parent[neighbor] = current;
                q.push(neighbor);

                if (neighbor == targetId) {
                    std::vector<std::string> path;
                    std::string curr = targetId;
                    while (curr != "") {
                        path.insert(path.begin(), curr);
                        curr = parent.count(curr) ? parent[curr] : "";
                    }
                    return path;
                }
            }
        }
    }
    return {};
}

std::vector<std::string> SocialGraph::getMutualFriends(std::string userId1, std::string userId2) {
    std::vector<std::string> mutual;
    if (!adjacencyList.count(userId1) || !adjacencyList.count(userId2)) return mutual;
    
    const std::set<std::string>& friends1 = adjacencyList[userId1];
    const std::set<std::string>& friends2 = adjacencyList[userId2];

    for (const std::string& f : friends1) {
        if (friends2.count(f)) {
            mutual.push_back(f);
        }
    }
    return mutual;
}

std::vector<SocialGraph::Suggestion> SocialGraph::getFriendSuggestions(std::string userId, int limit) {
    if (!adjacencyList.count(userId)) return {};

    std::vector<std::string> candidates = bfs(userId, 2);
    const std::set<std::string>& directFriends = adjacencyList[userId];
    
    std::vector<Suggestion> suggestions;
    for (const std::string& candidate : candidates) {
        if (candidate != userId && !directFriends.count(candidate)) {
            int mutualCount = getMutualFriends(userId, candidate).size();
            suggestions.push_back({candidate, mutualCount});
        }
    }

    std::sort(suggestions.begin(), suggestions.end(), [](const Suggestion& a, const Suggestion& b) {
        return b.mutualCount < a.mutualCount;
    });

    if ((int)suggestions.size() > limit) suggestions.resize(limit);
    return suggestions;
}
