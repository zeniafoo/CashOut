"use client";
import { useEffect, useState } from "react";
import { authService } from '@/lib/api/auth'

// const user_ID = "USR_ad04a6ed-b521-4225-9dcc-ca6618bb0d92";
export function getCurrentUserId(): string {
  const user = authService.getCurrentUser()
  if (!user || !user.UserId) {
    throw new Error('User not authenticated')
  }
  return user.UserId
}

const user_ID = getCurrentUserId();

interface Policy {
  policy_ID: string;
  user_ID: string;
  plan_ID: string;
  plan_Name: string;
  policy_StartDate: Date;
  policy_EndDate: Date;
  policy_IssuedDate: string;
  policy_Coverage: number;
  policy_DestinationCountry: string;
  policy_Status: string;
}

// Small reusable info block
function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-blue-50 p-3 rounded">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  );
}


// Status badge component
function StatusBadge({ status }: { status?: string }) {
  // you can map your statuses to colors here
  const map: Record<string, { bg: string; text: string }> = {
    Active: { bg: "bg-green-100", text: "text-green-700" },
    Inforce: { bg: "bg-green-100", text: "text-green-700" },
    Matured: { bg: "bg-gray-100", text: "text-gray-700" },
    Submitted: { bg: "bg-yellow-100", text: "text-yellow-700" },
  };
  const key = status || "unknown";
  const cfg = map[key] ?? { bg: "bg-gray-100", text: "text-gray-700" };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.text}`}>
      {status || "Unknown"}
    </span>
  );
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterText, setFilterText] = useState("");

  // Safe date formatter
  const formatDate = (d: Date) => {
    if (!d) return "N/A";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "N/A";
    return dt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filtered = policies.filter((p) => {
    if (!filterText) return true;
    return (
      p.policy_ID?.toString().includes(filterText) ||
      p.plan_ID?.toLowerCase().includes(filterText.toLowerCase()) ||
      p.policy_DestinationCountry?.toLowerCase().includes(filterText.toLowerCase())
    );
  });

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await fetch(
          `https://personal-g86bdbq5.outsystemscloud.com/Policy_DBEA_/rest/policy_v1/viewPolicies?user_ID=${user_ID}`,
          { cache: "no-store" }
        );

        const raw = await res.text();
        const data = JSON.parse(raw || "{}");

        const sorted = [...(data?.policyAPIList ?? [])].sort((a, b) => {
          return new Date(b.policy_StartDate).getTime() - new Date(a.policy_StartDate).getTime();
        });
        // console.log("✅ Sorted  response:", sorted);
        setPolicies(sorted);
      } catch (err) {
        console.error(err);
        setError("Failed to load policies");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">My Policies</h1>
        <div className="flex items-center gap-3">
      </div>
    </div>


    {loading && (
      <div className="space-y-4">
        {[1,2].map((i)=> (
          <div key={i} className="animate-pulse bg-white p-6 rounded-lg shadow"></div>
        ))}
      </div>
    )}

    {error && <p className="text-red-600">{error}</p>}


    {!loading && filtered.length === 0 && (
      <p className="text-gray-600">No policies found.</p>
    )}


    <div className="space-y-6">
      {filtered.map((p) => (
        <div key={p.policy_ID} className="bg-white rounded-lg shadow p-5">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Plan Name</div>
                  <div className="text-lg font-semibold text-gray-900">{p.plan_Name || "-"}</div>
                </div>
                <div className="text-right">
                  <StatusBadge status={p.policy_Status} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <InfoBlock label="Policy Number" value={p.policy_ID?.toString() ?? "-"} />
                <InfoBlock label="Coverage Amount (SGD)" value={`$${(Number(p.policy_Coverage)||0).toFixed(2)}`} />
                <InfoBlock label="Start" value={formatDate(p.policy_StartDate)} />
                <InfoBlock label="End" value={formatDate(p.policy_EndDate)} />
                <InfoBlock label="Destination" value={p.policy_DestinationCountry || "-"} />
                <InfoBlock label="Status" value={p.policy_Status || "-"} />
              </div>


              <div className="text-xs text-gray-400 mt-3">As of {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
}
