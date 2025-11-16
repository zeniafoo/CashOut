"use client";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, User, Mail, ShieldCheck, Landmark, Calendar, CircleDollarSign, GalleryVerticalEnd  } from "lucide-react";
import { authService } from '@/lib/api/auth'

// const BENEFICIARY_USER_ID = "USR_ad04a6ed-b521-4225-9dcc-ca6618bb0d92";
export function getCurrentUserId(): string {
  const user = authService.getCurrentUser()
  if (!user || !user.UserId) {
    throw new Error('User not authenticated')
  }
  return user.UserId
}
const BENEFICIARY_USER_ID = getCurrentUserId();


interface InsurancePlan {
  plan_ID: number,
  plan_Name: string;
  plan_Premium: number;
  plan_Country: string;
  plan_Provider: string;
  coverage_Amount: string;
  coverage_Scope: string;
}
interface Beneficiary {
  Found: boolean;
  Name: string;
  Email: string;
  PhoneNumber: string;
  ReferralCode: string;
}

export default function QuoteDraftPage() {
  const { plan_ID } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState<number>(0);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);

  // Encoded params 
  const encoded_in = searchParams.get("data");
  let payload_in: any = null;
  if (encoded_in) {
    try {
      payload_in = JSON.parse(atob(encoded_in));
    } catch (err) {
      console.error("Invalid encoded data", err);
      router.push("/insurance?error=invalid_data");
    }
  }

  const startDate = payload_in?.startDate ?? null;
  const endDate = payload_in?.endDate ?? null;

  const [beneficiary, setBeneficiary] = useState({
    Found: false,
    Name: "",
    Email: "",
    Phone: "",
    ReferralCode: ""
  });
  const [beneficiaryLoading, setBeneficiaryLoading] = useState(true);

  const payload_out = {
    startDate,
    endDate,
  };
  const encoded_out = encodeURIComponent(btoa(JSON.stringify(payload_out)));

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
    
  // fetch plan
  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch(
          `https://personal-g86bdbq5.outsystemscloud.com/Insurance_DBEA_/rest/plan_v1/specificPlan?planID=${plan_ID}`
        );
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        const data = await res.json();
        console.log("✅ API response:", data);

        // Ensure we’re reading the correct object
        if (data?.InsurancePlan) {
          setPlan(data.InsurancePlan);
        } else if (data?.InsurancePlanList?.length) {
          setPlan(data.InsurancePlanList[0]);
        } else {
          console.warn("⚠️ No InsurancePlan object found in API response");
          setPlan(null);
        }
      } catch (err: any) {
        console.error("❌ Error fetching plan details:", err);
        setPlan(null);
      } finally {
        setLoading(false);
      }
    }

    if (plan_ID) fetchPlan();
  }, [plan_ID]);

  useEffect(() => {
    if (plan) {
      // console.log("✅ Plan successfully set:", plan.plan_Country);
    }
  }, [plan]);

  // Fetch calculated premium
  useEffect(() => {
    async function fetchPremium() {
      if (!plan_ID || !startDate || !endDate || !plan) return; // 👈 block until plan is ready
      setPremiumLoading(true);
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
        console.log("✅ Country used for premium calc:", plan.plan_Country);
        console.log("✅ Premium calc:", data);
      } catch (err: any) {
        console.error("Premium calculation failed:", err);
        setPremiumError("Failed to calculate premium. Please try again.");
      } finally {
        setPremiumLoading(false);
      }
    }

    fetchPremium();
  }, [plan_ID, startDate, endDate, plan]);


  if (loading)
    return <p className="text-center text-gray-600 mt-10">Loading draft...</p>;
  if (error)
    return <p className="text-center text-red-600 mt-10">Error: {error}</p>;
  if (!plan)
    return <p className="text-center text-gray-500 mt-10">Plan not found.</p>;

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-semibold">Policy Draft</h1>
        </div>

        {/* Policy Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <InfoBlock
            icon={<User className="text-blue-600 w-6 h-6" />}
            label="Beneficiary Name"
            value={beneficiary.Name}
          />
          <InfoBlock
            icon={<Mail className="text-blue-600 w-6 h-6" />}
            label="Beneficiary Email"
            value={beneficiary.Email}
          />
          <InfoBlock
            icon={<ShieldCheck className="text-blue-600 w-6 h-6" />}
            label="Plan Name"
            value={plan.plan_Name}
          />
          <InfoBlock
            icon={<Landmark className="text-blue-600 w-6 h-6" />}
            label="Provider"
            value={plan.plan_Provider}
          />
          <InfoBlock
            icon={<Calendar className="text-blue-600 w-6 h-6" />}
            label="Start Date"
            value={startDate}
          />
          <InfoBlock
            icon={<Calendar className="text-blue-600 w-6 h-6" />}
            label="End Date"
            value={endDate}
          />
        </div>
        <div className="grid gap-6 mb-8">
          <InfoBlock
            icon={<CircleDollarSign className="text-blue-600 w-6 h-6" />}
            label="Amount (SGD)"
            value={plan.coverage_Amount}
          />
          <InfoBlock
            icon={<GalleryVerticalEnd className="text-blue-600 w-6 h-6" />}
            label="Coverage"
            value={plan.coverage_Scope}
          />
        </div>

        {/* Premium Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-8">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            Premium Summary
          </h2>

          {premiumLoading && (
            <p className="text-blue-600">Calculating premium...</p>
          )}
          {premiumError && (
            <p className="text-red-600 text-sm">{premiumError}</p>
          )}
          {!premiumLoading && premium !== null && (
            <>
              <p className="text-blue-700">
                Total Calculated Premium (SGD):{" "}
                <strong>${premium.toFixed(2)}</strong>
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <button
            disabled={!premium}
            onClick={() =>
              router.push(
                `/insurance/${plan_ID}/payment?data=${encoded_out}`
              )
            }
            className={`px-6 py-3 rounded-lg font-semibold text-white ${
              premium
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
      {icon}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}
