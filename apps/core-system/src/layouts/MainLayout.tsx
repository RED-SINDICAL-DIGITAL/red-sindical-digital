import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <div className="flex h-screen bg-[#0F172A]">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Header />

        <main className="flex-1 overflow-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
