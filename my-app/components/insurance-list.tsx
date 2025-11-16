"use client"

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"

interface InsurancePlan {
  plan_ID: number,
  plan_Name: string;
  plan_Premium: number;
  plan_Country: string;
  plan_Provider: string;
  coverage_Amount: string;
  coverage_Scope: string;
}

interface ApiResponse {
  InsurancePlanList: InsurancePlan[];
  Result: {
    Success: boolean;
    ErrorMessage: string;
  };
}

export function InsuranceProductsPage() {
  const router = useRouter();

  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  // Fetch data on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(
          "https://personal-g86bdbq5.outsystemscloud.com/Insurance_DBEA_/rest/plan_v1/insuranceplans"
        );
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data: ApiResponse = await response.json();

        if (!data.Result.Success) {
          throw new Error(data.Result.ErrorMessage || "API returned failure");
        }

        setPlans(data.InsurancePlanList || []);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);
  
  // Unique filter options
  const countries = Array.from(new Set(plans.map((p) => p.plan_Country).filter(Boolean)));
  const providers = Array.from(new Set(plans.map((p) => p.plan_Provider).filter(Boolean)));

  // Apply filters
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchesCountry = selectedCountry ? p.plan_Country === selectedCountry : true;
      const matchesProvider = selectedProvider ? p.plan_Provider === selectedProvider : true;
      return matchesCountry && matchesProvider;
    });
  }, [plans, selectedCountry, selectedProvider]);

  const handleReset = () => {
    setSelectedCountry("");
    setSelectedProvider("");
  };

  // UI states
  if (loading)
    return <p className="text-center text-gray-600 mt-10">Loading insurance plans...</p>;
  if (error)
    return (
      <p className="text-center text-red-600 mt-10">
        ⚠️ Failed to load data: {error}
      </p>
    );

  return (
    <div className="min-h-screen p-8">
      {/* Filter Section */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-8 flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Country
          </label>
          <select
            className="w-full border rounded-lg p-2"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Provider
          </label>
          <select
            className="w-full border rounded-lg p-2"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            <option value="">All Providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-shrink-0 flex gap-2">
          <Button onClick={handleReset} variant="outline" className="h-[42px] w-full md:w-auto">
            Reset
          </Button>
        </div>
      </div>

      {/* Product Cards */}
      {filteredPlans.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan: any) => (
            <Card
              key={plan.plan_ID}
              className="shadow-md hover:shadow-xl cursor-pointer transition"
            >
              <CardContent className="p-4 space-y-2">
                <h2 className="text-lg font-medium text-gray-900">
                  {plan.plan_Name || "Unnamed Plan"}
                </h2>
                <p className="text-sm text-gray-500">
                  {plan.plan_Provider || "Unknown Provider"}
                </p>
                <p className="text-sm text-gray-500">
                  Country: {plan.plan_Country || "N/A"}
                </p>
                <p className="text-sm text-gray-700 font-semibold">
                  Premium: ${plan.plan_Premium.toFixed(2)*30}/month
                </p>
                <Button className="w-full mt-3" onClick={() =>router.push(`/insurance/${plan.plan_ID}`)}>
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
