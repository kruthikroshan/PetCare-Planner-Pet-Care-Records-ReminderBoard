import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Cat, ChevronRight, CircleUserRound, Dog, LayoutDashboard, LogOut, PawPrint, Plus, Search, ShieldCheck, Sparkles, Trash2, X } from "lucide-react";
import "./styles.css";
import CareRecordForm from "./CareRecordForm";
import AdminDashboard from "./AdminDashboard";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const emptyPet = { name: "", species: "Dog", breed: "", birthDate: "", notes: "" };
const speciesIcon = (species) => species === "Dog" ? Dog : species === "Cat" ? Cat : PawPrint;
const petImage = (species) => ({
  Dog: "https://images.unsplash.com/photo-1558788353-1d0d2f3c5f1d?auto=format&fit=crop&w=320&q=85",
  Cat: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=320&q=85",
  Bird: "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=320&q=85",
  Rabbit: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=320&q=85"
}[species] || "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=320&q=85");
const api = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}), ...(localStorage.token ? { Authorization: `Bearer ${localStorage.token}` } : {}) } });
  if (!response.ok) throw new Error((await response.json()).message || "Request failed.");
  return response.status === 204 ? null : response.json();
};

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login"); const [role, setRole] = useState("user"); const [form, setForm] = useState({ name: "", email: "", password: "" }); const [error, setError] = useState("");
  const submit = async (event) => { event.preventDefault(); setError(""); try { const data = await api(`/auth/${mode}`, { method: "POST", body: JSON.stringify({ ...form, ...(mode === "login" ? { role } : {}) }) }); localStorage.token = data.token; localStorage.user = JSON.stringify(data.user); onLogin(data.user); } catch (e) { setError(e.message); } };
  return <main className="auth-page"><section className="auth-art"><div className="brand"><PawPrint size={22} /> PetCare Planner</div><div className="art-copy"><span className="eyebrow">A calmer way to care</span><h1>Every little detail,<br /><em>right where it belongs.</em></h1><p>Keep your pet's important moments organized, from first vaccinations to their next grooming day.</p></div><div className="art-pets"><img className="art-pet-image art-pet-one" src="/pets/login-dog.png" alt="Happy dog" /><img className="art-pet-image art-pet-two" src="/pets/login-cat.png" alt="Happy cat" /></div></section><section className="auth-card"><div className="mobile-brand"><PawPrint size={22} /> PetCare Planner</div><div className="auth-heading"><span className="eyebrow">{mode === "login" ? "Welcome back" : "Get started"}</span><h2>{mode === "login" ? "Let's take care of them." : "Create your care space."}</h2><p>{mode === "login" ? "Sign in to your dashboard." : "Set up your account in a few seconds."}</p></div>{mode === "login" && <div className="login-type" role="group" aria-label="Account type"><button type="button" className={role === "user" ? "selected" : ""} onClick={() => setRole("user")}><CircleUserRound size={16} /> User login</button><button type="button" className={role === "admin" ? "selected" : ""} onClick={() => setRole("admin")}><ShieldCheck size={16} /> Admin login</button></div>}<form onSubmit={submit}>{mode === "register" && <label>Your name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>}<label>Email address<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label><label>Password<input type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>{error && <div className="error">{error}</div>}<button className="primary full">{mode === "login" ? `${role === "admin" ? "Admin" : "User"} sign in` : "Create account"} <ChevronRight size={17} /></button></form><p className="auth-switch">{mode === "login" ? "New to PetCare Planner?" : "Already have an account?"} <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></p><div className="privacy"><ShieldCheck size={16} /> Your data is private and protected.</div></section></main>;
}

function App() {
  const [user, setUser] = useState(() => localStorage.user ? JSON.parse(localStorage.user) : null);
  if (!user) return <Auth onLogin={setUser} />;
  if (user.role === "admin") return <AdminDashboard user={user} onLogout={() => { localStorage.clear(); setUser(null); }} />;
  return <Dashboard user={user} onLogout={() => { localStorage.clear(); setUser(null); }} />;
}

function Dashboard({ user, onLogout }) {
  const [view, setView] = useState("overview");
  const [pets, setPets] = useState([]);
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const [petData, recordData] = await Promise.all([api("/pets"), api("/care-records/upcoming")]);
      setPets(petData); setRecords(recordData);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => pets.filter((pet) => pet.name.toLowerCase().includes(search.toLowerCase())), [pets, search]);
  const remove = async (pet) => { if (!confirm(`Remove ${pet.name} and its records?`)) return; try { await api(`/pets/${pet._id}`, { method: "DELETE" }); setSelected(null); load(); } catch (e) { setError(e.message); } };
  const due = records.filter((record) => record.status === "upcoming").length;
  const overdue = records.filter((record) => record.status === "overdue").length;
  const nav = (nextView) => { setView(nextView); setSelected(null); setError(""); };
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><PawPrint size={21} /> PetCare Planner</div><nav>
    <button className={view === "overview" ? "active" : ""} onClick={() => nav("overview")}><LayoutDashboard size={18} /> Overview</button>
    <button className={view === "pets" ? "active" : ""} onClick={() => nav("pets")}><PawPrint size={18} /> My pets <span>{pets.length}</span></button>
    <button className={view === "calendar" ? "active" : ""} onClick={() => nav("calendar")}><CalendarDays size={18} /> Care calendar</button>
  </nav><div className="sidebar-bottom"><div className="mini-user"><CircleUserRound /><div><strong>{user.name}</strong><small>{user.email}</small></div></div><button className="logout" onClick={onLogout}><LogOut size={16} /> Sign out</button></div></aside>
  <main className="dashboard"><header className="topbar"><div><span className="eyebrow">Wednesday, October 28, 2026</span><h1>{view === "calendar" ? "Care calendar" : view === "pets" ? "My pets" : `Good morning, ${user.name.split(" ")[0]}`} <span>âœ¦</span></h1></div><div className="header-actions"><button className="icon-btn"><Bell size={19} /><i /></button><button className="avatar">{user.name[0]}</button></div></header>{error && <div className="error banner">{error}</div>}
  {view === "calendar" ? <CalendarView records={records} /> : <><section className="welcome-panel"><div><span className="eyebrow">Your care overview</span><h2>Small moments make<br /><em>happy, healthy lives.</em></h2><p>Stay on top of everything your companions need.</p><button className="primary" onClick={() => setModal({ type: "pet", pet: null })}><Plus size={17} /> Add a pet</button></div><div className="welcome-illustration"><img src="/pets/dashboard-puppy.png" alt="Happy puppy" /><span>âœ¦</span></div></section><section className="stat-grid"><Stat label="Your pets" value={pets.length} tone="peach" icon={<PawPrint />} /><Stat label="Upcoming" value={due} tone="green" icon={<CalendarDays />} /><Stat label="Needs attention" value={overdue} tone="rose" icon={<Bell />} /></section><section className="section-heading"><div><span className="eyebrow">Your companions</span><h2>Pet profiles <small>{pets.length}</small></h2></div><div className="search"><Search size={17} /><input placeholder="Search pets..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></section><section className="pet-grid">{filtered.map((pet) => <PetCard key={pet._id} pet={pet} onView={() => setSelected(pet)} />)}{!filtered.length && <div className="empty"><PawPrint size={32} /><h3>{pets.length ? "No pets match your search" : "Your pet family starts here"}</h3><p>Add a profile to keep their care details in one place.</p><button className="primary" onClick={() => setModal({ type: "pet", pet: null })}><Plus size={17} /> Add first pet</button></div>}</section><section className="section-heading upcoming-heading"><div><span className="eyebrow">Stay prepared</span><h2>Next on the calendar</h2></div><button className="text-button" onClick={() => nav("calendar")}>View calendar <ChevronRight size={16} /></button></section><ReminderList records={records} /></>}
  </main>{selected && <PetDetails pet={selected} onClose={() => setSelected(null)} onEdit={() => { setModal({ type: "pet", pet: selected }); setSelected(null); }} onDelete={() => remove(selected)} onAddRecord={() => { setModal({ type: "record", pet: selected }); setSelected(null); }} />}{modal?.type === "pet" && <PetForm pet={modal.pet} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}{modal?.type === "record" && <CareRecordForm pet={modal.pet} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}</div>;
}

function ReminderList({ records }) {
  return <div className="reminder-list">{records.slice(0, 3).map((record) => <div className="reminder" key={record._id}><div className={`reminder-date ${record.status}`}><strong>{new Date(record.nextDueDate).getDate()}</strong><small>{new Date(record.nextDueDate).toLocaleString("en", { month: "short" })}</small></div><div><strong>{record.title}</strong><p>{record.petId?.name || "Your pet"} Â· {record.careType}</p></div><span className={`pill ${record.status}`}>{record.status}</span></div>)}{!records.length && <div className="empty compact">No care reminders yet. Add a care record from a pet profile.</div>}</div>;
}

function CalendarView({ records }) {
  return <><section className="section-heading"><div><span className="eyebrow">Upcoming and overdue</span><h2>All reminders <small>{records.length}</small></h2></div></section><ReminderList records={records} /></>;
}

function Stat({ label, value, tone, icon }) { return <div className={`stat ${tone}`}><div className="stat-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>; }
function PetCard({ pet, onView }) { const Icon = speciesIcon(pet.species); return <button className="pet-card" onClick={onView}><div className={`pet-avatar ${pet.species.toLowerCase()}`}><img src={petImage(pet.species)} alt={`${pet.species} companion`} onError={(event) => { event.currentTarget.style.display = "none"; }} /><Icon className="pet-avatar-fallback" size={34} strokeWidth={1.5} /></div><div className="pet-card-main"><span className="species">{pet.species}</span><h3>{pet.name}</h3><p>{pet.breed || "Breed not added"}{pet.birthDate ? ` Â· Born ${new Date(pet.birthDate).getFullYear()}` : ""}</p></div><ChevronRight className="card-arrow" size={19} /></button>; }
function PetDetails({ pet, onClose, onEdit, onDelete, onAddRecord }) { const Icon = speciesIcon(pet.species); return <div className="overlay"><section className="details-panel"><button className="close" onClick={onClose}><X /></button><div className={`details-avatar ${pet.species.toLowerCase()}`}><img src={petImage(pet.species)} alt={`${pet.species} companion`} onError={(event) => { event.currentTarget.style.display = "none"; }} /><Icon className="pet-avatar-fallback" size={58} strokeWidth={1.3} /></div><span className="eyebrow">{pet.species} profile</span><h2>{pet.name}</h2><p className="details-breed">{pet.breed || "Breed not added"}</p><div className="details-meta"><div><small>Birth date</small><strong>{pet.birthDate ? new Date(pet.birthDate).toLocaleDateString() : "Not added"}</strong></div><div><small>Profile added</small><strong>{new Date(pet.createdAt).toLocaleDateString()}</strong></div></div>{pet.notes && <div className="notes"><small>Notes</small><p>{pet.notes}</p></div>}<div className="details-actions"><button className="primary" onClick={onAddRecord}><Plus size={16} /> Add care record</button><button className="secondary" onClick={onEdit}>Edit profile</button><button className="danger" onClick={onDelete}><Trash2 size={16} /> Delete</button></div></section></div>; }
function PetForm({ pet, onClose, onSaved }) { const [form, setForm] = useState(pet || emptyPet); const [error, setError] = useState(""); const save = async (e) => { e.preventDefault(); setError(""); try { await api(pet ? `/pets/${pet._id}` : "/pets", { method: pet ? "PATCH" : "POST", body: JSON.stringify(form) }); onSaved(); } catch (err) { setError(err.message); } }; const update = (key, value) => setForm({ ...form, [key]: value }); return <div className="overlay"><section className="form-panel"><button className="close" onClick={onClose}><X /></button><span className="eyebrow">{pet ? "Update profile" : "New companion"}</span><h2>{pet ? `Edit ${pet.name}` : "Add a pet"}</h2><p className="panel-intro">A few details help keep their care journey organized.</p><form onSubmit={save} className="pet-form"><label>Pet name<input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Maple" required /></label><label>Species<select value={form.species} onChange={(e) => update("species", e.target.value)}>{["Dog", "Cat", "Bird", "Rabbit", "Other"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Breed <span>optional</span><input value={form.breed} onChange={(e) => update("breed", e.target.value)} placeholder="e.g. Golden Retriever" /></label><label>Birth date <span>optional</span><input type="date" max={new Date().toISOString().slice(0, 10)} value={form.birthDate ? form.birthDate.slice(0, 10) : ""} onChange={(e) => update("birthDate", e.target.value)} /></label><label>Notes <span>optional</span><textarea rows="3" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Favorite things, important details..." /></label>{error && <div className="error">{error}</div>}<div className="form-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary">{pet ? "Save changes" : "Create profile"} <ChevronRight size={17} /></button></div></form></section></div>; }

createRoot(document.getElementById("root")).render(<BrowserRouter><App /></BrowserRouter>);
