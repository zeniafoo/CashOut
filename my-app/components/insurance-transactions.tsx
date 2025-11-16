"use client";
import { User } from "lucide-react";
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

interface Payment {
  payment_ID: number;
  user_ID: string;
  policy_ID: string;
  payment_date: Date;
  payment_amount: string;
  payment_desc: string;
  payment_status: string;
}

export default function InsuranceTransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterPolicyId, setFilterPolicyId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

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
  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      "Completed": "bg-green-100 text-green-700 border-green-300",
      "Not Due": "bg-yellow-100 text-yellow-700 border-yellow-300",
      failed: "bg-red-100 text-red-700 border-red-300",
    };

    return (
      <span
        className={`px-3 py-1 text-sm rounded-full border ${
          styles[status] || "bg-gray-100 text-gray-700 border-gray-300"
        }`}
      >
        {status === "Completed"
          ? "Completed"
          : status === "Not Due"
          ? "Not Due"
          : "Unknown"}
      </span>
    );
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch(
          `https://personal-g86bdbq5.outsystemscloud.com/Policy_DBEA_/rest/payments_v1/viewPayments?user_ID=${user_ID}`,
          { cache: "no-store" }
        );

        const raw = await res.text();
        const data = JSON.parse(raw || "{}");
        // console.log("✅ Transaction  response:", data);
        const sorted = [...(data?.paymentAPIList ?? [])].sort((a, b) => {
          return new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
        });
        // console.log("✅ Sorted  response:", sorted);
        setPayments(sorted);
      } catch (err) {
        console.error(err);
        setError("Failed to load payments");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const policyMatch = filterPolicyId
      ? p.policy_ID.includes(filterPolicyId)
      : true;

    const statusMatch = filterStatus
      ? p.payment_status === filterStatus
      : true;

    return policyMatch && statusMatch;
  });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-blue-700">Payment Records</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow border space-y-4">
        <div>
          <label className="text-gray-600">Payment Status</label>
          <select
            className="w-full border p-2 rounded mt-1"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="Completed">Completed</option>
            <option value="Not Due">Not Due</option>
          </select>
        </div>
      </div>

      {loading && <p>Loading payments...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {filtered.length === 0 && !loading && (
        <p className="text-gray-600">No matching payments found.</p>
      )}

      {/* Payment Cards */}
      {filtered.map((p) => (
        <div
          key={p.payment_ID}
          className="bg-white border rounded-xl shadow p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-gray-500 text-sm">Policy ID</p>
              <p className="font-semibold">{p.policy_ID}</p>
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <p className="text-gray-500 text-sm">Status</p>
              <StatusBadge status={p.payment_status} />
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <p className="text-gray-500 text-sm">Amount</p>
              <p className="font-semibold">{p.payment_amount}</p>
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <p className="text-gray-500 text-sm">Payment Date</p>
              <p className="font-semibold">{formatDate(p.payment_date)}</p>
            </div>

            <div className="bg-blue-50 p-3 rounded col-span-2">
              <p className="text-gray-500 text-sm">Description</p>
              <p className="font-semibold">{p.payment_desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
