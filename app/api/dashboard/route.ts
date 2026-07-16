import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get("scope") || "personal") as
    | "personal"
    | "business";
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7) + "-01";

  let sql;
  try {
    sql = getSql();
  } catch {
    return NextResponse.json(
      {
        error: "MISSING_DATABASE_URL",
        message:
          "Add DATABASE_URL in the Vercel project's Environment Variables (Supabase's pooled connection string, Transaction mode), then redeploy.",
      },
      { status: 500 }
    );
  }

  try {
    const [summary, budget, categories, heatmap, income] = await Promise.all([
      sql`select * from finance.v_monthly_summary where month = ${month} and scope = ${scope} limit 1`,
      sql`select * from finance.v_budget_503020 where month = ${month} and scope = ${scope}`,
      sql`select * from finance.v_category_breakdown where month = ${month} and scope = ${scope} order by spent desc limit 12`,
      sql`select * from finance.v_daily_heatmap where scope = ${scope} and dated_on >= ${month}::date and dated_on < (${month}::date + interval '1 month')`,
      sql`select * from finance.v_expected_income_monthly where scope = ${scope} limit 1`,
    ]);

    return NextResponse.json({
      summary: summary[0] || null,
      budget,
      categories,
      heatmap,
      income: income[0] || null,
      month,
      scope,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "QUERY_FAILED", message: e.message },
      { status: 500 }
    );
  }
}
