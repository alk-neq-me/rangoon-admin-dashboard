import { useStore } from "@/hooks";
import { useGetAccessLogs } from "@/hooks/accessLog";
import { Card } from "@mui/material";
import { AccessLogsListTable } from ".";

import { INITIAL_PAGINATION } from "@/context/store";

export function AccessLogsList() {
  const { state: { accessLogFilter } } = useStore();

  // Queries
  const accessLogsQuery = useGetAccessLogs({
    filter: accessLogFilter.where,
    pagination: accessLogFilter.pagination || INITIAL_PAGINATION,
  });

  // Extraction
  const data = accessLogsQuery.try_data.ok_or_throw();

  return (
    <Card>
      <AccessLogsListTable
        isLoading={accessLogsQuery.isLoading}
        accessLogs={data?.results ?? []}
        count={data?.count ?? 0}
      />
    </Card>
  );
}
