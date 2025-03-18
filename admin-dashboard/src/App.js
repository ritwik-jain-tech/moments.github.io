import React, { useState } from 'react';
import Login from './components/Login';
import EventList from './components/EventList';
import MomentCard from './components/MomentCard';
import MomentDetail from './components/MomentDetail';
import { fetchMoments, updateMomentStatus } from './api/moments';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [moments, setMoments] = useState([]);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  const handleLogin = (status) => {
    setIsLoggedIn(status);
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    // Fetch moments for the selected event
    fetchMoments(eventId, activeTab).then(setMoments);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (selectedEventId) {
      fetchMoments(selectedEventId, tab).then(setMoments);
    }
  };

  const handleSelectMoment = (momentId) => {
    const moment = moments.find((m) => m.moment_id === momentId);
    setSelectedMoment(moment);
  };

  const handleUpdateStatus = (momentId, status) => {
    updateMomentStatus(momentId, status).then(() => {
      setMoments((prev) =>
        prev.map((moment) =>
          moment.moment_id === momentId ? { ...moment, status } : moment
        )
      );
      setSelectedMoment(null);
    });
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      {!selectedEventId ? (
        <EventList onSelectEvent={handleSelectEvent} />
      ) : (
        <div>
          <button onClick={() => handleTabChange('pending')}>Pending</button>
          <button onClick={() => handleTabChange('approved')}>Approved</button>
          <button onClick={() => handleTabChange('rejected')}>Rejected</button>
          <div>
            {moments.map((moment) => (
              <MomentCard key={moment.moment_id} moment={moment} onSelectMoment={handleSelectMoment} />
            ))}
          </div>
        </div>
      )}
      {selectedMoment && (
        <MomentDetail moment={selectedMoment} onUpdateStatus={handleUpdateStatus} />
      )}
    </div>
  );
};

export default App;
