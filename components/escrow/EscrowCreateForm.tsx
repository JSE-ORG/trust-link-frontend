// "use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

import { createEscrow, EscrowInput, EscrowResponse } from "@/lib/api";
import QRCode from "qrcode.react";

const shippingOptions = [
  "Same day",
  "1‑3 days",
  "1 week",
  "Custom",
];

const formSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  priceUSDC: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number",
  }),
  description: z.string().min(1, "Description is required"),
  shippingWindow: z.enum([
    "Same day",
    "1‑3 days",
    "1 week",
    "Custom",
  ]),
});

type FormValues = z.infer<typeof formSchema>;

export default function EscrowCreateForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: "",
      priceUSDC: "",
      description: "",
      shippingWindow: shippingOptions[0],
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload: EscrowInput = {
        itemName: values.itemName,
        priceUSDC: values.priceUSDC,
        description: values.description,
        shippingWindow: values.shippingWindow,
      };
      const data: EscrowResponse = await createEscrow(payload);
      setResultUrl(data.url);
      toast.success("Escrow link created!");
    } catch (e: any) {
      setError(e?.message ?? "Unexpected error");
      toast.error("Failed to create escrow");
    } finally {
      setIsSubmitting(false);
    }
  }

  const copyToClipboard = async () => {
    if (!resultUrl) return;
    await navigator.clipboard.writeText(resultUrl);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="itemName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item name</FormLabel>
                <FormControl>
                  <Input placeholder="Awesome Widget" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priceUSDC"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (USDC)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="123.45" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Brief description" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shippingWindow"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping window</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shipping window" />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating link…
              </>
            ) : (
              "Create escrow link"
            )}
          </Button>
        </form>
      </Form>

      {resultUrl && (
        <div className="mt-6 p-4 border border-border rounded-lg bg-background shadow-lg">
          <h3 className="text-lg font-medium mb-2 text-foreground">Your Escrow Link</h3>
          <div className="flex items-center space-x-2">
            <Input readOnly value={resultUrl} className="flex-1 bg-muted-bg text-foreground border-border" />
            <Button onClick={copyToClipboard} variant="outline" size="icon" className="border-border text-foreground hover:bg-muted-bg">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 flex justify-center bg-white p-4 rounded-xl">
            <QRCode value={resultUrl} size={180} />
          </div>
        </div>
      )}
    </div>
  );
}
