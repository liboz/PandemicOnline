import { FC, PropsWithChildren } from "react";

import "./Sidebar.css";

interface SidebarProps extends PropsWithChildren<{}> {
  showSidebar: boolean;
  hideSidebar: () => void;
}

const Sidebar: FC<SidebarProps> = (props: SidebarProps) => {
  const { showSidebar, children, hideSidebar } = props;
  return (
    <>
      {showSidebar && (
        <div className="sidenav-overlay" onClick={hideSidebar}></div>
      )}
      <div className={`sidenav ${showSidebar ? "slide-in" : "slide-out"}`}>
        {children}
      </div>
    </>
  );
};

export default Sidebar;
