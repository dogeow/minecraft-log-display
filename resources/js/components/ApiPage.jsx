import useSWR from "swr";
import { useLocation } from "react-router-dom";
import { Skeleton } from "./ui/skeleton";

function LoadingSkeleton() {
  return (
    <div className="container mx-auto space-y-4 p-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function ApiPage({ endpoint, includeSearch = false, children }) {
  const location = useLocation();
  const url = `${endpoint}${includeSearch ? location.search : ""}`;
  const { data, isLoading } = useSWR(url);

  if (isLoading || !data) return <LoadingSkeleton />;

  return children(data);
}
