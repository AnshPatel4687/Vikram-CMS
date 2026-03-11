// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { secondaryAuth, db } from "../firebase/config";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { notifyAdmin } from "../firebase/notifications";
import toast from "react-hot-toast";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required!"); return false;
    }
    if (formData.name.trim().length < 3) {
      toast.error("Name must be at least 3 characters!"); return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      toast.error("Name must contain only letters!"); return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required!"); return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Enter a valid email address!"); return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone is required!"); return false;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error("Enter valid 10-digit Indian phone number!"); return false;
    }
    if (!formData.password) {
      toast.error("Password is required!"); return false;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters!"); return false;
    }
    if (!/(?=.*[0-9])/.test(formData.password)) {
      toast.error("Password must contain at least one number!"); return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!"); return false;
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      // Firebase Auth me account banao
      const result = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password
      );
      const uid = result.user.uid;

      // Verification email bhejo
      await sendEmailVerification(result.user);

      // Firestore me save karo — addedByAdmin: false
      await setDoc(doc(db, "users", uid), {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: "pending",
        department: "",
        salary: 0,
        joinDate: new Date().toISOString().split("T")[0],
        addedByAdmin: false,
        emailVerified: false,
        createdAt: new Date().toISOString(),
      });

      // Admin ko notification bhejo
      await notifyAdmin(
        "New User Signup 👤",
        `${formData.name.trim()} ne account banaya — approval pending!`,
        "signup",
        "/admin/employees"
      );

      // Secondary auth se logout karo
      await secondaryAuth.signOut();

      toast.success("Account created! Please verify your email 📧");
      navigate("/");
    } catch (error) {
      console.log("Signup error:", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email already registered!");
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
          <p style={styles.logoSub}>Create Your Account</p>
        </div>

        <div style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address *</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number *</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                style={styles.input}
                maxLength={10}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password *</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 chars + 1 number"
                style={styles.input}
              />
            </div>
            <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Confirm Password *</label>
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                style={styles.input}
              />
            </div>
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p style={styles.loginText}>
            Already have an account?{" "}
            <Link to="/" style={styles.loginLink}>
              Sign In
            </Link>
          </p>
        </div>

        <p style={styles.footer}>
          After signup, verify your email then wait for admin approval.
        </p>
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
    padding: "20px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
  },
  logoBox: { textAlign: "center", marginBottom: "30px" },
  logoIcon: { fontSize: "40px" },
  logoText: {
    fontSize: "26px",
    fontWeight: "bold",
    color: "#4f46e5",
    margin: "8px 0 4px",
  },
  logoSub: { color: "#64748b", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151" },
  input: {
    padding: "11px 14px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  },
  button: {
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
  },
  loginText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
    margin: 0,
  },
  loginLink: {
    color: "#4f46e5",
    fontWeight: "600",
    textDecoration: "none",
  },
  footer: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "20px",
  },
};

export default Signup;