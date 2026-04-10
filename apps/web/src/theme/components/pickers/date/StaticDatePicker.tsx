import type { Theme } from "@mui/material";
import type { Components } from "@mui/material/styles";
import type { StaticDatePickerProps } from "@mui/x-date-pickers";
import ActionBar from "components/pickers/ActionBar";
import DatePickersToolbar from "components/pickers/DatePickersToolbar";

declare module "@mui/material/styles" {
  interface ComponentsPropsList {
    MuiStaticDatePicker: Partial<StaticDatePickerProps>;
  }

  interface Components {
    MuiStaticDatePicker?: {
      defaultProps?: Partial<StaticDatePickerProps>;
    };
  }
}

const StaticDatePicker: Components<
  Omit<Theme, "components">
>["MuiStaticDatePicker"] = {
  defaultProps: {
    slots: {
      toolbar: DatePickersToolbar,
      actionBar: ActionBar,
    },
  },
};

export default StaticDatePicker;
