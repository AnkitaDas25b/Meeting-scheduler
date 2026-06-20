
import React, { useState, useEffect } from 'react';
import './App.css';

const BACKEND_URL = "https://meeting-scheduler-55rj.onrender.com";

function App() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  //if false, show the Login page; if true, show the Dashboard).
  const [spaceCode, setSpaceCode] = useState('');
  const [spaceName, setSpaceName] = useState('');
  const [currentSpace, setCurrentSpace] = useState(null);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetTime, setMeetTime] = useState('');
  const [notification, setNotification] = useState('');
  const [trackedAlerts, setTrackedAlerts] = useState({});

  
  useEffect(() => {
    if (!currentSpace || !currentSpace.code ) return;
   
    const syncInterval = setInterval(() => {
      fetch(`${BACKEND_URL}/spaces/${currentSpace.code}`)
        .then(response => {
          if (response.ok) return response.json();
         
          throw new Error("Sync failed");
        })
        .then(updatedData => {
         
          setCurrentSpace(updatedData);
        })
        .catch(err => console.log("Background sync paused:", err.message));
    }, 4000);

    return () => clearInterval(syncInterval);
    
  }, [currentSpace?.code]);

   useEffect(() => {
 
  if (!currentSpace || !currentSpace.meetings) return;

  
  const alertInterval = setInterval(() => {
    
    const now = Date.now(); // Current time in milliseconds

    
    currentSpace.meetings.forEach((meeting) => {
      
      const meetTime = new Date(meeting.startTime).getTime();
      const secondsRemaining = Math.floor((meetTime - now) / 1000);

      
      const meetingIdentifier = meeting._id || meeting.title;

      
      const alreadyAlerted = trackedAlerts[meetingIdentifier];

      
      if (secondsRemaining === 300 && !alreadyAlerted) {
        
       
        setTrackedAlerts((prev) => ({ ...prev, [meetingIdentifier]: true }));
        
       
        setNotification(`ALERT: "${meeting.title}" is starting in 5 minutes!`);
      }
    });

  }, 1000);


  return () => clearInterval(alertInterval);

}, [currentSpace, trackedAlerts]); 


  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  
  const createSpace = () => {
    if (!spaceName || !spaceCode) return alert("Fill in Space Name and Code!");
    
    fetch(`${BACKEND_URL}/spaces/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spaceName, code: spaceCode })
      
    })
      .then(response => {
        
        return response.json()
        .then(data => {
          if (!response.ok) throw new Error(data.error || "Error creating space");
          return data;
          
        });
      })
      .then(data => {
       
        setCurrentSpace(data);
        alert(`Space "${data.name}" Created!`);
      })
      .catch(err => alert(err.message));
  };


  const joinSpace = () => {
    if (!spaceCode) return alert("Enter a space code!");

    fetch(`${BACKEND_URL}/spaces/${spaceCode}`)
      .then(response => {
       
        return response.json()
        .then(data => {
          if (!response.ok) throw new Error(data.error || "Space not found");
          return data;
        });
      })
      .then(data => {
        if (data.error) {
        alert(data.error); // This will cleanly show "Space not found"
      } else {
        setCurrentSpace(data); // Only set it if it's a valid room document!
      }

      })
      .catch(err => alert(err.message));
  };

  const scheduleMeeting = (e) => {
    e.preventDefault();
    
    if (!meetTitle || !meetTime) return alert("Fill out all meeting details!");

    fetch(`${BACKEND_URL}/spaces/${currentSpace.code}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: meetTitle,
        startTime: meetTime,
        creator: username
      })
    })
      .then(response => {
        return response.json().then(data => {
          
          if (!response.ok) throw new Error(data.error || "Error scheduling meeting");
          return data;
        });
      })
      .then(data => {
        setCurrentSpace(data); 

        setMeetTitle('');     
        setMeetTime('');      // Resets calendar for next meeting
        alert("Meeting scheduled successfully");
      })
      .catch(err => alert(err.message));
  };

  if (!isLoggedIn) {
    return (
      <div className="card" style={{ marginTop: '100px', textAlign: 'center' }}>
        <h2> Welcome to Meeting Scheduler</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="Enter your name to login..." 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <header>
        <h2>Hello, {username}! </h2>
           {currentSpace && <button onClick={() => setCurrentSpace(null)}>Leave Space</button> } 
      </header> 

      {notification && (
        <div className="alert">
          <span>{notification}</span>
          <button style={{ background: '#1a2536', color: '#fff' }} onClick={() => setNotification('')}>Dismiss</button>
        </div>
      )}

      {!currentSpace ? (
        
        <div className="grid">
          <div className="card">
            <h3>Create a Meeting Space</h3>
            <form onSubmit={(e) => { e.preventDefault(); createSpace(); }}>
              <input type="text" placeholder="Space Name" onChange={e => setSpaceName(e.target.value)} required />
              <input type="text" placeholder="Unique Code" onChange={e => setSpaceCode(e.target.value)} required />
              <button type="submit">Create & Join</button>
            </form>
          </div>

          <div className="card">
            <h3>Join an Existing Space</h3>
            <form onSubmit={(e) => { e.preventDefault(); joinSpace(); }}>
              <input type="text" placeholder="Enter Space Code" onChange={e => setSpaceCode(e.target.value)} required />
              <button type="submit">Join Space</button>
            </form>
          </div>
        </div>
      ) : (
        <div>
          <div className="card">
            <h3>Space: {currentSpace.name} (Code: <span style={{color: '#00b4d8'}}>{currentSpace.code}</span>)</h3>
          </div>

          <div className="card">
            <h3>Schedule a Simple Meeting</h3>
            <form onSubmit={scheduleMeeting}>
              <input type="text" placeholder="Meeting Title" value={meetTitle} onChange={e => setMeetTitle(e.target.value)} required />
             
              <input 
                type="datetime-local" 
                // placeholder="YYYY-MM-DD (e.g., 2026-06-25 14:30)"
                value={meetTime} 
                onChange={e => setMeetTime(e.target.value)} 
                 required 
    />
              <button type="submit">Schedule Meeting</button>
            </form>
          </div>

          <div className="card">
            <h3>Reflected Calendar / Schedule</h3>
            {currentSpace.meetings.length === 0 ? <p style={{color: '#a0aec0'}}>No meetings scheduled yet.</p> : (
              <ul>
                {currentSpace.meetings.map((m, index) => (
                  <li key={m._id || index}>
                    <strong>{m.title}</strong> —  {new Date(m.startTime).toLocaleString()} (Created by: <i>{m.creator}</i>)
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;