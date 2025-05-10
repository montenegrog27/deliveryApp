import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function saveCustomer({ name, phone, address, location }) {
  if (!phone) return;

  const ref = doc(db, "customers", phone);

  const data = {
    name,
    phone,
    address,
    updatedAt: serverTimestamp(),
  };

  if (location && location.lat != null && location.lng != null) {
    data.location = location;
  }

  await setDoc(ref, data, { merge: true });
}
