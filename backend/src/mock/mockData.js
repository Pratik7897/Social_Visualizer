const users = [
  { _id: '0', username: 'alex_morgan', displayName: 'Alex Morgan', email: 'alex@example.com', password: 'password123', bio: 'Software engineer & coffee enthusiast ☕ | Demo Account', occupation: 'Software Engineer', location: 'San Francisco, CA', friendCount: 10, postCount: 5 },
  { _id: '1', username: 'aarav_mehta', displayName: 'Aarav Mehta', email: 'aarav@example.com', password: 'password123', bio: 'Software engineer & tea lover ☕ | Scaling backend systems at Bengaluru', occupation: 'Backend Architect', location: 'Bengaluru, KA', friendCount: 8, postCount: 3 },
  { _id: '2', username: 'ananya_iyer', displayName: 'Ananya Iyer', email: 'ananya@example.com', password: 'password123', bio: 'Product designer | Crafting minimal UIs in the heart of Mumbai', occupation: 'UX Lead', location: 'Mumbai, MH', friendCount: 7, postCount: 2 },
  { _id: '3', username: 'ishaan_gupta', displayName: 'Ishaan Gupta', email: 'ishaan@example.com', password: 'password123', bio: 'CS Undergraduate at COEP | competitive programmer & tech enthusiast', occupation: 'Student', location: 'Pune, MH', friendCount: 6, postCount: 2 },
  { _id: '4', username: 'kavya_sharma', displayName: 'Kavya Sharma', email: 'kavya@example.com', password: 'password123', bio: 'Data Scientist | Exploring ML trends in Hyderabad 🤖', occupation: 'Data Scientist', location: 'Hyderabad, TS', friendCount: 5, postCount: 1 },
  { _id: '5', username: 'arjun_reddy', displayName: 'Arjun Reddy', email: 'arjun@example.com', password: 'password123', bio: 'Mobile Dev | Flutter enthusiast | Coffee & Code', occupation: 'Mobile Developer', location: 'Hyderabad, TS', friendCount: 5, postCount: 1 },
  { _id: '6', username: 'diya_patel', displayName: 'Diya Patel', email: 'diya@example.com', password: 'password123', bio: 'Content Creator | Tech storyteller 📹', occupation: 'Content Creator', location: 'Ahmedabad, GJ', friendCount: 4, postCount: 0 },
  { _id: '7', username: 'rohan_desai', displayName: 'Rohan Desai', email: 'rohan@example.com', password: 'password123', bio: 'Backend Dev | Go & Rust | Cloud Architect', occupation: 'Cloud Architect', location: 'Bengaluru, KA', friendCount: 4, postCount: 0 },
  { _id: '8', username: 'advait_nair', displayName: 'Advait Nair', email: 'advait@example.com', password: 'password123', bio: 'AI Researcher | Deep Learning | Kerala Tech Scene', occupation: 'AI Researcher', location: 'Kochi, KL', friendCount: 3, postCount: 0 },
  { _id: '9', username: 'tanvi_shah', displayName: 'Tanvi Shah', email: 'tanvi@example.com', password: 'password123', bio: 'Product Manager | Building the next big thing', occupation: 'Product Manager', location: 'Delhi, DL', friendCount: 3, postCount: 0 },
  { _id: '10', username: 'vihaan_verma', displayName: 'Vihaan Verma', email: 'vihaan@example.com', password: 'password123', bio: 'Fullstack Dev | React & Node | Open Source', occupation: 'Fullstack Developer', location: 'Noida, UP', friendCount: 2, postCount: 0 },
  { _id: '11', username: 'myra_kaur', displayName: 'Myra Kaur', email: 'myra@example.com', password: 'password123', bio: 'Frontend Engineer | CSS Magician 🪄', occupation: 'Frontend Engineer', location: 'Chandigarh, CH', friendCount: 2, postCount: 0 },
  { _id: '12', username: 'kabir_khan', displayName: 'Kabir Khan', email: 'kabir@example.com', password: 'password123', bio: 'Security Analyst | Bug Bounty Hunter 🛡️', occupation: 'Security Analyst', location: 'Chennai, TN', friendCount: 2, postCount: 0 },
  { _id: '13', username: 'sana_malhotra', displayName: 'Sana Malhotra', email: 'sana@example.com', password: 'password123', bio: 'Marketing Lead | Growth hacker | Foodie', occupation: 'Marketing Lead', location: 'Gurgaon, HR', friendCount: 1, postCount: 0 },
  { _id: '14', username: 'aryan_singh', displayName: 'Aryan Singh', email: 'aryan@example.com', password: 'password123', bio: 'Game Developer | Unreal Engine | Gamer', occupation: 'Game Developer', location: 'Indore, MP', friendCount: 1, postCount: 0 },
  { _id: '15', username: 'zoya_mirza', displayName: 'Zoya Mirza', email: 'zoya@example.com', password: 'password123', bio: 'AI Artist | Stable Diffusion | Creative Coder', occupation: 'AI Artist', location: 'Kolkata, WB', friendCount: 1, postCount: 0 },
];

const friendships = [
  { _id: 'f0', requester: '0', recipient: '1', status: 'accepted' },
  { _id: 'f1', requester: '1', recipient: '2', status: 'accepted' },
  { _id: 'f2', requester: '1', recipient: '3', status: 'accepted' },
  { _id: 'f3', requester: '2', recipient: '3', status: 'accepted' },
  { _id: 'f4', requester: '1', recipient: '4', status: 'accepted' },
  { _id: 'f5', requester: '1', recipient: '5', status: 'accepted' },
  { _id: 'f6', requester: '1', recipient: '6', status: 'accepted' },
  { _id: 'f7', requester: '1', recipient: '7', status: 'accepted' },
  { _id: 'f8', requester: '2', recipient: '4', status: 'accepted' },
  { _id: 'f9', requester: '2', recipient: '5', status: 'accepted' },
  { _id: 'f10', requester: '3', recipient: '6', status: 'accepted' },
  { _id: 'f11', requester: '4', recipient: '5', status: 'accepted' },
  { _id: 'f12', requester: '7', recipient: '8', status: 'accepted' },
  { _id: 'f13', requester: '8', recipient: '1', status: 'accepted' },
  { _id: 'f14', requester: '9', recipient: '1', status: 'accepted' },
  { _id: 'f15', requester: '10', recipient: '2', status: 'accepted' },
  { _id: 'f16', requester: '11', recipient: '3', status: 'accepted' },
  { _id: 'f17', requester: '12', recipient: '4', status: 'accepted' },
  { _id: 'f18', requester: '13', recipient: '5', status: 'accepted' },
  { _id: 'f19', requester: '14', recipient: '6', status: 'accepted' },
  { _id: 'f20', requester: '15', recipient: '7', status: 'accepted' },
  { _id: 'f21', requester: '9', recipient: '2', status: 'accepted' },
  { _id: 'f22', requester: '10', recipient: '3', status: 'accepted' },
  { _id: 'f23', requester: '11', recipient: '4', status: 'accepted' },
  { _id: 'f24', requester: '12', recipient: '5', status: 'accepted' },
];

const posts = [
  { _id: '101', author: '1', content: 'Just optimized our social graph using Adjacency Lists! 🚀🏙️ #SoftwareEngineering #IndiaTech', createdAt: new Date(Date.now() - 3600000), likeCount: 15 },
  { _id: '102', author: '2', content: 'Design systems bridge the gap between imagination and execution. 🎨✨', createdAt: new Date(Date.now() - 7200000), likeCount: 22 },
  { _id: '103', author: '4', content: 'Great day at the Hyderabad Tech Summit! ☕', createdAt: new Date(Date.now() - 86400000), likeCount: 30 },
  { _id: '104', author: '3', content: 'Competitive programming is a sport. Change my mind. 👨‍💻', createdAt: new Date(Date.now() - 43200000), likeCount: 18 },
  { _id: '105', author: '5', content: 'Flutter 3.x is a game changer for mobile devs! 📱', createdAt: new Date(Date.now() - 172800000), likeCount: 25 },
  { _id: '106', author: '1', content: 'Exploring the beauty of AVL Trees for post indexing. Fast lookups are non-negotiable!', createdAt: new Date(Date.now() - 100000), likeCount: 12 },
];

// In-memory likes storage for mock posts (mapping postId -> Set of userIds)
const mockLikes = new Map([
  ['101', new Set(['2', '3'])],
  ['102', new Set(['1', '4'])],
  ['103', new Set(['1', '2', '5'])],
]);

async function getMockUsers() {
  return users.map(u => ({
    ...u,
    toPublicJSON() { return { _id: this._id, username: this.username, displayName: this.displayName, email: this.email, bio: this.bio, occupation: this.occupation, location: this.location, friendCount: this.friendCount, postCount: this.postCount }; },
    comparePassword(pw) { return pw === 'password123'; }
  }));
}

async function getMockFriendships() { return friendships; }
async function getMockPosts() { 
  return posts.map(p => ({
    ...p,
    likes: Array.from(mockLikes.get(p._id) || [])
  })); 
}

const mockQuery = {
  findUsers: async (filter = {}) => {
    const dataUsers = await getMockUsers();
    return dataUsers.filter(u => {
      for (let key in filter) {
        if (filter[key] && filter[key].$in) {
          if (!filter[key].$in.map(id => id.toString()).includes(u[key].toString())) return false;
        } else if (u[key]?.toString() !== filter[key]?.toString()) return false;
      }
      return true;
    });
  },
  findFriendships: async (filter = {}) => {
    const dataFriendships = await getMockFriendships();
    return dataFriendships.filter(f => {
      if (filter.$or) {
        return filter.$or.some(cond => {
          return Object.keys(cond).every(key => f[key]?.toString() === cond[key]?.toString());
        });
      }
      for (let key in filter) {
        if (f[key]?.toString() !== filter[key]?.toString()) return false;
      }
      return true;
    });
  },
  findPosts: async (filter = {}) => {
    const dataPosts = await getMockPosts();
    const dataUsers = await getMockUsers();
    return dataPosts.filter(p => {
      if (filter.author && filter.author.$in) {
        return filter.author.$in.includes(p.author.toString());
      }
      if (filter.author && p.author.toString() !== filter.author.toString()) return false;
      return true;
    }).map(p => ({
      ...p,
      populate: function() { 
        this.author = dataUsers.find(u => u._id === this.author);
        return this; 
      }
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

const mockMutations = {
  addPost: async (userId, content, tags = []) => {
    const newId = (posts.length + 107).toString();
    const newPost = {
      _id: newId,
      author: userId.toString(),
      content,
      tags,
      createdAt: new Date(),
      likeCount: 0
    };
    posts.unshift(newPost); // Add to beginning for feed
    mockLikes.set(newId, new Set());
    
    // Update user stats
    const user = users.find(u => u._id === userId.toString());
    if (user) user.postCount++;
    
    return newPost;
  },
  likePost: async (postId, userId) => {
    const post = posts.find(p => p._id === postId.toString());
    if (!post) return null;
    
    if (!mockLikes.has(postId.toString())) {
      mockLikes.set(postId.toString(), new Set());
    }
    
    const likesSet = mockLikes.get(postId.toString());
    const isLiked = likesSet.has(userId.toString());
    
    if (isLiked) {
      likesSet.delete(userId.toString());
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      likesSet.add(userId.toString());
      post.likeCount++;
    }
    
    return { liked: !isLiked, likeCount: post.likeCount };
  },
  deletePost: async (postId, userId) => {
    const index = posts.findIndex(p => p._id === postId.toString() && p.author === userId.toString());
    if (index === -1) return false;
    
    posts.splice(index, 1);
    mockLikes.delete(postId.toString());
    
    // Update user stats
    const user = users.find(u => u._id === userId.toString());
    if (user) user.postCount = Math.max(0, user.postCount - 1);
    
    return true;
  }
};

module.exports = {
  getMockUsers,
  getMockFriendships,
  getMockPosts,
  mockQuery,
  mockMutations
};
