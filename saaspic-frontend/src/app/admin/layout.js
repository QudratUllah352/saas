import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import "./admin-ui.css";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s | SaaSpin Admin",
  },

  robots: {
    index: false,
    follow: false,
    nocache: true,

    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({
  children,
}) {
  return (
    <AdminGuard>
      <AdminShell>
        {children}
      </AdminShell>
    </AdminGuard>
  );
}
