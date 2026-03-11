// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      const uid = result.user.uid;

      // Firestore se user data lo
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        toast.error("User data not found!");
        await signOut(auth);
        return;
      }

      const data = userDoc.data();
      console.log("Role:", data.role);
      console.log("addedByAdmin:", data.addedByAdmin);

      // Admin ke liye — seedha dashboard
      if (data.role === "admin") {
        toast.success("Welcome Admin! 👋");
        navigate("/admin/dashboard");
        return;
      }

      // Admin se add kiya employee — verification skip karo
      if (data.addedByAdmin === true) {
        if (data.role === "employee") {
          toast.success("Welcome! 👋");
          navigate("/employee/dashboard");
        } else if (data.role === "pending") {
          toast.error("Account pending! Contact admin for access.");
          await signOut(auth);
        }
        return;
      }

      // Signup wala user — email verification check karo
      if (!result.user.emailVerified) {
        toast.error("Please verify your email first! Check your inbox 📧");
        await signOut(auth);
        return;
      }

      // Role check karo
      if (data.role === "employee") {
        toast.success("Welcome! 👋");
        navigate("/employee/dashboard");
      } else if (data.role === "pending") {
        toast.error("Account pending! Contact admin for access.");
        await signOut(auth);
      } else {
        toast.error("Role not assigned. Contact admin!");
        await signOut(auth);
      }

    } catch (error) {
      console.log("Error:", error.code);
      if (error.code === "auth/invalid-credential") {
        toast.error("Wrong email or password!");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Try later!");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoBox}>
          <span style={styles.logoIcon}>🏢</span>
          <h1 style={styles.logoText}>CompanyMS</h1>
          <p style={styles.logoSub}>Management System</p>
        </div>

        <div style={styles.form}>
          <h2 style={styles.title}>Welcome Back!</h2>
          <p style={styles.subtitle}>Sign in to your account</p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p style={styles.signupText}>
            Don't have an account?{" "}
            <Link to="/signup" style={styles.signupLink}>
              Create Account
            </Link>
          </p>
        </div>

        <p style={styles.footer}>Company Management System © 2024</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
  },
  logoBox: { textAlign: "center", marginBottom: "30px" },
  logoIcon: { fontSize: "48px" },
  logoText: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#4f46e5",
    margin: "8px 0 4px",
  },
  logoSub: { color: "#64748b", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  title: { fontSize: "22px", fontWeight: "bold", color: "#1e293b" },
  subtitle: { color: "#64748b", fontSize: "14px", marginTop: "-15px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "14px", fontWeight: "600", color: "#374151" },
  input: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    fontSize: "15px",
    outline: "none",
  },
  button: {
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "10px",
  },
  signupText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
    margin: 0,
  },
  signupLink: {
    color: "#4f46e5",
    fontWeight: "600",
    textDecoration: "none",
  },
  footer: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "24px",
  },
};

export default Login;