import React from "react";

const DateDivider = ({ date }) => (
  <div className="flex justify-center my-4">
    <span className="bg-gray-700 text-white text-xs px-3 py-1 rounded-full">
      {date}
    </span>
  </div>
);

export default DateDivider;
