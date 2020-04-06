import React from "react";

const Metric = ({}) => (
  <>
    <div className="yAxis">
      <div className="yLabel interactive" title="Change y axis options">
        <span className="yLabelArrow"></span>
        <span className="yLabelText"></span>
        <span className="yLabelArrow"></span>
      </div>
    </div>
    <div className="yOptions">
      <div className="yOptionsBox">
        <h3>Metric</h3>
        <ul className="yMetricsList"></ul>
      </div>
    </div>
  </>
);

export default Metric;
