"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Currency } from "lucide-react";
import { getExchangeRate } from "@/lib/api/exchange"
import { authService } from '@/lib/api/auth'
import toast from "react-hot-toast";

// const BENEFICIARY_USER_ID = "USR_ad04a6ed-b521-4225-9dcc-ca6618bb0d92";
export function getCurrentUserId(): string {
  const user = authService.getCurrentUser()
  if (!user || !user.UserId) {
    throw new Error('User not authenticated')
  }
  return user.UserId
}
const BENEFICIARY_USER_ID = getCurrentUserId();

// safe date formating
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

// currency formmating
export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2
  }).format(amount);
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

  // Encoded Params
  const encoded = searchParams.get("data");
  let payload: any = null;
  if (encoded) {
    try {
      payload = JSON.parse(atob(encoded));
    } catch (err) {
      // console.error("Invalid encoded data", err);
      router.push("/insurance?error=invalid_data");
    }
  }

  const startDate = payload?.startDate ?? null;
  const endDate = payload?.endDate ?? null;

  /* ----------------------------------------
     Component State
  -----------------------------------------*/
  const [plan, setPlan] = useState<any>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const selectedWalletObj = wallets.find(w => w.Id.toString() === selectedWallet);
  const selectedWalletCurrency = selectedWalletObj?.CurrencyCode ?? "SGD";
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState("full");
  const [allowMonthly, setAllowMonthly] = useState(true);

  const [premium, setPremium] = useState<number>(0);        // always in SGD
  const [displayPremium, setDisplayPremium] = useState(0);  // converted to wallet currency

  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [currentRate, setCurrentRate] = useState<number>(0);

  const [loading, setLoading] = useState(false);

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
        // console.log("✅ Plan response:", data);
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
          `https://personal-v44qxubl.outsystemscloud.com/Deposit/rest/WalletAPI/GetAllWalletByUserId?UserId=${BENEFICIARY_USER_ID}`
        );

        if (!res.ok) throw new Error("Failed to fetch wallets");

        const data = await res.json();
        // console.log("✅ Wallet Response:", data);

        setWallets(data?.Wallets ?? []);
      } catch (e) {
        // console.error("Error fetching wallets:", e);
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
        // console.log("✅ Beneficiary Response:", data);

        setBeneficiary({
          Found: data.Found,
          Name: data.Name,
          Email: data.Email,
          Phone: data.PhoneNumber,
          ReferralCode: data.ReferralCode,
        });
      } catch (err) {
        // console.error("Beneficiary Error:", err);
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

  // Fetch calculated premium
  useEffect(() => {
    async function fetchPremium() {
      if (!plan_ID || !startDate || !endDate || !plan) return; // 👈 block until plan is ready
      setLoading(true);
      setPremiumError(null);
      try {
        const res = await fetch(
          `https://personal-g86bdbq5.outsystemscloud.com/Policy_DBEA_/rest/payments_v1/calculatePremium`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan_ID: Number(plan_ID),
              policy_StartDate: startDate,
              policy_EndDate: endDate,
              policy_DestinationCountry: plan.plan_Country,
            }),
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPremium(Number(data));
        setDisplayPremium(Number(data));
        console.log("✅ Premium calc:", data);
      } catch (err: any) {
        // console.error("Premium calculation failed:", err);
        setPremiumError("Failed to calculate premium. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchPremium();
  }, [plan_ID, startDate, endDate, plan]);

  // Get exchange rate API
  async function getCurrRate(from: string, to: string): Promise<number> {
    if (!from || !to || from === to) return 1;

    try {
      const rate = await getExchangeRate(from, to);
      const num = Number(rate);

      if (!num || num <= 0) return 1;

      setCurrentRate(num);
      return num;
    } catch (err) {
      // console.error("FX error:", err);
      return 1;
    }
  }

  // Converts calculated premium
  useEffect(() => {
    async function updatePremiumCurrency() {
      setLoading(true);
      if (!premium || !selectedWallet) return;

      const wallet = wallets.find(w => w.Id.toString() === selectedWallet);
      if (!wallet) return;

      const rate = await getCurrRate("SGD", wallet.CurrencyCode);
      setDisplayPremium(premium * rate);
      setLoading(false);
    }
    updatePremiumCurrency();
  }, [selectedWallet, premium]);

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

  // Payment API Caller
  const callPaymentAPI = async (paypayload: any) => {
    console.log("Payment Payload:", JSON.stringify(paypayload, null, 2));

    const res = await fetch(
      "https://personal-g86bdbq5.outsystemscloud.com/Policy_DBEA_/rest/payments_v1/addPayment",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paypayload),
      }
    );

    const raw = await res.text();
    console.log("📨 Payment API Response:", raw);

    if (!res.ok) throw new Error("Payment API failed: " + raw);

    return JSON.parse(raw);
  };

  // Wallet Deduction API Caller
  const callWalletDeduction = async ({
    userId,
    currency,
    amount,
  }: {
    userId: string;
    currency: string;
    amount: number;
  }) => {
    console.log("📡 Wallet Deduction Payload:", {
      UserId: userId,
      CurrencyCode: currency,
      Amount: amount,
    });

    const res = await fetch(
      "https://personal-v44qxubl.outsystemscloud.com/Deposit/rest/WalletAPI/UpdateWallet",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UserId: userId,
          CurrencyCode: currency,
          Amount: -Math.abs(amount), // ALWAYS negative deduction
        }),
      }
    );

    const raw = await res.text();
    console.log("💳 Wallet API Response:", raw);

    if (!res.ok) throw new Error("Wallet API failed: " + raw);

    return JSON.parse(raw || "{}");
  };

  /* ----------------------------------------
    TRIGGER PAYMENTS
  -----------------------------------------*/
  const triggerPayments = async ({
    policyId,
    paymentMode,
    premium,
    walletId,
  }: {
    policyId: string;
    paymentMode: string;
    premium: number;
    walletId: string;
  }) => {
    const userId = BENEFICIARY_USER_ID;
    const today = new Date().toISOString().split("T")[0];

    const totalMonths = calculateMonths(startDate, endDate);
    console.log("📅 TOTAL MONTHS:", totalMonths);

    /* ---------------- Full Payment ---------------- */
    if (paymentMode === "full") {
      const formattedPremium = displayPremium.toFixed(2)
      
      const paypayload = {
        user_ID: userId,
        policy_ID: policyId,
        wallet_ID: walletId,
        payment_date: today,
        payment_amount: String(formattedPremium + selectedWalletCurrency),
        payment_desc: "Full payment received",
        payment_status: "Completed",
        payment_Type: "Full",
      };
      const selectedWalletObj = wallets.find(
        (w) => w.Id.toString() === selectedWallet
      );
      const walletCurrency =
        selectedWalletObj?.CurrencyCode ?? "SGD";
        
      // 💳 Deduct full premium immediately
      await callWalletDeduction({
        userId,
        currency: walletCurrency,
        amount: Number(formattedPremium),
      });

      await callPaymentAPI(paypayload);
      return;
    }

    /* ---------------- Monthly Payments ---------------- */
    const instalment = totalMonths > 0
    ? displayPremium / totalMonths
    : displayPremium;

    const formattedInstalment = instalment.toFixed(2)

    const futureDates = generateMonthlyDates(startDate, totalMonths);

    // First instalment now
    const initialPayload = {
      user_ID: userId,
      policy_ID: policyId,
      wallet_ID: walletId,
      payment_date: today,
      payment_amount: String(formattedInstalment + selectedWalletCurrency),
      payment_desc: `Initial instalment (1/${totalMonths})`,
      payment_status: "Completed",
      payment_Type: "Monthly",
    };

    const selectedWalletObj = wallets.find(
        (w) => w.Id.toString() === selectedWallet
      );
      const walletCurrency =
        selectedWalletObj?.CurrencyCode ?? "SGD";

    await callWalletDeduction({
      userId,
      currency: walletCurrency,
      amount: Number(formattedInstalment),
    });
    await callPaymentAPI(initialPayload);

    /* ---------------- Remaining Payments ---------------- */
    futureDates.forEach(async (date, idx) => {
      const paypayload = {
        user_ID: userId,
        policy_ID: policyId,
        wallet_ID: walletId,
        payment_date: date,
        payment_amount: String(formattedInstalment + selectedWalletCurrency),
        payment_desc: `Scheduled instalment (${idx + 2}/${totalMonths})`,
        payment_status: "Not Due",
        payment_Type: "Monthly",
      };

      await callPaymentAPI(paypayload);
    });
  };

  /* ----------------------------------------
     Payment Submission
  -----------------------------------------*/
  const handleSubmit = async () => {
    if (!selectedWallet) {
      // setError("Please select a wallet.");
      toast.error("Please select a wallet.")
      return;
    }

    const required = paymentMode === "monthly" ? premium / 3 : premium;
    if (walletBalance < required) {
      // setError(`Insufficient balance. Required: $${required.toFixed(2)}`);
      toast.error(`Insufficient balance. Required: $${required.toFixed(2)}`)
      return;
    }

    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      /* ---------------- Create Policy ---------------- */
      const policyPayload = {
        user_ID: BENEFICIARY_USER_ID,
        plan_ID: plan?.plan_ID ?? "",
        plan_Name: plan?.plan_Name ?? "",
        policy_StartDate: startDate,
        policy_EndDate: endDate,
        policy_IssuedDate: today,
        policy_Coverage: plan?.coverage_Amount ?? "",
        policy_DestinationCountry: plan?.plan_Country ?? "",
        policy_Status: "",
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

      /* ---------------- Trigger Payments ---------------- */
      await triggerPayments({
        policyId: newPolicyID,
        paymentMode,
        premium: displayPremium,
        walletId: selectedWallet,
      });

      toast.success("Payment successful! Redirecting...");
      setTimeout(() => router.push(`/insurance/policies`), 1800);
    } catch (err) {
      // console.error("❌ ERROR:", err);
      toast.error("Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Price Breakdown ---------------- */
  const totalMonths = calculateMonths(startDate, endDate);
  const instalment = totalMonths > 0
    ? displayPremium / totalMonths
    : displayPremium;

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
          {(paymentMode == "monthly") && (
            <p className="text-gray-500 text-sm mt-1">
              Monthly instalments will be tied to one wallet.
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
                {w.CurrencyCode} — {formatCurrency(w.Balance, w.CurrencyCode)}
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
              const instalment = displayPremium / months;
              const remainingTotal = displayPremium - instalment;

              return (
                <>
                  <p className="text-2xl font-bold text-blue-700">
                    {/* {insta  lment.toFixed(2)}{selectedWalletCurrency}  */}
                    {formatCurrency(Number(instalment), selectedWalletCurrency)} now
                  </p>
                  <p className="text-sm text-gray-700">
                    + {months - 1} instalments of {formatCurrency(Number(instalment), selectedWalletCurrency)}  
                    ({formatCurrency(Number(remainingTotal), selectedWalletCurrency)} total)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Spread across {months} months
                  </p>
                </>
              );
            })()
          ) : (
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(Number(displayPremium), selectedWalletCurrency)}
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
    </div>
  );
}
