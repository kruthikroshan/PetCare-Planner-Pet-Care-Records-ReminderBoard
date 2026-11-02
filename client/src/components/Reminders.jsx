import React, { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, Search } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Reminders = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [careType, setCareType] = useState("All");
    const [status, setStatus] = useState("All");
    const [dateFilter, setDateFilter] = useState("");

    useEffect(() => {
        const loadReminders = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(`${API}/care-records/upcoming`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Unable to load reminders.");
                }

                const data = await response.json();
                setRecords(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadReminders();
    }, []);

    const careTypes = [
        "All",
        "Vaccination",
        "Grooming",
        "Appointment",
        "Medication",
        "Other",
    ];

    const filteredRecords = useMemo(() => {
        console.log("Reminder records:", records);
        console.log("Selected status:", status);
        const today = new Date();
        const todayString =
            `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        return records.filter((record) => {
            const petName = record.petId?.name || "";
            const title = record.title || "";

            const searchText = search.toLowerCase();

            const matchesSearch =
                title.toLowerCase().includes(searchText) ||
                petName.toLowerCase().includes(searchText);

            const matchesCareType =
                careType === "All" || record.careType === careType;

            const dueDate = record.nextDueDate
                ? new Date(record.nextDueDate).toISOString().slice(0, 10)
                : "";

            const isOverdue = dueDate !== "" && dueDate < todayString;
            const isUpcoming = dueDate !== "" && dueDate >= todayString;

            const matchesStatus =
                status === "All" ||
                record.status?.toLowerCase() === status.toLowerCase();

            const matchesDate =
                !dateFilter || dueDate === dateFilter;

            return (
                matchesSearch &&
                matchesCareType &&
                matchesStatus &&
                matchesDate
            );
        });
    }, [records, search, careType, status, dateFilter]);

    const upcomingCount = records.filter(
        (record) => record.status === "upcoming"
    ).length;

    const overdueCount = records.filter(
        (record) => record.status === "overdue"
    ).length;

    if (loading) {
        return <div className="empty compact">Loading reminders...</div>;
    }

    return (
        <section className="reminders-page">
            <div className="section-heading">
                <div>
                    <span className="eyebrow">STAY ON TOP OF THEIR CARE</span>
                    <h2>Care reminders</h2>
                </div>
                <Bell size={24} />
            </div>

            <div className="stat-grid">
                <div className="stat green">
                    <div className="stat-icon">
                        <CalendarDays />
                    </div>
                    <div>
                        <strong>{upcomingCount}</strong>
                        <span>Upcoming</span>
                    </div>
                </div>

                <div className="stat rose">
                    <div className="stat-icon">
                        <Bell />
                    </div>
                    <div>
                        <strong>{overdueCount}</strong>
                        <span>Overdue</span>
                    </div>
                </div>
            </div>

            <div className="reminders-filters">
                <div className="search">
                    <Search size={17} />
                    <input
                        placeholder="Search pet or care title..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>

                <select value={careType} onChange={(event) => setCareType(event.target.value)}>
                    {careTypes.map((type) => (
                        <option key={type} value={type}>
                            {type === "All" ? "All care types" : type}
                        </option>
                    ))}
                </select>

                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="All">All statuses</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="overdue">Overdue</option>
                </select>

                <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                />
            </div>

            {error && <div className="error">{error}</div>}

            <div className="reminder-list">
                {filteredRecords.map((record) => (
                    <article className="reminder" key={record._id}>
                        <div className={`reminder-date ${record.status}`}>
                            <strong>{new Date(record.nextDueDate).getDate()}</strong>
                            <small>
                                {new Date(record.nextDueDate).toLocaleString("en", {
                                    month: "short",
                                })}
                            </small>
                        </div>

                        <div>
                            <strong>{record.title}</strong>
                            <p>
                                {record.petId?.name || "Your pet"} · {record.careType}
                            </p>
                        </div>

                        <span className={`pill ${record.status}`}>
                            {record.status}
                        </span>
                    </article>
                ))}

                {!error && filteredRecords.length === 0 && (
                    <div className="empty compact">
                        <Bell size={28} />
                        <h3>No reminders found</h3>
                        <p>Try changing your search or filters.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Reminders;