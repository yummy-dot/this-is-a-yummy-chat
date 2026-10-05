// ========================================
// CHATSITE - SUPABASE CONNECTION
// ========================================

const SUPABASE_URL = 'https://jhtxit zdsdlvrgwyrbkc.supabase.co'.replace(
  ' ',
  ''
);
const SUPABASE_KEY = 'sb_publishable_xzXsRnSVXNZcF2p0TWO1kQ_iaZBD2rZ';

// ========================================
// LOAD SUPABASE
// ========================================

const supabaseScript = document.createElement('script');

supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

supabaseScript.onload = startChatSite;

document.head.appendChild(supabaseScript);

// ========================================
// START APP
// ========================================

async function startChatSite() {
  const { createClient } = window.supabase;

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ======================================
  // GET HTML ELEMENTS
  // ======================================

  const authScreen = document.getElementById('authScreen');
  const chatApp = document.getElementById('chatApp');

  const authForm = document.getElementById('authForm');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const usernameInput = document.getElementById('usernameInput');

  const authMessage = document.getElementById('authMessage');
  const authTitle = document.querySelector('.auth-box h1');
  const authSubtitle = document.getElementById('authSubtitle');
  const authSubmit = document.getElementById('authSubmit');
  const toggleAuth = document.getElementById('toggleAuth');

  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');
  const messages = document.getElementById('messages');

  const logoutButton = document.getElementById('logoutButton');
  const clearButton = document.getElementById('clearButton');

  const mobileMenu = document.getElementById('mobileMenu');
  const sidebar = document.querySelector('.sidebar');

  // ======================================
  // AUTH MODE
  // ======================================

  let isLoginMode = false;

  toggleAuth.addEventListener('click', () => {
    isLoginMode = !isLoginMode;

    authMessage.textContent = '';

    if (isLoginMode) {
      authTitle.textContent = 'Welcome Back';
      authSubtitle.textContent = 'Log in to continue chatting';

      authSubmit.textContent = 'Log In';

      toggleAuth.textContent = "Don't have an account? Sign up";

      usernameInput.parentElement.style.display = 'none';
      usernameInput.required = false;
    } else {
      authTitle.textContent = 'ChatSite';
      authSubtitle.textContent = 'Create an account to start chatting';

      authSubmit.textContent = 'Sign Up';

      toggleAuth.textContent = 'Already have an account? Log in';

      usernameInput.parentElement.style.display = 'block';
      usernameInput.required = true;
    }
  });

  // ======================================
  // CHECK CURRENT USER
  // ======================================

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session) {
    await showChat(session.user);
  } else {
    showLogin();
  }

  // ======================================
  // AUTH STATE CHANGES
  // ======================================

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      await showChat(session.user);
    } else {
      showLogin();
    }
  });

  // ======================================
  // SIGN UP / LOGIN
  // ======================================

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    authMessage.textContent = '';

    authSubmit.disabled = true;

    authSubmit.textContent = isLoginMode
      ? 'Logging in...'
      : 'Creating account...';

    try {
      if (isLoginMode) {
        // ================================
        // LOGIN
        // ================================

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
      } else {
        // ================================
        // SIGN UP
        // ================================

        const username = usernameInput.value.trim();

        const email = emailInput.value.trim();

        const password = passwordInput.value;

        if (!username) {
          throw new Error('Please choose a username.');
        }

        if (username.length < 3) {
          throw new Error('Username must be at least 3 characters.');
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,

          options: {
            data: {
              username: username,
            },
          },
        });

        if (error) {
          throw error;
        }

        // Email confirmation is OFF,
        // so there should normally be a session.

        if (data.session) {
          await showChat(data.user);
        } else {
          authMessage.textContent = 'Account created! You can now log in.';

          isLoginMode = true;

          authTitle.textContent = 'Welcome Back';

          authSubtitle.textContent = 'Log in to continue chatting';

          authSubmit.textContent = 'Log In';

          toggleAuth.textContent = "Don't have an account? Sign up";

          usernameInput.parentElement.style.display = 'none';

          usernameInput.required = false;
        }
      }
    } catch (error) {
      console.error(error);

      authMessage.textContent = error.message || 'Something went wrong.';
    } finally {
      authSubmit.disabled = false;

      authSubmit.textContent = isLoginMode ? 'Log In' : 'Sign Up';
    }
  });

  // ======================================
  // SHOW LOGIN
  // ======================================

  function showLogin() {
    authScreen.style.display = 'flex';
    chatApp.style.display = 'none';
  }

  // ======================================
  // SHOW CHAT
  // ======================================

  async function showChat(user) {
    authScreen.style.display = 'none';
    chatApp.style.display = 'flex';

    await loadMessages();

    messageInput.focus();
  }

  // ======================================
  // LOAD MESSAGES
  // ======================================

  async function loadMessages() {
    messages.innerHTML = '';

    const { data, error } = await supabaseClient
      .from('messages')
      .select('*')
      .order('created_at', {
        ascending: true,
      });

    if (error) {
      console.error('Error loading messages:', error);

      messages.innerHTML = `
        <div class="empty-message">
          Unable to load messages.
        </div>
      `;

      return;
    }

    if (!data || data.length === 0) {
      messages.innerHTML = `
        <div class="empty-message">
          No messages yet. Be the first to say hello!
        </div>
      `;

      return;
    }

    data.forEach((message) => {
      displayMessage(message);
    });

    scrollToBottom();
  }

  // ======================================
  // DISPLAY MESSAGE
  // ======================================

  function displayMessage(message) {
    const emptyMessage = messages.querySelector('.empty-message');

    if (emptyMessage) {
      emptyMessage.remove();
    }

    const messageElement = document.createElement('div');

    messageElement.className = 'message';

    const header = document.createElement('div');

    header.className = 'message-header';

    const username = document.createElement('span');

    username.className = 'message-username';

    username.textContent = message.username || 'User';

    const time = document.createElement('span');

    time.className = 'message-time';

    time.textContent = formatTime(message.created_at);

    const content = document.createElement('div');

    content.className = 'message-content';

    content.textContent = message.content;

    header.appendChild(username);
    header.appendChild(time);

    messageElement.appendChild(header);
    messageElement.appendChild(content);

    messages.appendChild(messageElement);
  }

  // ======================================
  // SEND MESSAGE
  // ======================================

  messageForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const text = messageInput.value.trim();

    if (!text) {
      return;
    }

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      alert('Please log in again.');

      return;
    }

    let username = 'User';

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      username = profile.username;
    }

    const { error } = await supabaseClient.from('messages').insert({
      user_id: user.id,
      username: username,
      content: text,
    });

    if (error) {
      console.error('Error sending message:', error);

      alert('Could not send the message.');

      return;
    }

    messageInput.value = '';

    messageInput.focus();
  });

  // ======================================
  // REALTIME MESSAGES
  // ======================================

  supabaseClient
    .channel('public-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        displayMessage(payload.new);

        scrollToBottom();
      }
    )
    .subscribe();

  // ======================================
  // LOG OUT
  // ======================================

  logoutButton.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
  });

  // ======================================
  // CLEAR MY MESSAGES
  // ======================================

  clearButton.addEventListener('click', async () => {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return;
    }

    const confirmed = confirm('Delete all of your messages?');

    if (!confirmed) {
      return;
    }

    const { error } = await supabaseClient
      .from('messages')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error(error);

      alert('Could not delete your messages.');

      return;
    }

    await loadMessages();
  });

  // ======================================
  // MOBILE MENU
  // ======================================

  if (mobileMenu) {
    mobileMenu.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // ======================================
  // TIME FORMAT
  // ======================================

  function formatTime(date) {
    if (!date) {
      return '';
    }

    return new Date(date).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  // ======================================
  // SCROLL
  // ======================================

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }
}
