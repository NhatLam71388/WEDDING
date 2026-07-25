import type { Metadata } from "next";
import AdminDashboard from "./AdminDashboard";
import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quản trị thiệp cưới | Ngô Nam & Nhật Mai",
  description: "Quản lý xác nhận tham dự và lời chúc đám cưới.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
