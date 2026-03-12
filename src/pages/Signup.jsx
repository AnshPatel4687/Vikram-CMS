// src/pages/Signup.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { secondaryAuth, db } from "../firebase/config";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { notifyAdmin } from "../firebase/notifications";
import toast from "react-hot-toast";

const Signup = () => {
  const [formData, setFormData] = useState({ name:"", email:"", password:"", confirmPassword:"", phone:"" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateForm = () => {
    if (!formData.name.trim()) { toast.error("Name is required!"); return false; }
    if (formData.name.trim().length < 3) { toast.error("Name must be at least 3 characters!"); return false; }
    if (!/^[a-zA-Z\s]+$/.test(formData.name)) { toast.error("Name must contain only letters!"); return false; }
    if (!formData.email.trim()) { toast.error("Email is required!"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error("Enter a valid email!"); return false; }
    if (!formData.phone.trim()) { toast.error("Phone is required!"); return false; }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) { toast.error("Enter valid 10-digit Indian phone!"); return false; }
    if (!formData.password) { toast.error("Password is required!"); return false; }
    if (formData.password.length < 6) { toast.error("Min 6 characters!"); return false; }
    if (!/(?=.*[0-9])/.test(formData.password)) { toast.error("Password must contain a number!"); return false; }
    if (formData.password !== formData.confirmPassword) { toast.error("Passwords do not match!"); return false; }
    return true;
  };

  const handleSignup = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      const uid = result.user.uid;
      await sendEmailVerification(result.user);
      await setDoc(doc(db, "users", uid), {
        name: formData.name.trim(), email: formData.email.trim(), phone: formData.phone.trim(),
        role: "pending", department: "", salary: 0,
        joinDate: new Date().toISOString().split("T")[0],
        addedByAdmin: false, emailVerified: false, createdAt: new Date().toISOString(),
      });
      await notifyAdmin("New User Signup 👤", `${formData.name.trim()} ne account banaya — approval pending!`, "signup", "/admin/employees");
      await secondaryAuth.signOut();
      toast.success("Account created! Please verify your email 📧");
      navigate("/");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") toast.error("Email already registered!");
      else toast.error(error.message);
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        .sp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #0f0f1a;
          position: relative;
          overflow: hidden;
          padding: 24px 16px;
        }

        .sp-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 15% 25%, rgba(99,102,241,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 70% at 85% 75%, rgba(6,182,212,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 45% 45% at 50% 50%, rgba(139,92,246,0.1) 0%, transparent 70%);
          animation: spBg 9s ease-in-out infinite alternate;
        }
        @keyframes spBg {
          0%   { opacity: 0.8; transform: scale(1); }
          100% { opacity: 1;   transform: scale(1.05); }
        }

        .sp-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(75px);
          pointer-events: none;
        }
        .sp-b1 { width:380px;height:380px;background:rgba(99,102,241,0.2);top:-100px;left:-80px;animation:spd 13s ease-in-out infinite; }
        .sp-b2 { width:320px;height:320px;background:rgba(6,182,212,0.17);bottom:-90px;right:-60px;animation:spd 10s ease-in-out infinite reverse; }
        .sp-b3 { width:220px;height:220px;background:rgba(167,139,250,0.18);top:55%;right:20%;animation:spd 8s ease-in-out infinite 3s; }
        @keyframes spd {
          0%,100% { transform:translate(0,0) scale(1); }
          40%     { transform:translate(18px,-18px) scale(1.04); }
          70%     { transform:translate(-12px,12px) scale(0.97); }
        }

        .sp-dots {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.065) 1px, transparent 1px);
          background-size: 30px 30px;
        }

        /* Card */
        .sp-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 500px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 40px 38px 32px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.05),
            0 32px 80px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.1);
          opacity: 0;
          transform: translateY(30px) scale(0.97);
          transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1),
                      transform 0.7s cubic-bezier(0.22,1,0.36,1);
        }
        .sp-card.mounted { opacity:1; transform:translateY(0) scale(1); }

        /* Logo */
        .sp-logo {
          display: flex; flex-direction: column; align-items: center;
          margin-bottom: 26px;
          opacity: 0; transform: translateY(14px);
          transition: all 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s;
        }
        .sp-logo.mounted { opacity:1; transform:translateY(0); }
        .sp-logo-ring {
          width: 58px; height: 58px; border-radius: 16px;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; margin-bottom: 12px;
          box-shadow: 0 8px 28px rgba(99,102,241,0.4);
          position: relative;
        }
        .sp-logo-ring::after {
          content:''; position:absolute; inset:-3px; border-radius:19px;
          background:linear-gradient(135deg,rgba(99,102,241,0.5),rgba(6,182,212,0.5));
          z-index:-1; filter:blur(8px);
        }
        .sp-logo-name { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.4px; }
        .sp-logo-sub  { font-size: 12px; color: rgba(255,255,255,0.38); margin-top: 3px; }

        /* Heading */
        .sp-heading {
          text-align: center; margin-bottom: 26px;
          opacity: 0; transform: translateY(14px);
          transition: all 0.6s cubic-bezier(0.22,1,0.36,1) 0.25s;
        }
        .sp-heading.mounted { opacity:1; transform:translateY(0); }
        .sp-heading h2 { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.4px; margin-bottom: 4px; }
        .sp-heading p  { font-size: 13px; color: rgba(255,255,255,0.38); }

        /* Form grid */
        .sp-form {
          opacity: 0; transform: translateY(14px);
          transition: all 0.6s cubic-bezier(0.22,1,0.36,1) 0.35s;
        }
        .sp-form.mounted { opacity:1; transform:translateY(0); }

        .sp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .sp-full { grid-column: 1 / -1; }

        .sp-field label {
          display: block;
          font-size: 12px; font-weight: 600;
          color: rgba(255,255,255,0.55);
          margin-bottom: 7px; letter-spacing: 0.3px;
        }
        .sp-iw { position: relative; }
        .sp-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 11px;
          font-size: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #fff; outline: none;
          transition: all 0.22s ease;
        }
        .sp-input::placeholder { color: rgba(255,255,255,0.2); }
        .sp-input:focus {
          border-color: rgba(99,102,241,0.7);
          background: rgba(99,102,241,0.08);
          box-shadow: 0 0 0 4px rgba(99,102,241,0.11);
        }
        .sp-ico {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%);
          font-size: 15px; opacity: 0.38; pointer-events: none;
          transition: opacity 0.2s;
        }
        .sp-iw:focus-within .sp-ico { opacity: 0.85; }
        .sp-eye {
          position: absolute; right: 11px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          font-size: 15px; opacity: 0.35; padding: 3px;
          transition: opacity 0.2s;
        }
        .sp-eye:hover { opacity: 0.8; }

        /* Button */
        .sp-btn-wrap {
          margin-top: 6px;
          opacity: 0; transform: translateY(12px);
          transition: all 0.6s cubic-bezier(0.22,1,0.36,1) 0.45s;
        }
        .sp-btn-wrap.mounted { opacity:1; transform:translateY(0); }

        .sp-btn {
          width: 100%; padding: 14px;
          border: none; border-radius: 12px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 55%, #0891b2 100%);
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px; font-weight: 700;
          cursor: pointer; position: relative; overflow: hidden;
          transition: all 0.3s ease; letter-spacing: 0.2px;
        }
        .sp-btn::before {
          content:''; position:absolute; inset:0;
          background: linear-gradient(135deg, #818cf8, #6366f1);
          opacity:0; transition: opacity 0.3s;
        }
        .sp-btn:hover::before { opacity:1; }
        .sp-btn:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(99,102,241,0.42); }
        .sp-btn:active { transform:translateY(0); }
        .sp-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; box-shadow:none; }
        .sp-btn-inner {
          position: relative; z-index:1;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .sp-spin {
          width:15px; height:15px;
          border:2px solid rgba(255,255,255,0.3);
          border-top-color:#fff; border-radius:50%;
          animation:spspin 0.7s linear infinite;
        }
        @keyframes spspin { to { transform:rotate(360deg); } }

        /* Bottom */
        .sp-bottom {
          margin-top: 20px; text-align: center;
          font-size: 13px; color: rgba(255,255,255,0.36);
          opacity:0; transform:translateY(10px);
          transition: all 0.6s cubic-bezier(0.22,1,0.36,1) 0.55s;
        }
        .sp-bottom.mounted { opacity:1; transform:translateY(0); }
        .sp-bottom a { color:#a5b4fc; font-weight:600; text-decoration:none; transition:color 0.2s; }
        .sp-bottom a:hover { color:#c7d2fe; }

        .sp-footer {
          margin-top: 24px; text-align: center;
          font-size: 11px; color: rgba(255,255,255,0.18);
          opacity:0; transition: opacity 0.6s 0.65s;
        }
        .sp-footer.mounted { opacity:1; }

        @media(max-width:520px) {
          .sp-card { padding:32px 22px 28px; }
          .sp-grid { grid-template-columns:1fr; }
          .sp-full { grid-column:1; }
        }
      `}</style>

      <div className="sp-root">
        <div className="sp-bg" />
        <div className="sp-dots" />
        <div className="sp-blob sp-b1" />
        <div className="sp-blob sp-b2" />
        <div className="sp-blob sp-b3" />

        <div className={`sp-card ${mounted ? "mounted" : ""}`}>

          {/* Logo */}
          <div className={`sp-logo ${mounted ? "mounted" : ""}`}>
            <div className="sp-logo-ring">🏢</div>
            <div className="sp-logo-name">CompanyMS</div>
            <div className="sp-logo-sub">Management System</div>
          </div>

          {/* Heading */}
          <div className={`sp-heading ${mounted ? "mounted" : ""}`}>
            <h2>Create Account</h2>
            <p>Fill in your details to get started</p>
          </div>

          {/* Form */}
          <div className={`sp-form ${mounted ? "mounted" : ""}`}>
            <div className="sp-grid">
              <div className="sp-field">
                <label>Full Name *</label>
                <div className="sp-iw">
                  <span className="sp-ico">👤</span>
                  <input className="sp-input" name="name" value={formData.name} onChange={handleChange} placeholder="Enter full name" />
                </div>
              </div>

              <div className="sp-field">
                <label>Email Address *</label>
                <div className="sp-iw">
                  <span className="sp-ico">✉️</span>
                  <input className="sp-input" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" />
                </div>
              </div>

              <div className="sp-field">
                <label>Phone Number *</label>
                <div className="sp-iw">
                  <span className="sp-ico">📱</span>
                  <input className="sp-input" name="phone" value={formData.phone} onChange={handleChange} placeholder="10-digit mobile number" maxLength={10} />
                </div>
              </div>

              <div className="sp-field">
                <label>Password *</label>
                <div className="sp-iw">
                  <span className="sp-ico">🔒</span>
                  <input className="sp-input" name="password" type={showPass ? "text" : "password"} value={formData.password} onChange={handleChange} placeholder="Min 6 chars + 1 number" />
                  <button className="sp-eye" onClick={() => setShowPass(!showPass)} type="button">{showPass ? "🙈" : "👁️"}</button>
                </div>
              </div>

              <div className="sp-field sp-full">
                <label>Confirm Password *</label>
                <div className="sp-iw">
                  <span className="sp-ico">🔐</span>
                  <input className="sp-input" name="confirmPassword" type={showConfirm ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter your password" />
                  <button className="sp-eye" onClick={() => setShowConfirm(!showConfirm)} type="button">{showConfirm ? "🙈" : "👁️"}</button>
                </div>
              </div>
            </div>
          </div>

          {/* Button */}
          <div className={`sp-btn-wrap ${mounted ? "mounted" : ""}`}>
            <button className="sp-btn" onClick={handleSignup} disabled={loading}>
              <span className="sp-btn-inner">
                {loading ? <><div className="sp-spin" /> Creating Account...</> : "Create Account →"}
              </span>
            </button>
          </div>

          <div className={`sp-bottom ${mounted ? "mounted" : ""}`}>
            Already have an account? <Link to="/">Sign In</Link>
          </div>

          <div className={`sp-footer ${mounted ? "mounted" : ""}`}>
            Company Management System © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;