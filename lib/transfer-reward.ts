import { db } from "@/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

type UserProfileRef = {
  ref: ReturnType<typeof doc>;
};

const DEFAULT_ADMIN_START_BALANCE = 10000;
const DEFAULT_ORG_WALLET_ID = "demo_org_001";

async function getUserProfileRefByUsername(
  username: string
): Promise<UserProfileRef | null> {
  if (!username) return null;
  const q = query(
    collection(db, "userProfiles"),
    where("username", "==", username)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const userDoc = snapshot.docs[0];
  return { ref: doc(db, "userProfiles", userDoc.id) };
}

async function ensureUserProfile(
  username: string,
  startingPoints: number
): Promise<UserProfileRef | null> {
  const existing = await getUserProfileRefByUsername(username);
  if (existing) return existing;

  const docRef = await addDoc(collection(db, "userProfiles"), {
    username,
    points: 0,
    walletBalance: startingPoints,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return { ref: doc(db, "userProfiles", docRef.id) };
}

type TransferRewardParams = {
  adminUsername: string;
  hunterUsername: string;
  hunterUid: string;
  huntId: string;
  submissionId: string;
  amount: number;
  orgWalletId?: string;
};

export async function transferRewardFromAdmin({
  adminUsername,
  hunterUsername,
  hunterUid,
  huntId,
  submissionId,
  amount,
  orgWalletId = DEFAULT_ORG_WALLET_ID,
}: TransferRewardParams) {
  if (!adminUsername || !hunterUsername || amount <= 0) {
    throw new Error("Invalid transfer request");
  }

  const orgWalletRef = doc(db, "org_wallets", orgWalletId);
  const orgWalletSnap = await getDoc(orgWalletRef);
  if (!orgWalletSnap.exists()) {
    throw new Error("Org wallet not found");
  }

  const adminProfile = await ensureUserProfile(
    adminUsername,
    DEFAULT_ADMIN_START_BALANCE
  );
  const hunterProfile = await ensureUserProfile(hunterUsername, 0);

  if (!adminProfile || !hunterProfile) {
    throw new Error("User profile not found");
  }

  const timestamp = new Date().toISOString();

  const payoutAmountMicro = Math.floor(amount * 1000000);

  await runTransaction(db, async (transaction) => {
    const orgWalletTxnSnap = await transaction.get(orgWalletRef);
    const adminSnap = await transaction.get(adminProfile.ref);
    const hunterSnap = await transaction.get(hunterProfile.ref);

    if (!orgWalletTxnSnap.exists() || !adminSnap.exists() || !hunterSnap.exists()) {
      throw new Error("User profile not found");
    }

    const orgBalance = orgWalletTxnSnap.data().balance || 0;
    const hunterBalance = hunterSnap.data().walletBalance || 0;

    if (orgBalance < payoutAmountMicro) {
      throw new Error("Insufficient org wallet balance");
    }

    transaction.update(orgWalletRef, {
      balance: orgBalance - payoutAmountMicro,
      updatedAt: timestamp,
    });
    transaction.update(hunterProfile.ref, {
      walletBalance: hunterBalance + amount,
      updatedAt: timestamp,
    });
  });

  const payoutOrderId = `BH-PAYOUT-${submissionId}-${Date.now()}`;
  await addDoc(collection(db, "payouts"), {
    order_id: payoutOrderId,
    orgId: orgWalletId,
    huntId,
    submissionId,
    hunterUid,
    hunterWallet: "",
    amount: payoutAmountMicro,
    currency: "INR",
    network: "INTERNAL",
    status: "completed",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: adminUsername,
    payoutSource: "org_wallets",
  });

  return true;
}