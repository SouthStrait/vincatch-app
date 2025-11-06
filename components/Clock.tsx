import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <p className="text-xs text-neutral-500 text-right">
      {date.toLocaleTimeString()}
    </p>
  );
};

export default Clock;