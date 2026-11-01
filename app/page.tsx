"use client";

import { useEffect, useState } from "react";

type Group = {
  groupId: number;
  groupName: string;
  groupDescription: string | null;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
};

type GroupsResponse = {
  groups?: Group[];
  error?: string;
};

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadGroups() {
      try {
        const response = await fetch("/api/groups");
        const result: GroupsResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load groups.");
        }

        if (active) {
          setGroups(result.groups ?? []);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load groups.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadGroups();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>StudyCircle</span>
        </div>

        <nav aria-label="Main navigation">
          <div className="nav-label">Workspace</div>
          <div className="nav-list">
            <div className="nav-item active" aria-current="page">
              Overview
            </div>
            <div className="nav-item">My Groups</div>
            <div className="nav-item">Tasks</div>
            <div className="nav-item">Meetings</div>
            <div className="nav-item">Availability</div>
          </div>
        </nav>

        <div className="sidebar-note">
          Keep your team in sync. Plan work, share responsibilities, and make
          progress together.
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Student workspace</p>
            <h1>Overview</h1>
          </div>
          <div className="avatar" aria-label="Student profile">
            SC
          </div>
        </header>

        <section className="welcome">
          <h2>Make great things happen together.</h2>
          <p>
            See your collaboration spaces, keep track of shared work, and
            coordinate the next steps with your group.
          </p>
        </section>

        <section aria-labelledby="groups-heading">
          <div className="section-heading">
            <div>
              <h2 id="groups-heading">Your groups</h2>
              <p>Project spaces and team progress at a glance.</p>
            </div>
            {!loading && !error && (
              <span className="count">
                {groups.length} {groups.length === 1 ? "group" : "groups"}
              </span>
            )}
          </div>

          {loading && <div className="notice">Loading your groups...</div>}

          {error && (
            <div className="notice error" role="alert">
              {error} Confirm the database is running and the schema, views,
              and environment variables are configured.
            </div>
          )}

          {!loading && !error && groups.length === 0 && (
            <div className="empty-state">
              No groups yet. Add sample data using{" "}
              <code>database/seed.sql</code> to get started.
            </div>
          )}

          {!loading && !error && groups.length > 0 && (
            <div className="group-grid">
              {groups.map((group) => (
                <article className="group-card" key={group.groupId}>
                  <div className="group-icon" aria-hidden="true">
                    {group.groupName.slice(0, 1).toUpperCase()}
                  </div>
                  <h3>{group.groupName}</h3>
                  <p>{group.groupDescription || "No description provided."}</p>
                  <div className="group-stats">
                    <span>
                      <strong>{group.memberCount}</strong> members
                    </span>
                    <span>
                      <strong>
                        {group.completedTaskCount}/{group.taskCount}
                      </strong>{" "}
                      tasks done
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="footer">
          Student Group Collaboration and Task Management
        </footer>
      </main>
    </div>
  );
}
