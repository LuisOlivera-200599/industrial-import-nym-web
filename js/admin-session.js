async function requireSession() {
  const { data, error } = await window.nymSupabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "admin-login.html";
    return false;
  }

  currentUser = data.session.user;
  localStorage.setItem("nymAdminSession", "active");
  localStorage.setItem("nymAdminUser", currentUser.email || "admin");
  return true;
}
