const API_URL = 'http://localhost:5000/api';

const authDiv = document.getElementById('auth');
const mainDiv = document.getElementById('main');
const authMsg = document.getElementById('authMsg');
const displayUsername = document.getElementById('displayUsername');

let token = localStorage.getItem('token');
let user = null;

function updateUI() {
  if (token && user) {
    authDiv.style.display = 'none';
    mainDiv.style.display = 'block';
    displayUsername.textContent = user.username;
    fetchPosts();
  } else {
    authDiv.style.display = 'block';
    mainDiv.style.display = 'none';
  }
}

// Register
document.getElementById('registerBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !email || !password) {
    authMsg.textContent = 'Please fill all fields for registration.';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      token = data.token;
      user = data.user;
      localStorage.setItem('token', token);
      updateUI();
    } else {
      authMsg.textContent = data.msg || 'Registration failed';
    }
  } catch {
    authMsg.textContent = 'Error connecting to server';
  }
});

// Login
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    authMsg.textContent = 'Please enter email and password.';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      token = data.token;
      user = data.user;
      localStorage.setItem('token', token);
      updateUI();
    } else {
      authMsg.textContent = data.msg || 'Login failed';
    }
  } catch {
    authMsg.textContent = 'Error connecting to server';
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  token = null;
  user = null;
  localStorage.removeItem('token');
  updateUI();
});

// Create post with image
document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  let content = document.getElementById('postContent').value.trim();
  const image = document.getElementById('postImage').files[0];

  // If both are empty, block submission
  if (!content && !image) return alert('Please write something or upload an image');

  // If only image, set content to empty string (or a single space if backend requires non-empty)
  if (!content) content = ' ';

  const formData = new FormData();
  formData.append('content', content);
  if (image) formData.append('image', image);

  try {
    const res = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 'x-auth-token': token },
      body: formData,
    });

    if (res.ok) {
      document.getElementById('postContent').value = '';
      document.getElementById('postImage').value = '';
      fetchPosts();
    }
  } catch (err) {
    alert('Error creating post');
  }
});


// Fetch and render posts
async function fetchPosts() {
  try {
    const res = await fetch(`${API_URL}/posts`);
    const posts = await res.json();

    const postsDiv = document.getElementById('posts');
    postsDiv.innerHTML = '';

    posts.forEach(post => {
  const postEl = document.createElement('div');

  postEl.innerHTML = `
    <b>${post.user.username}</b> <small>${new Date(post.createdAt).toLocaleString()}</small>
    <p>${post.content}</p>
    ${post.imageUrl ? `<img src="http://localhost:5000/${post.imageUrl}" class="post-image" />` : ''}
    <button onclick="likePost('${post._id}')">Like (${post.likes.length})</button>
    <div>
      <h4>Comments (${post.comments.length})</h4>
      <div id="comments-${post._id}">
        ${post.comments.map(c => `<p><b>${c.user.username}:</b> ${c.content}</p>`).join('')}
      </div>
      <input type="text" id="commentInput-${post._id}" placeholder="Add comment" />
      <button onclick="addComment('${post._id}')">Comment</button>
    </div>
  `;
  postsDiv.appendChild(postEl);
});


    
  } catch (err) {
    console.log(err);
  }
}

// Like a post
window.likePost = async function(postId) {
  try {
    await fetch(`${API_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'x-auth-token': token },
    });
    fetchPosts();
  } catch (err) {
    alert('Error liking post');
  }
};

// Add comment
window.addComment = async function(postId) {
  const input = document.getElementById(`commentInput-${postId}`);
  const content = input.value.trim();
  if (!content) return alert('Comment cannot be empty');

  try {
    await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({ content }),
    });
    input.value = '';
    fetchPosts();
  } catch (err) {
    alert('Error adding comment');
  }
};

// Start app
updateUI();
