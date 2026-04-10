import { TablePagination, useEventCallback } from "@mui/material";
import type { GridSlotProps } from "@mui/x-data-grid";
import type { ChangeEvent } from "react";
import DataGridPaginationAction, {
  type DataGridPaginationActionProps,
} from "./DataGridPaginationAction";
import TableLabelDisplayedRows from "./TableLabelDisplayedRows";

type BasePaginationProps = GridSlotProps["basePagination"];

type DataGridPaginationProps = BasePaginationProps &
  Omit<DataGridPaginationActionProps, keyof BasePaginationProps> & {
    showFullPagination?: boolean;
  };

const DataGridPagination = function BasePagination({
  ref,
  ...props
}: DataGridPaginationProps) {
  const {
    onRowsPerPageChange,
    showFullPagination = false,
    showAllHref,
    ...rest
  } = props;

  return (
    <TablePagination
      showFirstButton
      showLastButton
      component="div"
      ActionsComponent={(props) => (
        <DataGridPaginationAction
          showAllHref={showAllHref}
          showFullPagination={showFullPagination}
          {...props}
        />
      )}
      onRowsPerPageChange={useEventCallback(
        (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
          onRowsPerPageChange?.(Number(event.target.value));
        },
      )}
      labelDisplayedRows={TableLabelDisplayedRows}
      {...rest}
      ref={ref}
    />
  );
};

export default DataGridPagination;
