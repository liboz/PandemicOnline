import { FC, PropsWithChildren } from "react";

import "./Sidebar.css";

interface SidebarProps extends PropsWithChildren<{}> {
  showSidebar: boolean;
}

const Sidebar: FC<SidebarProps> = (props: SidebarProps) => {
  const { showSidebar, children } = props;
  if (showSidebar) {
    return <div className="sidenav">{children}</div>;
  } else {
    return null;
  }
};

export default Sidebar;
