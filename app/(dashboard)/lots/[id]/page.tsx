"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { calculateCharges, formatCurrency, PAYMENT_METHODS } from "@/lib/calc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftIcon, Loader2Icon, PrinterIcon, CheckCircleIcon } from "lucide-react";

interface LotDetail {
  id: string;
  lotNumber: string;
  date: string;
  season: string;
  cropType: string;
  variety: string | null;
  grossWeight: number;
  deductions: number;
  netWeight: number;
  noOfBags: number;
  bagType: string;
  qualityGrade: string;
  arhatiyaMode: string;
  status: string;
  notes: string | null;
  farmer: {
    id: string;
    name: string;
    village: string;
    tehsil: string | null;
    mobile: string | null;
    bankAccount: string | null;
    bankName: string | null;
  };
  sale: {
    id: string;
    traderId: string;
    ratePerQuintal: number;
    grossAmount: number;
    marketFee: number;
    rdf: number;
    commission: number;
    labourCharges: number;
    gunnyBagCharges: number;
    otherDeductions: number;
    netFarmerAmount: number;
    buyerTotalAmount: number;
    buyerPaid: boolean;
    trader: { id: string; name: string; firmName: string | null };
  } | null;
  settlement: {
    id: string;
    grossFarmerAmount: number;
    loanDeductions: number;
    otherDeductions: number;
    netPayable: number;
    paymentMethod: string | null;
    paymentRef: string | null;
    paidOn: string | null;
  } | null;
}

interface Trader {
  id: string;
  name: string;
  firmName: string | null;
}

interface Settings {
  commission_rate?: string;
  market_fee_rate?: string;
  rdf_rate?: string;
  labour_rate?: string;
}

// Sale Form
const saleSchema = z.object({
  traderId: z.string().min(1, "Trader is required"),
  ratePerQuintal: z.coerce.number().positive("Rate must be positive"),
  labourCharges: z.coerce.number().min(0).default(0),
  gunnyBagCharges: z.coerce.number().min(0).default(0),
  otherDeductions: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});
type SaleForm = z.infer<typeof saleSchema>;

// Settlement Form
const settlementSchema = z.object({
  loanDeductions: z.coerce.number().min(0).default(0),
  otherDeductions: z.coerce.number().min(0).default(0),
  paymentMethod: z.string().min(1, "Payment method required"),
  paymentRef: z.string().optional(),
});
type SettlementForm = z.infer<typeof settlementSchema>;

function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING") return <Badge variant="secondary">Pending</Badge>;
  if (status === "SOLD") return <Badge variant="outline">Sold</Badge>;
  if (status === "SETTLED") return <Badge>Settled</Badge>;
  return <Badge variant="ghost">{status}</Badge>;
}

function StepIndicator({ step, current }: { step: number; current: number }) {
  const done = step < current;
  const active = step === current;
  return (
    <div
      className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
        done
          ? "bg-primary text-primary-foreground"
          : active
          ? "bg-primary/20 text-primary ring-2 ring-primary"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {done ? <CheckCircleIcon className="size-4" /> : step}
    </div>
  );
}

export default function LotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [lot, setLot] = useState<LotDetail | null>(null);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saleLoading, setSaleLoading] = useState(false);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const fetchLot = useCallback(async () => {
    if (!id) return;
    try {
      const [lotRes, tradersRes, settingsRes] = await Promise.all([
        fetch(`/api/lots/${id}`),
        fetch("/api/traders"),
        fetch("/api/settings"),
      ]);
      const [lotData, tradersData, settingsData] = await Promise.all([
        lotRes.json(),
        tradersRes.json(),
        settingsRes.json(),
      ]);
      setLot(lotData);
      setTraders(tradersData);
      setSettings(settingsData);
    } catch {
      toast.error("Failed to load lot");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchLot(); }, [fetchLot]);

  // Sale form
  const saleForm = useForm<SaleForm>({ resolver: zodResolver(saleSchema) as Resolver<SaleForm>, defaultValues: { labourCharges: 0, gunnyBagCharges: 0, otherDeductions: 0 } });
  const ratePerQuintal = saleForm.watch("ratePerQuintal") ?? 0;
  const labourCharges = saleForm.watch("labourCharges") ?? 0;
  const gunnyBagCharges = saleForm.watch("gunnyBagCharges") ?? 0;
  const otherDeductionsSale = saleForm.watch("otherDeductions") ?? 0;

  const salePreview = lot
    ? calculateCharges({
        netWeight: lot.netWeight,
        ratePerQuintal: Number(ratePerQuintal) || 0,
        commissionRate: Number(settings.commission_rate ?? 2.5),
        marketFeeRate: Number(settings.market_fee_rate ?? 2),
        rdfRate: Number(settings.rdf_rate ?? 2),
        labourCharges: Number(labourCharges) || 0,
        gunnyBagCharges: Number(gunnyBagCharges) || 0,
        otherDeductions: Number(otherDeductionsSale) || 0,
      })
    : null;

  const onSaleSubmit = async (data: SaleForm) => {
    if (!lot) return;
    setSaleLoading(true);
    try {
      const res = await fetch(`/api/lots/${lot.id}/sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          commissionRate: Number(settings.commission_rate ?? 2.5),
          marketFeeRate: Number(settings.market_fee_rate ?? 2),
          rdfRate: Number(settings.rdf_rate ?? 2),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Sale recorded successfully");
      fetchLot();
    } catch {
      toast.error("Failed to record sale");
    } finally {
      setSaleLoading(false);
    }
  };

  // Settlement form
  const settlementForm = useForm<SettlementForm>({
    resolver: zodResolver(settlementSchema) as Resolver<SettlementForm>,
    defaultValues: { loanDeductions: 0, otherDeductions: 0 },
  });
  const loanDeductions = settlementForm.watch("loanDeductions") ?? 0;
  const settlementOtherDed = settlementForm.watch("otherDeductions") ?? 0;
  const grossFarmerAmount = lot?.sale?.netFarmerAmount ?? 0;
  const netPayable = Math.max(0, grossFarmerAmount - Number(loanDeductions) - Number(settlementOtherDed));

  const onSettlementSubmit = async (data: SettlementForm) => {
    if (!lot) return;
    setSettlementLoading(true);
    try {
      const res = await fetch(`/api/lots/${lot.id}/settlement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, grossFarmerAmount }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settlement completed!");
      fetchLot();
    } catch {
      toast.error("Failed to record settlement");
    } finally {
      setSettlementLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Lot not found.{" "}
        <Link href="/lots" className="text-primary hover:underline">Back to lots</Link>
      </div>
    );
  }

  const currentStep = lot.status === "PENDING" ? 1 : lot.status === "SOLD" ? 2 : 3;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 print:hidden">
        <Link href="/lots" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}><ArrowLeftIcon /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold font-mono">{lot.lotNumber}</h1>
            <StatusBadge status={lot.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(lot.date), "dd MMMM yyyy")} — Season: {lot.season}
          </p>
        </div>
        {(lot.status === "SOLD" || lot.status === "SETTLED") && id && (
          <div className="flex gap-2">
            <a
              href={`/print/form-j/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <PrinterIcon />
              Form-J
            </a>
            <a
              href={`/print/form-i/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <PrinterIcon />
              Form-I
            </a>
          </div>
        )}
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2 print:hidden">
        <StepIndicator step={1} current={currentStep} />
        <div className={`flex-1 h-0.5 ${currentStep > 1 ? "bg-primary" : "bg-muted"}`} />
        <StepIndicator step={2} current={currentStep} />
        <div className={`flex-1 h-0.5 ${currentStep > 2 ? "bg-primary" : "bg-muted"}`} />
        <StepIndicator step={3} current={currentStep} />
        <div className="ml-2 text-xs text-muted-foreground">
          {currentStep === 1 ? "Step 1: Record Lot" : currentStep === 2 ? "Step 2: Record Sale" : "Step 3: Settled"}
        </div>
      </div>

      {/* Lot Info */}
      <Card>
        <CardHeader>
          <CardTitle>Lot Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Farmer</p>
            <Link href={`/farmers/${lot.farmer.id}`} className="font-medium text-primary hover:underline">
              {lot.farmer.name}
            </Link>
          </div>
          <div>
            <p className="text-muted-foreground">Village</p>
            <p className="font-medium">{lot.farmer.village}{lot.farmer.tehsil ? `, ${lot.farmer.tehsil}` : ""}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Crop</p>
            <p className="font-medium capitalize">{lot.cropType.replace(/_/g, " ")}{lot.variety ? ` (${lot.variety})` : ""}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gross Weight</p>
            <p className="font-medium">{lot.grossWeight} kg</p>
          </div>
          <div>
            <p className="text-muted-foreground">Deductions</p>
            <p className="font-medium">{lot.deductions} kg</p>
          </div>
          <div>
            <p className="text-muted-foreground">Net Weight</p>
            <p className="font-bold">{lot.netWeight} kg ({(lot.netWeight / 100).toFixed(2)} qtl)</p>
          </div>
          <div>
            <p className="text-muted-foreground">No. of Bags</p>
            <p className="font-medium">{lot.noOfBags} ({lot.bagType})</p>
          </div>
          <div>
            <p className="text-muted-foreground">Quality Grade</p>
            <p className="font-medium">{lot.qualityGrade}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Arhatiya Mode</p>
            <p className="font-medium">{lot.arhatiyaMode}</p>
          </div>
          {lot.notes && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-muted-foreground">Notes</p>
              <p className="font-medium">{lot.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Record Sale */}
      {lot.status === "PENDING" && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Record Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saleForm.handleSubmit(onSaleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>Buyer / Trader *</Label>
                  <Select
                    value={saleForm.watch("traderId") ?? ""}
                    onValueChange={(v) => saleForm.setValue("traderId", v ?? "")}
                  >
                    <SelectTrigger className="w-full" aria-invalid={!!saleForm.formState.errors.traderId}>
                      <SelectValue placeholder="Select trader" />
                    </SelectTrigger>
                    <SelectContent>
                      {traders.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}{t.firmName ? ` — ${t.firmName}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {saleForm.formState.errors.traderId && (
                    <p className="text-xs text-destructive">{saleForm.formState.errors.traderId.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Rate per Quintal (₹) *</Label>
                  <Input {...saleForm.register("ratePerQuintal")} type="number" step="0.01" />
                  {saleForm.formState.errors.ratePerQuintal && (
                    <p className="text-xs text-destructive">{saleForm.formState.errors.ratePerQuintal.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Labour Charges (₹)</Label>
                  <Input {...saleForm.register("labourCharges")} type="number" step="0.01" defaultValue={0} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gunny Bag Charges (₹)</Label>
                  <Input {...saleForm.register("gunnyBagCharges")} type="number" step="0.01" defaultValue={0} />
                </div>
                <div className="space-y-1.5">
                  <Label>Other Deductions (₹)</Label>
                  <Input {...saleForm.register("otherDeductions")} type="number" step="0.01" defaultValue={0} />
                </div>
              </div>

              {/* Charge Breakdown Preview */}
              {salePreview && Number(ratePerQuintal) > 0 && (
                <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                  <p className="font-semibold text-base">Charge Breakdown</p>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-muted-foreground">Gross Amount</span>
                    <span className="text-right font-medium">{formatCurrency(salePreview.grossAmount)}</span>
                    <span className="text-muted-foreground">Market Fee ({settings.market_fee_rate ?? 2}%)</span>
                    <span className="text-right">{formatCurrency(salePreview.marketFee)}</span>
                    <span className="text-muted-foreground">RDF ({settings.rdf_rate ?? 2}%)</span>
                    <span className="text-right">{formatCurrency(salePreview.rdf)}</span>
                    <span className="text-muted-foreground font-medium">Buyer Total</span>
                    <span className="text-right font-bold">{formatCurrency(salePreview.buyerTotalAmount)}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-muted-foreground">Commission ({settings.commission_rate ?? 2.5}%)</span>
                    <span className="text-right">{formatCurrency(salePreview.commission)}</span>
                    <span className="text-muted-foreground">Labour</span>
                    <span className="text-right">{formatCurrency(salePreview.labourCharges)}</span>
                    <span className="text-muted-foreground">Gunny Bag</span>
                    <span className="text-right">{formatCurrency(salePreview.gunnyBagCharges)}</span>
                    <span className="text-muted-foreground">Other</span>
                    <span className="text-right">{formatCurrency(salePreview.otherDeductions)}</span>
                    <span className="font-medium text-primary">Net Farmer Amount</span>
                    <span className="text-right font-bold text-primary text-base">{formatCurrency(salePreview.netFarmerAmount)}</span>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={saleLoading}>
                {saleLoading && <Loader2Icon className="animate-spin" />}
                Record Sale
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sale Info (if sold or settled) */}
      {lot.sale && (
        <Card>
          <CardHeader>
            <CardTitle>Sale Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Buyer</p>
                <p className="font-medium">
                  {lot.sale.trader.name}{lot.sale.trader.firmName ? ` — ${lot.sale.trader.firmName}` : ""}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Rate</p>
                <p className="font-medium">₹{lot.sale.ratePerQuintal} / Qtl</p>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Amount</span>
                <span className="font-medium">{formatCurrency(lot.sale.grossAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Fee</span>
                <span>{formatCurrency(lot.sale.marketFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">RDF</span>
                <span>{formatCurrency(lot.sale.rdf)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Buyer Total</span>
                <span>{formatCurrency(lot.sale.buyerTotalAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commission</span>
                <span>{formatCurrency(lot.sale.commission)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labour</span>
                <span>{formatCurrency(lot.sale.labourCharges)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gunny Bag</span>
                <span>{formatCurrency(lot.sale.gunnyBagCharges)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Other Deductions</span>
                <span>{formatCurrency(lot.sale.otherDeductions)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-primary font-bold text-base">
                <span>Net Farmer Amount</span>
                <span>{formatCurrency(lot.sale.netFarmerAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Settle with Farmer */}
      {lot.status === "SOLD" && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Settle with Farmer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={settlementForm.handleSubmit(onSettlementSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>Gross Farmer Amount</Label>
                  <Input value={formatCurrency(grossFarmerAmount)} readOnly className="bg-muted font-medium" />
                </div>
                <div className="space-y-1.5">
                  <Label>Loan Deductions (₹)</Label>
                  <Input {...settlementForm.register("loanDeductions")} type="number" step="0.01" defaultValue={0} />
                </div>
                <div className="space-y-1.5">
                  <Label>Other Deductions (₹)</Label>
                  <Input {...settlementForm.register("otherDeductions")} type="number" step="0.01" defaultValue={0} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Net Payable to Farmer</Label>
                  <Input
                    value={formatCurrency(netPayable)}
                    readOnly
                    className="bg-primary/5 font-bold text-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Method *</Label>
                  <Select
                    value={settlementForm.watch("paymentMethod") ?? ""}
                    onValueChange={(v) => settlementForm.setValue("paymentMethod", v ?? "")}
                  >
                    <SelectTrigger className="w-full" aria-invalid={!!settlementForm.formState.errors.paymentMethod}>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {settlementForm.formState.errors.paymentMethod && (
                    <p className="text-xs text-destructive">{settlementForm.formState.errors.paymentMethod.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Reference</Label>
                  <Input {...settlementForm.register("paymentRef")} placeholder="Cheque / UTR no." />
                </div>
              </div>

              <Button type="submit" disabled={settlementLoading}>
                {settlementLoading && <Loader2Icon className="animate-spin" />}
                <CheckCircleIcon />
                Mark as Settled
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Settlement Info */}
      {lot.settlement && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Settlement Details</CardTitle>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <PrinterIcon />
                Print Receipt
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Farmer Amount</span>
                <span className="font-medium">{formatCurrency(lot.settlement.grossFarmerAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan Deductions</span>
                <span>{formatCurrency(lot.settlement.loanDeductions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Other Deductions</span>
                <span>{formatCurrency(lot.settlement.otherDeductions)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-primary font-bold text-base">
                <span>Net Paid to Farmer</span>
                <span>{formatCurrency(lot.settlement.netPayable)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium">{lot.settlement.paymentMethod ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reference</p>
                <p className="font-medium">{lot.settlement.paymentRef ?? "—"}</p>
              </div>
              {lot.settlement.paidOn && (
                <div>
                  <p className="text-muted-foreground">Paid On</p>
                  <p className="font-medium">{format(new Date(lot.settlement.paidOn), "dd MMM yyyy")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Receipt */}
      {lot.status === "SETTLED" && (
        <div ref={printRef} className="hidden print:block p-6 text-sm">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">ARHATIYA PORTAL</h2>
            <p className="text-muted-foreground">Farmer Settlement Receipt</p>
            <p className="font-mono text-xs mt-1">{lot.lotNumber}</p>
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div><strong>Farmer:</strong> {lot.farmer.name}</div>
            <div><strong>Date:</strong> {format(new Date(lot.date), "dd/MM/yyyy")}</div>
            <div><strong>Village:</strong> {lot.farmer.village}</div>
            <div><strong>Season:</strong> {lot.season}</div>
            <div><strong>Crop:</strong> {lot.cropType}</div>
            <div><strong>Net Wt:</strong> {(lot.netWeight / 100).toFixed(2)} qtl</div>
          </div>
          {lot.sale && (
            <>
              <Separator className="my-3" />
              <div className="space-y-1">
                <div className="flex justify-between"><span>Gross Amount</span><span>{formatCurrency(lot.sale.grossAmount)}</span></div>
                <div className="flex justify-between"><span>Commission</span><span>- {formatCurrency(lot.sale.commission)}</span></div>
                <div className="flex justify-between"><span>Labour</span><span>- {formatCurrency(lot.sale.labourCharges)}</span></div>
              </div>
            </>
          )}
          {lot.settlement && (
            <>
              <Separator className="my-3" />
              <div className="flex justify-between font-bold text-base">
                <span>NET PAID TO FARMER</span>
                <span>{formatCurrency(lot.settlement.netPayable)}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Payment: {lot.settlement.paymentMethod} {lot.settlement.paymentRef ? `(${lot.settlement.paymentRef})` : ""}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
