import { searchMarketplace } from "@/app/lib/api-client";
import MarketplaceClient from "./MarketplaceClient";

const PAGE_SIZE = 12;

interface MarketplacePageProps {
  searchParams: Promise<{
    search?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    languages?: string;
    page?: string;
    onlyMine?: string;
  }>;
}

export default async function MarketplacePage({
  searchParams,
}: MarketplacePageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const sourceLanguage = params.sourceLanguage ?? "";
  const targetLanguage = params.targetLanguage ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const onlyMine = params.onlyMine === "true";

  const { items, total } = await searchMarketplace({
    search: search || undefined,
    sourceLanguage: sourceLanguage || undefined,
    targetLanguage: targetLanguage || undefined,
    onlyMine,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <MarketplaceClient
      items={items}
      currentPage={page}
      totalPages={totalPages}
      initialSearch={search}
      initialOnlyMine={onlyMine}
      initialSourceLanguage={sourceLanguage}
      initialTargetLanguage={targetLanguage}
    />
  );
}
