import React, { FC } from "react";

import "./Faq.css";

const Faq: FC = () => {
  return (
    <div id="faq">
      <ul>
        <li>
          I noticed a bug and want to report it{" "}
          <ul>
            <li>
              Fill an issue on{" "}
              <a href="https://github.com/liboz/PandemicOnline">Github</a>
            </li>
          </ul>
        </li>
        <li>
          What are the rules?
          <ul>
            <li>
              <a href="https://kentfreelibrary.org/wp-content/uploads/2018/10/Pandemic.pdf">
                Here's
              </a>{" "}
              a copy of the rules
            </li>
          </ul>
        </li>
        <li>
          What are some differences between the actual game and this
          implementation?
          <ul>
            Some of the notable differences are:
            <li>Dispatcher does not need permission to move pawns</li>
            <li>Event cards are not implemented</li>
            <li>Contingency Planner role does not exist</li>
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default Faq;
