"use client"
// ...existing code...
import dynamic from "next/dynamic";

const AdminSubmissionsPage = dynamic(() => import("./AdminSubmissionsPage"), {
  ssr: false,
});

export default function Page() {
  return <AdminSubmissionsPage />;
}
