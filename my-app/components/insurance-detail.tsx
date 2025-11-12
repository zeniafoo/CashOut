"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, DollarSign, FileText, Layers, RefreshCcw } from "lucide-react";

export default function InsuranceDetailsPage() {
  const { plan_ID } = useParams();
  const router = useRouter();

  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for validation
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [validationMsg, setValidationMsg] = useState<string>("");

  useEffect(() => {
    if (!plan_ID) return;

    async function fetchPlan() {
      try {
        const res = await fetch(
          `https://personal-g86bdbq5.outsystemscloud.com/Insurance_DBEA_/rest/plan_v1/specificPlan?planID=${plan_ID}`
        );
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        const data = await res.json();
        setPlan(data.InsurancePlan || data);
      } catch (error: any) {
        console.error(error);
        setError(error.message);
      }
    }

    fetchPlan();
  }, [plan_ID]);

  if (error)
    return <p className="text-center text-red-600 p-6">Error: {error}</p>;

  if (!plan) return <p className="p-6 text-gray-600">Loading plan details...</p>;

  const today = new Date().toISOString().split("T")[0];
  const minEndDate = startDate || today;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setValidationMsg(""); // reset message

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date(today);

    if (start < now) {
      setValidationMsg("Start date cannot be before today.");
      return;
    }
    if (end <= start) {
      setValidationMsg("End date must be after start date.");
      return;
    }

    router.push(`/insurance/${plan_ID}/quote-draft?start=${startDate}&end=${endDate}`);
  };

  return (
    <div className="min-h-screen pb-16">
      {/* HEADER */}
      <section className="max-w-6xl rounded-lg mx-auto bg-white py-10 shadow-sm">
        <div className="mx-auto px-6 text-center">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            {plan.plan_Name}
          </h1>
          <p className="text-gray-600">
            {plan.plan_Provider} • {plan.plan_Country}
          </p>
          <p className="text-xl font-bold text-blue-700 mt-3">
            ${plan.plan_Premium?.toFixed(2)} / month
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard
          icon={<DollarSign className="w-8 h-8 text-blue-600" />}
          title="Payment Options"
          description="Single premium via asset transfer, or cash in USD / SGD."
        />
        <FeatureCard
          icon={<FileText className="w-8 h-8 text-blue-600" />}
          title="Coverage"
          description={plan.coverage_Scope || "Whole life coverage on death and terminal illness."}
        />
        <FeatureCard
          icon={<CalendarDays className="w-8 h-8 text-blue-600" />}
          title="Charges"
          description="Guaranteed cost of insurance charges with 0% premium load."
        />
        <FeatureCard
          icon={<Layers className="w-8 h-8 text-blue-600" />}
          title="Flexibility"
          description="Control over investment strategy with flexible access to policy value."
        />
        <FeatureCard
          icon={<RefreshCcw className="w-8 h-8 text-blue-600" />}
          title="Receive Payouts"
          description="Beneficiaries can receive death benefits in cash or via asset transfer."
        />
      </section>

      {/* INFO SECTION */}
      <section className="max-w-6xl lg-rounded mx-auto px-6 mt-12">
        <details className="bg-white rounded-xl shadow-sm p-5">
          <summary className="cursor-pointer text-lg font-semibold text-gray-800">
            Important Information
          </summary>
          <p className="mt-3 text-gray-600 text-sm">
            This policy is subject to terms, exclusions, and conditions. Please review the policy brochure before purchase.
          </p>
        </details>
      </section>

      {/* QUOTE FORM */}
      <section className="max-w-6xl rounded-lg mx-auto mt-12 bg-green-600 text-white py-10 px-6">
        <div className="mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-6">Want to start applying?</h2>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row justify-center gap-4">
            <div className="flex flex-col w-full sm:w-1/3 text-left">
              <label className="font-medium mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                required
                min={today}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setValidationMsg("");
                }}
                className="p-3 rounded-lg bg-white text-green-900"
              />
            </div>

            <div className="flex flex-col w-full sm:w-1/3 text-left">
              <label className="font-medium mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                required
                min={minEndDate}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setValidationMsg("");
                }}
                className="p-3 rounded-lg bg-white text-green-900"
              />
            </div>

            <button
              type="submit"
              className="bg-white text-green-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition self-end"
              onClick={() =>router.push(`/insurance/${plan.plan_ID}`)}
            >
              Continue
            </button>
          </form>

          {validationMsg && (
            <span className="block mt-3 text-sm text-yellow-200 font-medium">
              ⚠️ {validationMsg}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

// Feature card component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-3">{icon}</div>
      <h3 className="text-lg font-semibold mb-1 text-gray-800">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
