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
    if (!ok && paymentMode === "recurring") setPaymentMode("full");
  }, [startDate, endDate, paymentMode]);

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

    const required = paymentMode === "recurring" ? premium / 3 : premium;
    if (walletBalance < required) {
      setError(`Insufficient balance. Required: $${required.toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      /* Step 1 — Create Policy */
      const policyRes = await fetch(
        "https://personal-g86bdbq5.outsystemscloud.com/Insurance_DBEA_/rest/policy_v1/CreatePolicy",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_ID,
            policy_StartDate: startDate,
            policy_EndDate: endDate,
            paymentMode,
            policy_Country: plan?.plan_Country ?? "",
          }),
        }
      );

      const policyData = await policyRes.json();
      const policy_ID = policyData?.policy_ID ?? 0;

      /* Step 2 — Create Payment */
      const paymentBody =
        paymentMode === "recurring"
          ? {
              policy_ID,
              payment_Type: "Monthly",
              total_Amount: premium,
              initial_Amount: premium / 3,
              wallet_ID: Number(selectedWallet),
            }
          : {
              policy_ID,
              payment_Type: "OneTime",
              total_Amount: premium,
              wallet_ID: Number(selectedWallet),
            };

      await fetch(
        "https://personal-g86bdbq5.outsystemscloud.com/Insurance_DBEA_/rest/payment_v1/CreatePayment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentBody),
        }
      );

      setSuccess("Payment successful! Redirecting...");
      setTimeout(() => router.push("/insurance"), 1800);
    } catch (e) {
      console.error(e);
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
            <option value="recurring" disabled={!allowMonthly}>
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

          {selectedWallet && walletBalance < (paymentMode === "recurring" ? instalment : premium) && (
            <p className="text-red-600 text-sm mt-1">
              ⚠ Insufficient balance
            </p>
          )}
        </div>

        {/* Premium Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-600 mb-1 font-medium">Premium to Pay:</p>

          {paymentMode === "recurring" ? (
            <>
              <p className="text-2xl font-bold text-blue-700">
                ${instalment.toFixed(2)} now
              </p>
              <p className="text-sm text-gray-700">
                + ${(premium - instalment).toFixed(2)} over next 2 months
              </p>
            </>
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
