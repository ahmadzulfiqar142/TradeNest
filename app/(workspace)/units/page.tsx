import { createClient } from "@/supabase/server";

export default async function UnitsPage() {
  const supabase = await createClient();
  const { data: units } = await supabase.from("units").select("id, name, symbol, type").order("name");
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Units</h1><p className="text-muted-foreground">Global units available for product conversion and pricing.</p></div><div className="rounded-lg border bg-card"><ul className="divide-y">{units?.map((unit) => <li key={unit.id} className="flex items-center justify-between p-4"><span className="font-medium">{unit.name} ({unit.symbol})</span><span className="text-sm capitalize text-muted-foreground">{unit.type}</span></li>)}{!units?.length && <li className="p-8 text-center text-muted-foreground">No units found. Apply the product-master migration to seed standard units.</li>}</ul></div></div>;
}
