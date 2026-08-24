import { CategoryRevenueList } from "@/components/admin/analytics/category-revenue-list";
import { SalesChart } from "@/components/admin/analytics/sales-chart";
import { TrafficChart } from "@/components/admin/analytics/traffic-chart";

export default function AdminAnalyticsPage() {
  return (
    <div
      className="grid gap-6"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))" }}
    >
      <div className="lg:col-span-2">
        <SalesChart />
      </div>
      <CategoryRevenueList />
      <TrafficChart />
    </div>
  );
}
