// src/utils/generateEmployeeId.js
// Format: E0001, E0002, E0003 ... E9999
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

export const generateEmployeeId = async () => {
  const snap = await getDocs(collection(db, "users"));
  const existing = snap.docs
    .map(d => d.data().employeeId)
    .filter(Boolean)
    .map(id => {
      // Support E0001 format (primary) and old EMP-001 format (legacy)
      const m = id.match(/^E(\d{4})$/) || id.match(/^EMP-(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter(n => n > 0);

  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `E${String(next).padStart(4, "0")}`;
};