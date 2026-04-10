import { Box, type BoxProps } from "@mui/material";
import type { ElementType, PropsWithChildren } from "react";
import { type ScrollSpyOffSet, useScrollSpyContext } from ".";

interface ScrollSpyContentInterface extends BoxProps<
  ElementType,
  { component?: ElementType }
> {
  id: string;
  offset?: ScrollSpyOffSet;
}

export const ScrollSpyContent = ({
  id,
  children,
  offset,
  ...rest
}: PropsWithChildren<ScrollSpyContentInterface>) => {
  const { sectionRefs } = useScrollSpyContext();

  return (
    <Box
      id={id}
      ref={(el) => {
        sectionRefs.current[id] = { element: el as HTMLElement, offset };
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};

ScrollSpyContent.componentName = "ScrollSpyContent";
export default ScrollSpyContent;
