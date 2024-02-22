import { useStore } from "@/hooks";
import { Box, Card, TablePagination, Typography } from "@mui/material"
import { DynamicColumn, EnhancedTable, TypedColumn } from "@/components";
import { AuditLog, Resource } from "@/services/types";
import { CacheResource } from "@/context/cacheKey";
import { RenderResourceItemLabel, RenderUsernameLabel } from "@/components/table-labels";


const typedCols: TypedColumn<AuditLog>[] = [
  {
    id: "user",
    align: "left",
    name: "User",
    render: ({ value, me }) => value.user && me ? <RenderUsernameLabel user={value.user} me={me} /> : null
  },
  {
    id: "resource",
    align: "left",
    name: "Resource",
    render: ({ value }) => <Typography>{value.resource}</Typography>
  },
  {
    id: "resourceIds",
    align: "left",
    name: "Resource items",
    render: ({ value }) => <>{value.resourceIds.map(id => <RenderResourceItemLabel key={id} id={id} resource={value.resource} />)}</>
  },
]
const dynamicCols: DynamicColumn<AuditLog>[] = [
  {
    id: "role",
    align: "left",
    name: "Role",
    render: ({ value }) => <Typography>{value.user?.role?.name}</Typography>
  },
]
const columns = [...typedCols, ...dynamicCols]


interface AuditLogsListTableProps {
  auditLogs: AuditLog[]
  isLoading?: boolean
  count: number
}

export function AuditLogsListTable(props: AuditLogsListTableProps) {
  const { auditLogs, count, isLoading } = props
  const { state: { auditLogFilter }, dispatch } = useStore()

  const handleChangePagination = (_: any, page: number) => {
    dispatch({
      type: "SET_AUDIT_LOG_FILTER",
      payload: {
        page: page += 1
      }
    })
  }

  const handleChangeLimit = (evt: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "SET_AUDIT_LOG_FILTER",
      payload: {
        limit: parseInt(evt.target.value, 10)
      }
    })
  }


  return (
    <Card>
      <EnhancedTable
        hideCheckbox
        hideTopActions
        refreshKey={[CacheResource.AuditLog]}
        rows={auditLogs}
        resource={Resource.AuditLog}
        isLoading={isLoading}
        columns={columns}
      />

      <Box p={2}>
        <TablePagination
          component="div"
          count={count}
          onPageChange={handleChangePagination}
          onRowsPerPageChange={handleChangeLimit}
          page={auditLogFilter?.page
            ? auditLogFilter.page - 1
            : 0}
          rowsPerPage={auditLogFilter?.limit || 10}
          rowsPerPageOptions={[5, 10, 25, 30]}
        />
      </Box>
    </Card>
  )
}

