"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

/* ----------------------------------------
   Safe Date Formatting (unbreakable)
-----------------------------------------*/
function formatSafeDate(input: string | null): string {
  if (!input || typeof input !== "string") return "N/A";

  const parts = input.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const padded = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    const dt = new Date(padded);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }
  return "N/A";
}
interface InsurancePlan {
  plan_ID: number,
  plan_Name: string;
  plan_Premium: number;
  plan_Country: string;
  plan_Provider: string;
  coverage_Amount: string;
  coverage_Scope: string;
}

interface Wallet {
  Id: number;
  UserId: string;
  CurrencyCode: string;
  Balance: number;
  CreatedAt: string;
  UpdatedAt: string;
  IsActive: boolean;
}

interface Beneficiary {
  Found: boolean;
  Name: string;
  Email: string;
  PhoneNumber: string;
  ReferralCode: string;
}

export default function InsurancePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { plan_ID } = useParams();
  const BENEFICIARY_USER_ID = "USR_ad04a6ed-b521-4225-9dcc-ca6618bb0d92";

  /* ----------------------------------------
     Search Params (safe access)
  -----------------------------------------*/
  const premium = Number(searchParams.get("premium") ?? 0);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  /* ----------------------------------------
     Component State
  -----------------------------------------*/
  const [plan, setPlan] = useState<any>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState("full");
  const [allowMonthly, setAllowMonthly] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [beneficiary, setBeneficiary] = useState({
  Found: false,
  Name: "",
  Email: "",
  Phone: "",
  ReferralCode: ""
  });
  const [beneficiaryLoading, setBeneficiaryLoading] = useState(true);

  /* ----------------------------------------
     Fetch Plan
  -----------------------------------------*/
  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch(
          `https://personal-g86bdbq5.outsystemscloud.com/Insurance_DBEA_/rest/plan_v1/specificPlan?planID=${plan_ID}`
        );
        const data = await res.json();
        console.log("✅ Plan response:", data);
        setPlan(data?.InsurancePlan ?? null);
      } catch (e) {
        setPlan(null);
      }
    }
    if (plan_ID) loadPlan();
  }, [plan_ID]);

  /* ----------------------------------------
     Fetch Wallets
  -----------------------------------------*/
  useEffect(() => {
    async function loadWallets() {
      try {
        const res = await fetch(
          "https://personal-v44qxubl.outsystemscloud.com/Deposit/rest/WalletAPI/GetAllWalletByUserId?UserId=USR_ad04a6ed-b521-4225-9dcc-ca6618bb0d92"
        );

        if (!res.ok) throw new Error("Failed to fetch wallets");

        const data = await res.json();
        console.log("✅ Wallet Response:", data);

        setWallets(data?.Wallets ?? []);
      } catch (e) {
        console.error("Error fetching wallets:", e);
        setWallets([]);
      }
    }

    loadWallets();
  }, []);

  /* ----------------------------------------
     Fetch Beneficiary
  -----------------------------------------*/
  useEffect(() => {
    const fetchBeneficiary = async () => {
      try {
        setBeneficiaryLoading(true);

        const res = await fetch(
          `https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI/GetUser?UserId=${BENEFICIARY_USER_ID}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }
        );

        if (!res.ok) throw new Error("Failed to fetch beneficiary");

        const data = await res.json();
        console.log("✅ Beneficiary Response:", data);

        setBeneficiary({
          Found: data.Found,
          Name: data.Name,
          Email: data.Email,
          Phone: data.PhoneNumber,
          ReferralCode: data.ReferralCode,
        });
      } catch (err) {
        console.error("Beneficiary Error:", err);
        setBeneficiary({
          Found: false,
          Name: "",
          Email: "",
          Phone: "",
          ReferralCode: "",
        });
      } finally {
        setBeneficiaryLoading(false);
      }
    };

    fetchBeneficiary();
  }, []);

  /* ----------------------------------------
     Wallet Balance Update
  -----------------------------------------*/
  useEffect(() => {
    const wallet = wallets.find((w: Wallet) => w.Id.toString() === selectedWallet);
    setWalletBalance(wallet ? wallet.Balance : 0);
  }, [selectedWallet, wallets]);

  /* ----------------------------------------
     Monthly Eligibility (>= 90 days)
  -----------------------------------------*/
  useEffect(() => {
    if (!startDate || !endDate) return;

    const s = new Date(startDate);
    const e = new Date(endDate);
    const days = (e.getTime() - s.getTime()) / (1000 * 3600 * 24);

    const ok = days >= 90;
    setAllowMonthly(ok);
    if (!ok && paymentMode === "monthly") setPaymentMode("full");
  }, [startDate, endDate, paymentMode]);

  /* ----------------------------------------
    PAYMENT HELPERS
  -----------------------------------------*/

  // Calculate full months between dates
  const calculateMonths = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);

    let months =
      (e.getFullYear() - s.getFullYear()) * 12 +
      (e.getMonth() - s.getMonth());

    // If end day is earlier in the month, count fewer months
    if (e.getDate() < s.getDate()) months--;

    return Math.max(1, months);
  };

  // Generate future monthly billing dates
  const generateMonthlyDates = (start: string, count: number) => {
    const base = new Date(start);
    const dates: string[] = [];

    for (let i = 1; i < count; i++) {
      const d = new Date(base);
      d.setMonth(base.getMonth() + i);
      dates.push(d.toISOString().split("T")[0]);
    }

    return dates;
  };

  // Universal Payment API Caller
  const callPaymentAPI = async (payload: any) => {
    console.log("📡 Payment Payload:", payload);

    const res = await fetch(
      "https://personal-g86bdbq5.outsystemscloud.com/Policy_DBEA_/rest/payments_v1/addPayment",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const raw = await res.text();
    console.log("📨 Payment API Response:", raw);

    if (!res.ok) throw new Error("Payment API failed: " + raw);

    return JSON.parse(raw);
  };

  /* ----------------------------------------
    TRIGGER PAYMENTS
  -----------------------------------------*/
  const triggerPayments = async ({
    policyId,
    paymentMode,
    premium,
    startDate,
    endDate,
    walletId,
  }: {
    policyId: string;
    paymentMode: string;
    premium: number;
    startDate: string;
    endDate: string;
    walletId: string;
  }) => {
    const userId = BENEFICIARY_USER_ID;
    const today = new Date().toISOString().split("T")[0];

    const totalMonths = calculateMonths(startDate, endDate);
    console.log("📅 TOTAL MONTHS:", totalMonths);

    /* ---------------- FULL PAYMENT ---------------- */
    if (paymentMode === "full") {
      const payload = {
        user_ID: userId,
        policy_ID: policyId,
        wallet_ID: walletId,
        payment_date: today,
        payment_amount: premium,
        payment_desc: "Full payment received",
        payment_status: "Completed",
        payment_Type: "Full",
        policy_StartDate: startDate,
        policy_EndDate: endDate,
      };

      await callPaymentAPI(payload);
      return;
    }

    /* ---------------- MONTHLY PAYMENTS ---------------- */
    const instalment = premium / totalMonths;
    const futureDates = generateMonthlyDates(startDate, totalMonths);

    // First instalment now
    const initialPayload = {
      user_ID: userId,
      policy_ID: policyId,
      wallet_ID: walletId,
      payment_date: today,
      payment_amount: instalment,
      payment_desc: `Initial instalment (1/${totalMonths})`,
      payment_status: "Completed",
      payment_Type: "Monthly",
      policy_StartDate: startDate,
      policy_EndDate: endDate,
    };

    await callPaymentAPI(initialPayload);

    // Remaining instalments
    futureDates.forEach(async (date, idx) => {
      const payload = {
        user_ID: userId,
        policy_ID: policyId,
        wallet_ID: walletId,
        payment_date: date,
        payment_amount: instalment,
        payment_desc: `Scheduled instalment (${idx + 2}/${totalMonths})`,
        payment_status: "Not Due",
        payment_Type: "Monthly",
        policy_StartDate: startDate,
        policy_EndDate: endDate,
      };

      await callPaymentAPI(payload);
    });
  };

  /* ----------------------------------------
     Payment Submission
  -----------------------------------------*/
  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!selectedWallet) {
      setError("Please select a wallet.");
      return;
    }

    const required = paymentMode === "monthly" ? premium / 3 : premium;
    if (walletBalance < required) {
      setError(`Insufficient balance. Required: $${required.toFixed(2)}`);
      return;
    }

    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      /* ----------------------------------------------------
        STEP 1 — Create Policy
      ----------------------------------------------------- */
      const policyPayload = {
        user_ID: BENEFICIARY_USER_ID,
        plan_ID: plan?.plan_ID ?? "",
        policy_StartDate: startDate,
        policy_EndDate: endDate,
        policy_IssuedDate: today,
        policy_Premium: premium,
        policy_DestinationCountry: plan?.plan_Country ?? "",
        policy_Status: "Submitted",
      };

      console.log("Policy Payload:", JSON.stringify(policyPayload, null, 2));

      const res = await fetch(
        "https://personal-g86bdbq5.outsystemscloud.com/Policy_DBEA_/rest/policy_v1/addPolicy",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(policyPayload),
        }
      );

      const rawText = await res.text();
      console.log("Policy API Response:", rawText);

      if (!res.ok) throw new Error(rawText);

      const policyResponse = JSON.parse(rawText);

      // 🔥 THE IMPORTANT PART — get new policy ID
      const newPolicyID = policyResponse.policy_ID;
      if (!newPolicyID) throw new Error("No policy_ID returned from API");

      console.log("🔥 NEW POLICY ID =", newPolicyID);

      /* ----------------------------------------------------
        STEP 2 — Trigger Payments (full or monthly)
      ----------------------------------------------------- */
      await triggerPayments({
        policyId: newPolicyID,
        paymentMode,
        premium,
        startDate: startDate!,
        endDate: endDate!,
        walletId: selectedWallet,
      });

      setSuccess("Payment successful! Redirecting...");
      // setTimeout(() => router.push("/insurance"), 1800);
    } catch (err) {
      console.error("❌ ERROR:", err);
      setError("Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------
     Price Breakdown
  -----------------------------------------*/
  const instalment = premium / 3;

  /* ----------------------------------------
     UI Rendering
  -----------------------------------------*/
  return (
    <div className="max-w-3xl mx-auto p-6 mt-6 space-y-8">

      {/* BENEFICIARY SECTION */}
      <div className="bg-white p-5 rounded-xl shadow border">
        <h2 className="text-blue-700 font-semibold text-xl mb-4">
          Beneficiary Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-500 text-sm">Beneficiary Name</p>
            <p className="font-semibold text-gray-900">{beneficiary.Name || "N/A"}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-500 text-sm">Beneficiary Email</p>
            <p className="font-semibold text-gray-900">{beneficiary.Email || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* POLICY SECTION */}
      <div className="bg-white p-5 rounded-xl shadow border">
        <h2 className="text-blue-700 font-semibold text-xl mb-4">
          Policy Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-500 text-sm">Plan Name</p>
            <p className="font-semibold text-gray-900">{plan?.plan_Name ?? "N/A"}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-500 text-sm">Provider</p>
            <p className="font-semibold text-gray-900">{plan?.plan_Provider ?? "N/A"}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-500 text-sm">Start Date</p>
            <p className="font-semibold text-gray-900">
              {formatSafeDate(startDate)}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-500 text-sm">End Date</p>
            <p className="font-semibold text-gray-900">
              {formatSafeDate(endDate)}
            </p>
          </div>
        </div>
      </div>

      {/* PAYMENT SECTION */}
      <div className="bg-white p-5 rounded-xl shadow border">
        <h2 className="text-blue-700 font-semibold text-xl mb-4">
          Payment Details
        </h2>

        {/* Payment Mode */}
        <div className="mb-4">
          <label className="text-gray-700 font-medium">Payment Type</label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="w-full p-2 border rounded mt-1"
            disabled={!allowMonthly}
          >
            <option value="full">Full Payment</option>
            <option value="monthly" disabled={!allowMonthly}>
              Monthly Instalments
            </option>
          </select>

          {!allowMonthly && (
            <p className="text-gray-500 text-sm mt-1">
              Monthly instalments require ≥ 90 days coverage.
            </p>
          )}
        </div>

        {/* Wallet Selector */}
        <div className="mb-4">
          <label className="text-gray-700 font-medium">Select Wallet</label>
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select a wallet</option>

            {wallets.map((w: Wallet) => (
              <option key={w.Id} value={w.Id.toString()}>
                {w.CurrencyCode} — ${w.Balance.toFixed(2)}
              </option>
            ))}
          </select>

          {selectedWallet && walletBalance < (paymentMode === "monthly" ? instalment : premium) && (
            <p className="text-red-600 text-sm mt-1">
              ⚠ Insufficient balance
            </p>
          )}
        </div>

        {/* Premium Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-600 mb-1 font-medium">Premium to Pay:</p>

          {paymentMode === "monthly" ? (
            (() => {
              const months = calculateMonths(startDate!, endDate!);
              const instalment = premium / months;
              const remainingTotal = premium - instalment;

              return (
                <>
                  <p className="text-2xl font-bold text-blue-700">
                    ${instalment.toFixed(2)} now
                  </p>
                  <p className="text-sm text-gray-700">
                    + {months - 1} instalments of ${instalment.toFixed(2)}  
                    ({remainingTotal.toFixed(2)} total)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Spread across {months} months
                  </p>
                </>
              );
            })()
          ) : (
            <p className="text-2xl font-bold text-blue-700">
              ${premium.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* ACTION BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-3 rounded-lg text-white font-semibold ${
          loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Processing..." : "Confirm Payment"}
      </button>

      {error && <p className="text-red-600 text-center">{error}</p>}
      {success && <p className="text-green-600 text-center">{success}</p>}
    </div>
  );
}
