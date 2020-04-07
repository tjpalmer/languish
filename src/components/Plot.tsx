import React from "react";

const Plot = () => (
  <div className="plot">
    <div className="plotBox">
      <canvas></canvas>
    </div>
    <div className="xAxis">
      <div className="xLabel interactive"></div>
    </div>
  </div>
);

export default Plot;
