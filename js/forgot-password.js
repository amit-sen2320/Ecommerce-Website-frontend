let fpEmail = "";

function goToStep(n) {
  document.querySelectorAll(".step").forEach((s) => s.classList.remove("active"));
  document.getElementById("step" + n).classList.add("active");
}

document.getElementById("sendOtpBtn").addEventListener("click", () => {
  const email = document.getElementById("fpEmail").value.trim();
  const msg = document.getElementById("step1Msg");
  if (!email) {
    msg.className = "form-msg error";
    msg.textContent = "Enter your email first.";
    return;
  }
  msg.className = "form-msg";
  msg.textContent = "Sending OTP...";

  fetch(API.forgotPassword(email))
    .then((res) => {
      if (!res.ok) throw new Error("failed");
      fpEmail = email;
      goToStep(2);
    })
    .catch(() => {
      msg.className = "form-msg error";
      msg.textContent = "We couldn't find an account with that email.";
    });
});

document.getElementById("verifyOtpBtn").addEventListener("click", () => {
  const otp = document.getElementById("fpOtp").value.trim();
  const msg = document.getElementById("step2Msg");
  if (!otp) {
    msg.className = "form-msg error";
    msg.textContent = "Enter the OTP sent to your email.";
    return;
  }
  msg.className = "form-msg";
  msg.textContent = "Verifying...";

  fetch(API.verifyOtp(fpEmail, otp))
    .then((res) => res.json())
    .then((isValid) => {
      if (isValid) {
        goToStep(3);
      } else {
        msg.className = "form-msg error";
        msg.textContent = "Incorrect OTP. Please try again.";
      }
    })
    .catch(() => {
      msg.className = "form-msg error";
      msg.textContent = "Could not verify OTP. Please try again.";
    });
});

document.getElementById("resetPasswordBtn").addEventListener("click", () => {
  const password = document.getElementById("fpPassword").value;
  const confirm = document.getElementById("fpPasswordConfirm").value;
  const msg = document.getElementById("step3Msg");

  if (!password || password !== confirm) {
    msg.className = "form-msg error";
    msg.textContent = "Passwords do not match.";
    return;
  }
  msg.className = "form-msg";
  msg.textContent = "Updating password...";

  fetch(API.resetPassword(fpEmail, password), { method: "PATCH" })
    .then((res) => {
      if (!res.ok) throw new Error("failed");
      msg.className = "form-msg success";
      msg.textContent = "Password updated! Redirecting to login...";
      setTimeout(() => (window.location.href = "login.html"), 1200);
    })
    .catch(() => {
      msg.className = "form-msg error";
      msg.textContent = "Could not reset password. Please try again.";
    });
});
