import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Calendar, Users, MapPin, Clock, PlusCircle, CheckCircle, LayoutGrid } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import CalendarGrid from '../components/CalendarGrid';

export default function Home() {
    const [events, setEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [myClubs, setMyClubs] = useState([]);
    const [activeTab, setActiveTab] = useState('feed');
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loadingClubs, setLoadingClubs] = useState(false);
    const [showPersonalized, setShowPersonalized] = useState(false);

    const eventToAddRef = useRef(null);
    const [addingEventId, setAddingEventId] = useState(null);
    const userToken = localStorage.getItem('token');

    // Fetch ALL events (default view)
    const fetchAllEvents = async () => {
        setLoadingEvents(true);
        try {
            const res = await axios.get('http://localhost:5000/api/events', {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setAllEvents(res.data);
            if (!showPersonalized) setEvents(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingEvents(false);
        }
    };

    // Fetch personalized events (when user follows clubs)
    const fetchPersonalizedEvents = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/events/personalized', {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setEvents(res.data);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
    };

    const fetchAllClubs = async () => {
        setLoadingClubs(true);
        try {
            const res = await axios.get('http://localhost:5000/api/clubs');
            setClubs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingClubs(false);
        }
    };

    const fetchMyClubs = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/clubs/my-clubs', {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setMyClubs(res.data.map(c => c.id));
        } catch (err) {
            console.error(err);
        }
    };

    const toggleFollow = async (clubId) => {
        try {
            const res = await axios.post(`http://localhost:5000/api/clubs/${clubId}/follow`, {}, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            if (res.data.followed) {
                setMyClubs([...myClubs, clubId]);
            } else {
                setMyClubs(myClubs.filter(id => id !== clubId));
            }
            if (showPersonalized) fetchPersonalizedEvents();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleFeedMode = () => {
        const next = !showPersonalized;
        setShowPersonalized(next);
        if (next) {
            fetchPersonalizedEvents();
        } else {
            setEvents(allEvents);
        }
    };

    const googleLogin = useGoogleLogin({
        scope: 'https://www.googleapis.com/auth/calendar.events',
        onSuccess: async (tokenResponse) => {
            const eventToAdd = eventToAddRef.current;
            if (!eventToAdd) return;
            setAddingEventId(eventToAdd.id);
            try {
                const startDateTime = new Date(eventToAdd.date);
                const gEvent = {
                    summary: eventToAdd.title,
                    description: eventToAdd.description || '',
                    location: eventToAdd.venue || '',
                    start: {
                        dateTime: startDateTime.toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
                    },
                    end: {
                        dateTime: new Date(startDateTime.getTime() + 60 * 60 * 1000).toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
                    }
                };
                await axios.post('https://www.googleapis.com/calendar/v3/calendars/primary/events', gEvent, {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                alert('Event added to your Google Calendar!');
            } catch (error) {
                alert('Failed to add event to Google Calendar');
            } finally {
                setAddingEventId(null);
                eventToAddRef.current = null;
            }
        },
        onError: () => alert('Google Sign-In Failed')
    });

    const handleAddToCalendar = (event) => {
        eventToAddRef.current = event;
        googleLogin();
    };

    useEffect(() => {
        fetchAllEvents();
        fetchMyClubs();
    }, []);

    useEffect(() => {
        if (activeTab === 'clubs') {
            fetchAllClubs();
        }
    }, [activeTab]);

    // Skeleton loader
    const EventSkeleton = () => (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '14px' }}>
            <div className="skeleton" style={{ height: '20px', width: '30%', marginBottom: '10px' }} />
            <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: '14px' }} />
            <div className="skeleton" style={{ height: '16px', width: '90%', marginBottom: '6px' }} />
            <div className="skeleton" style={{ height: '16px', width: '70%' }} />
        </div>
    );

    return (
        <div style={{ padding: '0 4px' }}>
            {/* Tabs */}
            <div className="tabs-container">
                <button onClick={() => setActiveTab('feed')} className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}>
                    <Calendar size={17} /> Event Feed
                </button>
                <button onClick={() => setActiveTab('calendar')} className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}>
                    <LayoutGrid size={17} /> Calendar View
                </button>
                <button onClick={() => setActiveTab('clubs')} className={`tab-btn ${activeTab === 'clubs' ? 'active' : ''}`}>
                    <Users size={17} /> Clubs
                </button>
            </div>

            <div className="tab-content">
                {/* FEED TAB */}
                {activeTab === 'feed' && (
                    <div>
                        <div className="feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 className="text-gradient">
                                    {showPersonalized ? 'Your Personalized Feed' : 'All Campus Events'}
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                                    {showPersonalized
                                        ? 'Events from clubs you follow'
                                        : `${allEvents.length} upcoming events across all clubs`}
                                </p>
                            </div>
                            {myClubs.length > 0 && (
                                <button
                                    onClick={toggleFeedMode}
                                    className="btn-secondary"
                                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                                >
                                    {showPersonalized ? '🌐 Show All' : '⭐ My Feed'}
                                </button>
                            )}
                        </div>

                        {loadingEvents ? (
                            <div>{[1, 2, 3].map(i => <EventSkeleton key={i} />)}</div>
                        ) : events.length === 0 ? (
                            <div className="glass-panel empty-state">
                                <div className="empty-state-icon">📅</div>
                                <h3>{showPersonalized ? 'No events from your clubs' : 'No events yet'}</h3>
                                <p>
                                    {showPersonalized
                                        ? 'The clubs you follow haven\'t posted events yet.'
                                        : 'No events have been added yet. Check back later or ask an admin to add some.'}
                                </p>
                                {showPersonalized && (
                                    <button onClick={toggleFeedMode} className="btn-primary" style={{ maxWidth: '200px', margin: '0 auto' }}>
                                        View All Events
                                    </button>
                                )}
                                {!showPersonalized && (
                                    <button onClick={() => setActiveTab('clubs')} className="btn-primary" style={{ maxWidth: '220px', margin: '0 auto' }}>
                                        Explore Clubs
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="events-list">
                                {events.map((event) => (
                                    <div key={event.id} className="event-card glass-panel">
                                        <div className="event-card-header">
                                            <div>
                                                <span className="club-badge">{event.club?.name || 'NITK'}</span>
                                                <h3 className="event-title">{event.title}</h3>
                                            </div>
                                            <div className="event-date">
                                                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>

                                        <p className="event-desc">{event.description}</p>

                                        <div className="event-meta">
                                            <div className="meta-item"><Clock size={14} /> {event.time}</div>
                                            <div className="meta-item"><MapPin size={14} /> {event.venue}</div>
                                            {event.eligibility && (
                                                <div className="meta-item">👥 {event.eligibility}</div>
                                            )}
                                        </div>

                                        <div className="event-actions">
                                            {event.registrationLink && (
                                                <a href={event.registrationLink} target="_blank" rel="noopener noreferrer"
                                                    className="btn-primary" style={{ width: 'auto', display: 'inline-flex', padding: '9px 18px', textDecoration: 'none' }}>
                                                    Register Now
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleAddToCalendar(event)}
                                                disabled={addingEventId === event.id}
                                                className="btn-secondary"
                                            >
                                                <Calendar size={15} />
                                                {addingEventId === event.id ? 'Adding...' : 'Add to Calendar'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* CALENDAR TAB */}
                {activeTab === 'calendar' && (
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        {loadingEvents ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                Loading calendar...
                            </div>
                        ) : (
                            <CalendarGrid events={allEvents} />
                        )}
                    </div>
                )}

                {/* CLUBS TAB */}
                {activeTab === 'clubs' && (
                    <div>
                        <div className="feed-header">
                            <h2 className="text-gradient">Campus Clubs</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                                Follow clubs to get personalized events in your feed
                            </p>
                        </div>

                        {loadingClubs ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '14px' }} />
                                ))}
                            </div>
                        ) : clubs.length === 0 ? (
                            <div className="glass-panel empty-state">
                                <div className="empty-state-icon">🏛️</div>
                                <h3>No clubs registered yet</h3>
                                <p>Ask an admin to register clubs so events start showing up here.</p>
                            </div>
                        ) : (
                            <div className="clubs-grid">
                                {clubs.map(club => {
                                    const isFollowing = myClubs.includes(club.id);
                                    return (
                                        <div key={club.id} className="club-card glass-panel">
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                                <div className="club-avatar">{club.name.charAt(0)}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {club.name}
                                                    </h4>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                                        @{club.handle}
                                                        {club.description && ` · ${club.description}`}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleFollow(club.id)}
                                                style={{ flexShrink: 0, marginLeft: '10px' }}
                                                className={`btn-follow ${isFollowing ? 'following' : 'unfollowed'}`}
                                            >
                                                {isFollowing
                                                    ? <><CheckCircle size={14} /> Following</>
                                                    : <><PlusCircle size={14} /> Follow</>}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
