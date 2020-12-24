import { FC, ReactNode } from "react";

interface BaseSidebarProps {
  list: ReactNode[];
}

const BaseSidebarList: FC<BaseSidebarProps> = (props: BaseSidebarProps) => {
  const { list } = props;
  const reversedList = [...list].reverse();
  return (
    <div>
      Most Recent
      <ol reversed>{reversedList}</ol>
      Least Recent
    </div>
  );
};

export default BaseSidebarList;
