import { getHomeSections } from "@/lib/actions/appConfig";
import HomeSectionsClient from "./HomeSectionsClient";
import { LayoutDashboard } from "lucide-react";

export default async function HomeSectionsPage() {
  const sections = await getHomeSections();
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <LayoutDashboard className="w-6 h-6 text-violet-400" />
        <h1 className="text-2xl font-black text-[var(--text-primary)]">จัดการ Section หน้าแรก</h1>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        เปิด/ปิด section ที่แสดงในหน้าแรกของผู้ใช้ — มีผลทันทีหลังบันทึก
      </p>
      <HomeSectionsClient initial={sections} />
    </div>
  );
}
