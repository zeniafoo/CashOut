"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencySelector } from "@/components/currency-selector"
import { ArrowDownUp, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { exchangeCurrency, getExchangeRate, getCurrentUserId } from "@/lib/api/exchange"

export function ExchangeForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("SGD");
  const [toCurrency, setToCurrency] = useState("USD");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentRate, setCurrentRate] = useState<number>(0);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [wasBackendUpdate, setWasBackendUpdate] = useState(false);
  const [confirmedSummary, setConfirmedSummary] = useState<{
    convertedAmount: string;
    usedRate: number;
    from: string;
    to: string;
    fromAmount: string;
  } | null>(null);

  useEffect(() => {
    if (isSuccess) {
      const timerId = setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
      return () => clearTimeout(timerId);
    }
  }, [isSuccess, router]);

  useEffect(() => {
    const fetchRate = async () => {
      if (fromCurrency && toCurrency) {
        try {
          console.log(`Fetching rate for ${fromCurrency} to ${toCurrency}`);
          const rate = await getExchangeRate(fromCurrency, toCurrency);
          console.log(`Received rate: ${rate}`);
          setCurrentRate(rate);
        } catch (error) {
          console.error('Failed to fetch exchange rate:', error);
        }
      }
    };
    fetchRate();
    // Reset backend update flag when currencies change
    setWasBackendUpdate(false);
    setConfirmedSummary(null);
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    console.log(`Amount calculation: fromAmount=${fromAmount}, currentRate=${currentRate}, wasBackendUpdate=${wasBackendUpdate}`);
    if (!wasBackendUpdate && fromAmount && currentRate > 0) {
      const calculated = (Number.parseFloat(fromAmount) * currentRate).toFixed(2);
      console.log(`Setting toAmount to: ${calculated}`);
      setToAmount(calculated);
    } else if (!wasBackendUpdate && !fromAmount) {
      console.log('Clearing toAmount');
      setToAmount("");
    }
  }, [fromAmount, currentRate, wasBackendUpdate]);

  const onChangeFromAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromAmount(e.target.value);
    setWasBackendUpdate(false);
    setConfirmedSummary(null);
    setError(""); // Clear any previous errors
    setIsSuccess(false); // Reset success state
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    setWasBackendUpdate(false);
    setConfirmedSummary(null);
    setError(""); // Clear any previous errors
    setIsSuccess(false); // Reset success state
  };

  // Add handlers for currency changes
  const handleFromCurrencyChange = (currency: string) => {
    setFromCurrency(currency);
    setWasBackendUpdate(false);
    setConfirmedSummary(null);
    setError("");
    setIsSuccess(false);
  };

  const handleToCurrencyChange = (currency: string) => {
    setToCurrency(currency);
    setWasBackendUpdate(false);
    setConfirmedSummary(null);
    setError("");
    setIsSuccess(false);
  };

  const handleExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    if (fromCurrency === toCurrency) {
      setError("Cannot exchange to the same currency");
      toast({
        title: "Invalid Exchange",
        description: "Please select different currencies",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    try {
      const userId = getCurrentUserId();
      const result = await exchangeCurrency(
        userId,
        fromCurrency,
        toCurrency,
        Number.parseFloat(fromAmount)
      );
      if (result.Success) {
        setIsSuccess(true);
        setTransactionId(Number(result.TransactionId));
        setToAmount(result.ConvertedAmount.toFixed(2));
        // If backend sends the rate used, update it:
        if (result.UsedExchangeRate) {
          setCurrentRate(result.UsedExchangeRate);
        }
        setConfirmedSummary({
          convertedAmount: result.ConvertedAmount.toFixed(2),
          usedRate: result.UsedExchangeRate || currentRate,
          from: fromCurrency,
          to: toCurrency,
          fromAmount: fromAmount
        });
        setWasBackendUpdate(true);
        toast({
          title: "Exchange Successful!",
          description: `Exchanged ${fromCurrency} ${fromAmount} to ${toCurrency} ${result.ConvertedAmount.toFixed(2)}`,
        });
      } else {
        setError(result.ErrorMessage || "Exchange failed. Please try again.");
        toast({
          title: "Exchange Failed",
          description: result.ErrorMessage,
          variant: "destructive"
        });
        setWasBackendUpdate(false);
        setConfirmedSummary(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to process exchange. Please try again.",
        variant: "destructive"
      });
      setWasBackendUpdate(false);
      setConfirmedSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  // UI rendering
  if (isSuccess && confirmedSummary) {
    return (
      <Card className="border-2">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Exchange Successful!</h2>
          <p className="text-muted-foreground mb-2">
            You exchanged {confirmedSummary.from} {confirmedSummary.fromAmount}
          </p>
          <p className="text-lg font-semibold text-primary mb-6">
            Received {confirmedSummary.to} {confirmedSummary.convertedAmount}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-semibold">Confirmed Rate:</span> 1 {confirmedSummary.from} = {confirmedSummary.usedRate.toFixed(4)} {confirmedSummary.to}
          </p>
          {transactionId && (
            <p className="text-sm text-muted-foreground mb-2">
              Transaction ID: {transactionId}
            </p>
          )}
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Exchange Currency</CardTitle>
        <CardDescription>Convert your money between different currencies</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleExchange} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">Error</p>
                <p className="text-sm text-destructive/90">{error}</p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="from-amount">From</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="from-amount"
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={onChangeFromAmount}
                  required
                  min="0.01"
                  step="0.01"
                  className="h-12 text-lg"
                />
              </div>
              <CurrencySelector value={fromCurrency} onChange={handleFromCurrencyChange} variant="compact" />
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full h-12 w-12 border-2 bg-transparent"
              onClick={handleSwapCurrencies}
            >
              <ArrowDownUp className="h-5 w-5" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="to-amount">To</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="to-amount"
                  type="number"
                  placeholder="0.00"
                  value={toAmount}
                  readOnly
                  className="h-12 text-lg bg-muted"
                />
              </div>
              <CurrencySelector value={toCurrency} onChange={handleToCurrencyChange} variant="compact" />
            </div>
          </div>
          {/* Show exchange rate info (backend if available, else live) */}
          {fromAmount && currentRate > 0 && (
            <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Current Exchange Rate</span>
              </div>
              <div className="text-lg font-semibold">
                1 {fromCurrency} = {currentRate.toFixed(4)} {toCurrency}
              </div>
            </div>
          )}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Exchange Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You send</span>
              <span className="font-semibold">
                {fromCurrency} {fromAmount || "0.00"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exchange fee</span>
              <span className="font-semibold text-green-600">Free</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold">You receive</span>
                <span className="font-bold text-lg text-primary">
                  {toCurrency} {toAmount || "0.00"}
                </span>
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading || !fromAmount}>
            {isLoading ? "Processing..." : "Confirm Exchange"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}