"use client";

import { useTranslation } from "react-i18next";

import FetchErrorState, {
  getFetchErrorMessage,
} from "@/components/ui/FetchErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

import EmptyVendorState from "./EmptyVendorState";
import { useCancelEscrow } from "./useCancelEscrow";
import { useEscrowCsvExport } from "./useEscrowCsvExport";
import { useEscrowFilters } from "./useEscrowFilters";
import { useEscrowSelection } from "./useEscrowSelection";
import { useShipTracking } from "./useShipTracking";
import { useVendorEscrows } from "./useVendorEscrows";
import { useViewModePreference } from "./useViewModePreference";
import VendorBulkActionBar from "./VendorBulkActionBar";
import VendorDateFilter from "./VendorDateFilter";
import VendorEscrowCardList from "./VendorEscrowCardList";
import VendorEscrowModals from "./VendorEscrowModals";
import VendorEscrowTable from "./VendorEscrowTable";
import VendorListToolbar from "./VendorListToolbar";
import VendorNoResults from "./VendorNoResults";
import VendorPagination from "./VendorPagination";
import VendorStatusTabs from "./VendorStatusTabs";

/**
 * Props for the VendorDashboardList component.
 */
export interface VendorDashboardListProps {
  /** Indicates if the list is currently loading data. Defaults to false. */
  loading?: boolean;
}

/**
 * VendorDashboardList
 *
 * Displays a list of escrows for a vendor, allowing filtering, searching,
 * pagination, and view toggling (card vs. table), plus bulk CSV export. All
 * state lives in focused hooks and each visual section is an isolated
 * sub-component; this file only wires them together.
 *
 * @param props - Component properties.
 * @returns The rendered dashboard list.
 */
export default function VendorDashboardList({
  loading = false,
}: VendorDashboardListProps) {
  const { t } = useTranslation();

  const { escrows, setEscrows, error, setError, loadItems, retry } =
    useVendorEscrows({ errorMessage: t("dashboard.loadEscrowsError") });
  const filters = useEscrowFilters(escrows);
  const selection = useEscrowSelection(filters.filteredEscrows);
  const [viewMode, setViewMode] = useViewModePreference();
  const { handleExportCsv, handleExportSelected } = useEscrowCsvExport({
    filteredEscrows: filters.filteredEscrows,
    selectedEscrows: selection.selectedEscrows,
    selectedCount: selection.selectedCount,
    translate: t,
  });
  const cancel = useCancelEscrow({ translate: t, setEscrows, setError });
  const ship = useShipTracking({ setEscrows, reload: loadItems });

  if (error) {
    return (
      <FetchErrorState
        title={t("dashboard.loadEscrowsTitle")}
        message={getFetchErrorMessage(error, t("dashboard.loadEscrowsError"))}
        onRetry={retry}
      />
    );
  }

  if (loading || !escrows) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <Skeleton className="mb-4 h-5 w-1/3" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (escrows.length === 0) {
    return <EmptyVendorState />;
  }

  const hasFilteredResults = (filters.filteredEscrows?.length ?? 0) > 0;
  const sharedListProps = {
    paginatedEscrows: filters.paginatedEscrows,
    selectedIds: selection.selectedIds,
    onToggleSelect: selection.toggleSelectEscrow,
    onMarkShipped: ship.handleMarkShipped,
    onCancelEscrow: cancel.handleCancelEscrow,
    selectAllRef: selection.selectAllRef,
    areAllFilteredSelected: selection.areAllFilteredSelected,
    onToggleSelectAll: selection.toggleSelectAll,
    selectAllDisabled: !hasFilteredResults,
  };

  return (
    <>
      <VendorListToolbar
        escrows={escrows}
        searchQuery={filters.searchQuery}
        onSearchChange={filters.setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExportCsv={handleExportCsv}
      />

      <VendorStatusTabs
        escrows={escrows}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={filters.setStatusFilter}
      />

      <VendorDateFilter
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        onFromDateChange={filters.setFromDate}
        onToDateChange={filters.setToDate}
        onClear={filters.clearDateFilter}
      />

      {!hasFilteredResults ? (
        <VendorNoResults onReset={filters.resetFilters} />
      ) : viewMode === "card" ? (
        <VendorEscrowCardList
          {...sharedListProps}
          someFilteredSelected={selection.someFilteredSelected}
          selectedCount={selection.selectedCount}
        />
      ) : (
        <VendorEscrowTable {...sharedListProps} />
      )}

      {hasFilteredResults && filters.totalPages > 1 && (
        <VendorPagination
          currentPage={filters.currentPage}
          totalPages={filters.totalPages}
          onPrevious={filters.goToPreviousPage}
          onNext={filters.goToNextPage}
        />
      )}

      {selection.selectedCount > 0 && (
        <VendorBulkActionBar
          selectedCount={selection.selectedCount}
          onExportSelected={handleExportSelected}
          onClearSelection={selection.clearSelection}
        />
      )}

      <VendorEscrowModals
        translate={t}
        selectedEscrow={ship.selectedEscrow}
        onCloseShipModal={ship.closeShipModal}
        onShipmentSuccess={ship.handleShipmentSuccess}
        escrowToCancel={cancel.escrowToCancel}
        isCancelling={cancel.isCancelling}
        onConfirmCancel={cancel.confirmCancelEscrow}
        onCloseCancelDialog={cancel.closeCancelDialog}
      />
    </>
  );
}
