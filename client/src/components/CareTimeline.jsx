import React, { useEffect, useState } from "react";
import { CalendarDays, Clock, PawPrint } from "lucide-react";


const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CareTimeline = ({ pet }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadCareHistory = async () => {
            if (!pet?._id) {
                setRecords([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const response = await fetch(`${API}/pets/${pet._id}/care-records`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Unable to load care history.");
                }

                const data = await response.json();

                const sortedRecords = data.sort(
                    (a, b) => new Date(b.eventDate) - new Date(a.eventDate)
                );

                setRecords(sortedRecords);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadCareHistory();
    }, [pet?._id]);

    if (!pet) {
        return <p className="empty compact">Select a pet to view its care history.</p>;
    }

    if (loading) {
        return <p className="empty compact">Loading care history...</p>;
    }

    if (error) {
        return <p className="error">{error}</p>;
    }

    if (!records.length) {
        return (
            <div className="empty compact">
                <PawPrint size={28} />
                <h3>No care history yet</h3>
                <p>Care records for {pet.name} will appear here.</p>
            </div>
        );
    }

    return (
        <section className="care-timeline">
            <div className="timeline-heading">
                <div>
                    <span className="eyebrow">CARE JOURNEY</span>
                    <h2>{pet.name}'s Care History</h2>
                </div>
                <CalendarDays size={22} />
            </div>

            <div className="timeline-list">
                {records.map((record) => (
                    <article className="timeline-item" key={record._id}>
                        <div className="timeline-marker">
                            <span />
                        </div>

                        <div className="timeline-card">
                            <div className="timeline-date">
                                <Clock size={14} />
                                {new Date(record.eventDate).toLocaleDateString(undefined, {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </div>

                            <h3>{record.title}</h3>
                            <span className="pill">{record.careType}</span>

                            {record.notes && <p>{record.notes}</p>}

                            {record.nextDueDate && (
                                <div className="timeline-next-due">
                                    Next due:{" "}
                                    {new Date(record.nextDueDate).toLocaleDateString(undefined, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </div>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default CareTimeline;