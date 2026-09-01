document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("loginMsg");
  msg.className = "form-msg";
  msg.textContent = "Logging in...";

  fetch(API.login(username, password))
    .then((res) => {
      if (!res.ok) throw new Error("Login failed");
      return res.json();
    })
    .then((user) => {
      if (!user) {
        msg.className = "form-msg error";
        msg.textContent = "Invalid username or password.";
        return;
      }
      setUser(user);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      window.location.href = redirect ? redirect : "index.html";
    })
    .catch(() => {
      msg.className = "form-msg error";
      msg.textContent = "Invalid username or password.";
    });
});
