const { SocialGraph } = require('./backend/src/ds/Graph');

const g = new SocialGraph();
g.addFriendship('A', 'B');
g.addFriendship('A', 'C');
g.addFriendship('B', 'D');
g.addFriendship('C', 'E');

console.log('--- REFACTORED BFS from A ---');
const bfsResult = g.bfs('A');
bfsResult.traversalLog.forEach(log => {
    console.log(`${log.action} ${log.node} at depth ${log.depth}`);
});
