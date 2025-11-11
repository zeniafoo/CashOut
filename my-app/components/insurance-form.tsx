"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const mockInsuranceData = [
  { id: 1, name: "GlobalCare Platinum", country: "Japan" },
  { id: 2, name: "TravelSafe Elite", country: "Australia" },
  { id: 3, name: "WanderSecure Premium", country: "United States" },
  { id: 4, name: "NomadShield Standard", country: "United Kingdom" },
  { id: 5, name: "AsiaProtect Gold", country: "Thailand" },
];

type CountryPlansMap = {
  [country: string]: string[];
};

const countryPlans: CountryPlansMap = {
  Japan: ["GlobalCare Platinum"],
  Australia: ["TravelSafe Elite"],
  "United States": ["WanderSecure Premium"],
  "United Kingdom": ["NomadShield Standard"],
  Thailand: ["AsiaProtect Gold"],
};

export default function InsuranceForm() {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [availablePlans, setAvailablePlans] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  

  useEffect(() => {
    if (selectedCountry) {
      setAvailablePlans(countryPlans[selectedCountry] || []);
      setSelectedPlan("");
    }
  }, [selectedCountry]);

  const validateDates = () => {
    const today = new Date().toISOString().split("T")[0];
    if (startDate < today) return "Start date cannot be before today.";
    if (endDate && endDate < startDate)
      return "End date cannot be before start date.";
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateDates();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    alert(
      `✅ Insurance purchased!\nCountry: ${selectedCountry}\nPlan: ${selectedPlan}\nStart: ${startDate}\nEnd: ${endDate}`
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-8">
      {/* Insurance form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination Country
          </label>
          <select
            className="w-full border rounded-lg p-2"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            required
          >
            <option value="">Select Country</option>
            {Object.keys(countryPlans).map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Insurance Plan
          </label>
          <select
            className="w-full border rounded-lg p-2"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            required
            disabled={!availablePlans.length}
          >
            <option value="">Select Plan</option>
            {availablePlans.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full border rounded-lg p-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="w-full border rounded-lg p-2"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button type="submit" className="w-full mt-2">
          Purchase Insurance
        </Button>
      </form>
    </div>
  );
}
