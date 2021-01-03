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
              File an issue describing the bug on{" "}
              <a href="https://github.com/liboz/PandemicOnline">Github</a>.
              Please include the log of the relevant game
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
            <li>
              Permission to move pawns is not needed for dispatcher/airlift
            </li>
            <li>
              Event cards cannot be played during the draw card, epidemic,
              infection, or outbreak phase
            </li>
            <li>Contingency Planner role does not exist</li>
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default Faq;
