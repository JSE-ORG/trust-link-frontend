import { getDispute } from "@/lib/api";
import { DisputeDetailsClient } from "./DisputeDetailsClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DisputeDetailsPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const dispute = await getDispute(id);
    
    if (!dispute) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <nav className="flex mb-4 text-sm text-zinc-500" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <a href="/admin/disputes" className="hover:text-zinc-900 transition-colors">Disputes</a>
                </li>
                <li className="flex items-center space-x-2">
                  <span>/</span>
                  <span className="text-zinc-900 font-medium">#{id.slice(0, 8)}...</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Dispute Details</h1>
          </div>
          
          <DisputeDetailsClient dispute={dispute} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading dispute:", error);
    notFound();
  }
}
