// src/pages/Login.jsx
import { useState, useEffect } from "react";
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
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      const uid = result.user.uid;
      const userDoc = await getDoc(doc(db, "users", uid));
      if (!userDoc.exists()) { toast.error("User data not found!"); await signOut(auth); return; }
      const data = userDoc.data();
      if (data.role === "admin") { toast.success("Welcome Admin! 👋"); navigate("/admin/dashboard"); return; }
      if (data.addedByAdmin === true) {
        if (data.role === "employee") { toast.success("Welcome! 👋"); navigate("/employee/dashboard"); }
        else { toast.error("Account pending! Contact admin."); await signOut(auth); }
        return;
      }
      if (!result.user.emailVerified) { toast.error("Please verify your email first!"); await signOut(auth); return; }
      if (data.role === "employee") { toast.success("Welcome! 👋"); navigate("/employee/dashboard"); }
      else if (data.role === "pending") { toast.error("Account pending! Contact admin."); await signOut(auth); }
      else { toast.error("Role not assigned. Contact admin!"); await signOut(auth); }
    } catch (error) {
      if (error.code === "auth/invalid-credential") toast.error("Wrong email or password!");
      else if (error.code === "auth/too-many-requests") toast.error("Too many attempts. Try later!");
      else toast.error(error.message);
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        .lp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #0f0f1a;
          position: relative;
          overflow: hidden;
        }

        /* Animated mesh background */
        .lp-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 20%, rgba(99,102,241,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 80%, rgba(6,182,212,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 50% 50%, rgba(139,92,246,0.1) 0%, transparent 70%);
          animation: bgPulse 8s ease-in-out infinite alternate;
        }
        @keyframes bgPulse {
          0%   { opacity: 0.8; transform: scale(1); }
          100% { opacity: 1;   transform: scale(1.04); }
        }

        /* Floating blobs */
        .lp-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          pointer-events: none;
          animation: blobDrift 12s ease-in-out infinite;
        }
        .lp-blob-1 {
          width: 400px; height: 400px;
          background: rgba(99,102,241,0.22);
          top: -120px; left: -80px;
          animation-duration: 14s;
        }
        .lp-blob-2 {
          width: 350px; height: 350px;
          background: rgba(6,182,212,0.18);
          bottom: -100px; right: -60px;
          animation-duration: 10s;
          animation-delay: -4s;
        }
        .lp-blob-3 {
          width: 200px; height: 200px;
          background: rgba(167,139,250,0.2);
          top: 60%; left: 15%;
          animation-duration: 8s;
          animation-delay: -7s;
        }
        @keyframes blobDrift {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(20px,-20px) scale(1.05); }
          66%      { transform: translate(-15px,15px) scale(0.96); }
        }

        /* Subtle dot grid */
        .lp-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        /* Card */
        .lp-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          margin: 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 44px 40px 36px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.05),
            0 32px 80px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.1);
          opacity: 0;
          transform: translateY(32px) scale(0.97);
          transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1),
                      transform 0.7s cubic-bezier(0.22,1,0.36,1);
        }
        .lp-card.mounted {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* Logo */
        .lp-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
          opacity: 0;
          transform: translateY(16px);
          transition: all 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s;
        }
        .lp-logo.mounted { opacity:1; transform:translateY(0); }

        .lp-logo-ring {
          width: 64px; height: 64px;
          border-radius: 18px;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px;
          margin-bottom: 14px;
          box-shadow: 0 8px 32px rgba(99,102,241,0.4);
          position: relative;
        }
        .lp-logo-ring::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 21px;
          background: linear-gradient(135deg, rgba(99,102,241,0.5), rgba(6,182,212,0.5));
          z-index: -1;
          filter: blur(8px);
        }

        .lp-logo-name {
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
        }
        .lp-logo-sub {
          font-size: 12.5px;
          color: rgba(255,255,255,0.4);
          margin-top: 3px;
          font-weight: 400;
        }

        /* Heading */
        .lp-heading {
          text-align: center;
          margin-bottom: 28px;
          opacity: 0;
          transform: translateY(14px);
          transition: all 0.6s cubic-bezier(0.22,1,0.36,1) 0.25s;
        }
        .lp-heading.mounted { opacity:1; transform:translateY(0); }
        .lp-heading h2 {
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
          margin-bottom: 5px;
        }
        .lp-heading p {
          font-size: 13.5px;
          color: rgba(255,255,255,0.4);
          font-weight: 400;
        }

        /* Fields */
        .lp-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
          opacity: 0;
          transform: translateY(14px);
          transition: all 0.6s cubic-bezier(0.22,1,0.36,1) 0.35s;
        }
        .lp-fields.mounted { opacity:1; transform:translateY(0); }

        .lp-field label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }
        .lp-input-wrap { position: relative; }

        .lp-input {
          width: 100%;
          padding: 13px 16px 13px 46px;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          font-size: 14.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #fff;
          outline: none;
          transition: all 0.25s ease;
        }
        .lp-input::placeholder { color: rgba(255,255,255,0.22); }
        .lp-input:focus {
          border-color: rgba(99,102,241,0.7);
          background: rgba(99,102,241,0.08);
          box-shadow: 0 0 0 4px rgba(99,102,241,0.12);
        }
        .lp-input-icon {
          position: absolute;
          left: 15px; top: 50%;
          transform: translateY(-50%);
          font-size: 17px;
          opacity: 0.4;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        .lp-input-wrap:focus-within .lp-input-icon { opacity: 0.85; }

        .lp-eye {
          position: absolute;
          right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; font-size: 17px;
          opacity: 0.35; padding: 4px;
          transition: opacity 0.2s;
        }
        .lp-eye:hover { opacity: 0.8; }

        /* Button */
        .lp-btn-wrap {
          margin-top: 8px;
          opacity: 0;
          transform: translateY(14px);
          transition: all 0.6s cubic-bezier(0.22,1,0.36,1) 0.45s;
        }
        .lp-btn-wrap.mounted { opacity:1; transform:translateY(0); }

        .lp-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #0891b2 100%);
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          letter-spacing: 0.2px;
        }
        .lp-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #818cf8, #6366f1);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .lp-btn:hover::before { opacity: 1; }
        .lp-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(99,102,241,0.45);
        }
        .lp-btn:active { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
        .lp-btn-inner {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .lp-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lpSpin 0.7s linear infinite;
        }
        @keyframes lpSpin { to { transform: rotate(360deg); } }

        /* Bottom */
        .lp-bottom {
          margin-top: 22px;
          text-align: center;
          font-size: 13.5px;
          color: rgba(255,255,255,0.38);
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.6s cubic-bezier(0.22,1,0.36,1) 0.55s;
        }
        .lp-bottom.mounted { opacity:1; transform:translateY(0); }
        .lp-bottom a {
          color: #a5b4fc;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }
        .lp-bottom a:hover { color: #c7d2fe; }

        .lp-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          opacity: 0;
          transition: opacity 0.6s 0.65s;
        }
        .lp-footer.mounted { opacity: 1; }
      `}</style>

      <div className="lp-root">
        <div className="lp-bg" />
        <div className="lp-dots" />
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />

        <div className={`lp-card ${mounted ? "mounted" : ""}`}>

          {/* Logo */}
          <div className={`lp-logo ${mounted ? "mounted" : ""}`}>
            <div className="lp-logo-ring">🏢</div>
            <div className="lp-logo-name">CompanyMS</div>
            <div className="lp-logo-sub">Management System</div>
          </div>

          {/* Heading */}
          <div className={`lp-heading ${mounted ? "mounted" : ""}`}>
            <h2>Welcome Back!</h2>
            <p>Sign in to your account</p>
          </div>

          {/* Fields */}
          <div className={`lp-fields ${mounted ? "mounted" : ""}`}>
            <div className="lp-field">
              <label>Email Address</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon">✉️</span>
                <input
                  className="lp-input"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin(e)}
                />
              </div>
            </div>

            <div className="lp-field">
              <label>Password</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon">🔒</span>
                <input
                  className="lp-input"
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin(e)}
                />
                <button className="lp-eye" onClick={() => setShowPass(!showPass)} type="button">
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          </div>

          {/* Button */}
          <div className={`lp-btn-wrap ${mounted ? "mounted" : ""}`}>
            <button className="lp-btn" onClick={handleLogin} disabled={loading}>
              <span className="lp-btn-inner">
                {loading ? <><div className="lp-spinner" /> Signing in...</> : "Sign In →"}
              </span>
            </button>
          </div>

          {/* Bottom link */}
          <div className={`lp-bottom ${mounted ? "mounted" : ""}`}>
            Don't have an account?{" "}
            <Link to="/signup">Create Account</Link>
          </div>

          <div className={`lp-footer ${mounted ? "mounted" : ""}`}>
            Company Management System © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;