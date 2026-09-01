document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("name").value.trim(),
    userName: document.getElementById("userName").value.trim(),
    phoneNumber: document.getElementById("phoneNumber").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
  };

  const msg = document.getElementById("registerMsg");
  msg.className = "form-msg";
  msg.textContent = "Creating your account...";

  fetch(API.register, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Register failed");
      return res.json();
    })
    .then(() => {
      msg.className = "form-msg success";
      msg.textContent = "Account created! Redirecting to login...";
      setTimeout(() => (window.location.href = "login.html"), 1200);
    })
    .catch(() => {
      msg.className = "form-msg error";
      msg.textContent = "Could not create account. That username or email may already be taken.";
    });
});
