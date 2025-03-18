import React, { useState, useEffect } from 'react';
import MomentCard from './MomentCard';

const EventList = ({ onSelectEvent }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Fetch events data (use the API URL)
    fetch('/events/get')
      .then((response) => response.json())
      .then((data) => setEvents(data));
  }, []);

  return (
    <div>
      {events.map((event) => (
        <div key={event.event_id} onClick={() => onSelectEvent(event.event_id)}>
          <h2>{event.event_heading}</h2>
          <img src={event.event_bg_image} alt={event.event_heading} />
        </div>
      ))}
    </div>
  );
};

export default EventList;
