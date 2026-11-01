"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type IconName =
  | "home"
  | "users"
  | "check"
  | "calendar"
  | "clock"
  | "search"
  | "plus"
  | "bell"
  | "arrow"
  | "book"
  | "more"
  | "spark"
  | "close"
  | "lock"
  | "mail"
  | "pin"
  | "chevron";

function Icon({
  name,
  size = 18,
}: {
  name: IconName;
  size?: number;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    check: <><path d="M9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

type TaskStatus = "In progress" | "To do" | "Completed";

type Task = {
  id: number;
  groupId: number;
  title: string;
  group: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  status: TaskStatus;
  assignee: string;
  initials: string;
};

type Group = {
  groupId: number;
  groupName: string;
  groupDescription: string | null;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
};

type Meeting = {
  id: number;
  groupId: number;
  title: string;
  group: string;
  date: string;
  time: string;
  location: string;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Joined" | "Invite pending";
};

type AvailabilityEntry = {
  groupId: number;
  memberId: string;
  date: string;
  start: string;
  end: string;
};

type AvailabilitySlot = {
  date: string;
  start: string;
  end: string;
};

type ModalName = "task" | "team" | "meeting" | "invite" | "availability" | null;
type PageName = "Overview" | "My teams" | "Team details" | "Tasks" | "Schedule" | "Focus room";

const initialTasks: Task[] = [
  { id: 1, groupId: 1, title: "Finalize database schema", group: "Database Project", due: "Nov 10", priority: "High", status: "In progress", assignee: "Aarav Sharma", initials: "AS" },
  { id: 2, groupId: 1, title: "Write SQL queries", group: "Database Project", due: "Nov 12", priority: "Medium", status: "To do", assignee: "Rahul Kumar", initials: "RK" },
  { id: 3, groupId: 2, title: "Design the dashboard", group: "Web Development", due: "Nov 15", priority: "High", status: "In progress", assignee: "Ananya Rao", initials: "AR" },
  { id: 4, groupId: 2, title: "Prepare testing checklist", group: "Web Development", due: "Nov 18", priority: "Low", status: "To do", assignee: "Priya Nair", initials: "PN" },
];

const initialMeetings: Meeting[] = [
  { id: 1, groupId: 1, title: "Database design review", group: "Database Project", date: "Thu, Nov 5", time: "10:00 AM", location: "Library · Room 204" },
  { id: 2, groupId: 2, title: "Frontend feedback", group: "Web Development", date: "Fri, Nov 6", time: "2:00 PM", location: "Online · Google Meet" },
];

const initialGroups: Group[] = [
  { groupId: 1, groupName: "Database Project", groupDescription: "Building a thoughtful, well-structured database.", memberCount: 3, taskCount: 2, completedTaskCount: 1 },
  { groupId: 2, groupName: "Web Development", groupDescription: "Designing and building our next great project.", memberCount: 3, taskCount: 2, completedTaskCount: 1 },
];

const initialTeamMembers: Record<number, TeamMember[]> = {
  1: [
    { id: "db-aarav", name: "Aarav Sharma", email: "aarav@gmail.com", role: "Leader", status: "Joined" },
    { id: "db-ananya", name: "Ananya Rao", email: "ananya@gmail.com", role: "Member", status: "Joined" },
    { id: "db-rahul", name: "Rahul Kumar", email: "rahul@gmail.com", role: "Member", status: "Joined" },
  ],
  2: [
    { id: "web-ananya", name: "Ananya Rao", email: "ananya@gmail.com", role: "Leader", status: "Joined" },
    { id: "web-priya", name: "Priya Nair", email: "priya@gmail.com", role: "Member", status: "Joined" },
    { id: "web-karan", name: "Karan Mehta", email: "karan@gmail.com", role: "Member", status: "Joined" },
  ],
};

const initialAvailability: AvailabilityEntry[] = [
  { groupId: 1, memberId: "db-aarav", date: "2026-11-05", start: "10:00", end: "12:00" },
  { groupId: 1, memberId: "db-ananya", date: "2026-11-05", start: "11:00", end: "13:00" },
  { groupId: 1, memberId: "db-rahul", date: "2026-11-05", start: "10:30", end: "12:30" },
  { groupId: 2, memberId: "web-ananya", date: "2026-11-06", start: "14:00", end: "16:00" },
  { groupId: 2, memberId: "web-priya", date: "2026-11-06", start: "14:00", end: "16:00" },
  { groupId: 2, memberId: "web-karan", date: "2026-11-06", start: "15:00", end: "17:00" },
];

const noTeamMembers: TeamMember[] = [];

const navItems: { label: PageName; icon: IconName }[] = [
  { label: "Overview", icon: "home" },
  { label: "My teams", icon: "users" },
  { label: "Tasks", icon: "check" },
  { label: "Schedule", icon: "calendar" },
  { label: "Focus room", icon: "clock" },
];

export default function Home() {
  const [signedIn, setSignedIn] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [userName, setUserName] = useState("Student member");
  const [activePage, setActivePage] = useState<PageName>("Overview");
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [groupNotice, setGroupNotice] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [teamMembers, setTeamMembers] = useState<Record<number, TeamMember[]>>(initialTeamMembers);
  const [availability, setAvailability] = useState<AvailabilityEntry[]>(initialAvailability);
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("All tasks");
  const [modal, setModal] = useState<ModalName>(null);
  const [modalGroupId, setModalGroupId] = useState<number>(initialGroups[0].groupId);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingStart, setMeetingStart] = useState("");
  const [toast, setToast] = useState("");
  const [focusStarted, setFocusStarted] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);

  useEffect(() => {
    let active = true;

    async function loadGroups() {
      try {
        const response = await fetch("/api/groups");
        const result: { groups?: Group[]; error?: string } = await response.json();
        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load groups.");
        }
        if (active && result.groups) {
          setGroups(result.groups);
          setTeamMembers((current) => {
            const next = { ...current };
            for (const group of result.groups ?? []) {
              if (!next[group.groupId]) {
                next[group.groupId] = Array.from(
                  { length: group.memberCount },
                  (_, index) => ({
                    id: `group-${group.groupId}-member-${index + 1}`,
                    name: `Team member ${index + 1}`,
                    email: "",
                    role: index === 0 ? "Leader" : "Member",
                    status: "Joined" as const,
                  }),
                );
              }
            }
            return next;
          });
          setGroupNotice(null);
        }
      } catch (loadError) {
        if (active) {
          setGroupNotice(
            loadError instanceof Error
              ? `${loadError.message} Showing sample teams until your database is connected.`
              : "Unable to load groups. Showing sample teams until your database is connected.",
          );
        }
      }
    }

    void loadGroups();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!focusStarted || focusSeconds === 0) return;
    const timer = window.setTimeout(() => {
      setFocusSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [focusStarted, focusSeconds]);

  useEffect(() => {
    if (focusStarted && focusSeconds === 0) {
      setFocusStarted(false);
      setToast("Focus session complete. Take a well-earned break.");
    }
  }, [focusStarted, focusSeconds]);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        `${task.title} ${task.group} ${task.assignee}`.toLowerCase().includes(query);
      const matchesFilter =
        taskFilter === "All tasks" ||
        (taskFilter === "My tasks" && (task.assignee === userName || task.assignee === "You")) ||
        (taskFilter === "To do" && task.status === "To do") ||
        (taskFilter === "In progress" && task.status === "In progress") ||
        (taskFilter === "Completed" && task.status === "Completed");
      return matchesSearch && matchesFilter;
    });
  }, [search, taskFilter, tasks, userName]);

  const selectedTeam = groups.find((group) => group.groupId === selectedTeamId);
  const selectedTeamMembers = selectedTeam
    ? teamMembers[selectedTeam.groupId] ?? noTeamMembers
    : noTeamMembers;
  const selectedTeamTasks = selectedTeam
    ? tasks.filter(
        (task) =>
          task.groupId === selectedTeam.groupId ||
          task.group === selectedTeam.groupName,
      )
    : [];
  const selectedTeamMeetings = selectedTeam
    ? meetings.filter(
        (meeting) =>
          meeting.groupId === selectedTeam.groupId ||
          meeting.group === selectedTeam.groupName,
      )
    : [];
  const commonSlots = useMemo(
    () =>
      selectedTeam
        ? findCommonAvailability(
            selectedTeam.groupId,
            selectedTeamMembers,
            availability,
          )
        : [],
    [availability, selectedTeam, selectedTeamMembers],
  );

  function openTeam(groupId: number) {
    setSelectedTeamId(groupId);
    setActivePage("Team details");
  }

  function openTaskModal(groupId = selectedTeamId ?? groups[0]?.groupId) {
    if (groupId !== undefined && groupId !== null) setModalGroupId(groupId);
    setModal("task");
  }

  function openMeetingModal(groupId = selectedTeamId ?? groups[0]?.groupId, slot?: AvailabilitySlot) {
    if (groupId !== undefined && groupId !== null) setModalGroupId(groupId);
    setMeetingDate(slot?.date ?? "");
    setMeetingStart(slot?.start ?? "");
    setModal("meeting");
  }

  function showToast(message: string) {
    setToast(message);
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (modal === "task") {
      const title = String(formData.get("title") ?? "").trim();
      if (!title) return;
      const groupId = Number(formData.get("groupId"));
      const group = groups.find((item) => item.groupId === groupId);
      if (!group) {
        showToast("Choose a team before adding this task.");
        return;
      }
      const assigneeId = String(formData.get("assigneeId") ?? "");
      const assignee = (teamMembers[groupId] ?? []).find(
        (member) => member.id === assigneeId && member.status === "Joined",
      );
      setTasks((current) => [
        {
          id: Date.now(),
          groupId,
          title,
          group: group.groupName,
          due: String(formData.get("due") ?? "") || "No due date",
          priority: String(formData.get("priority") ?? "Medium") as Task["priority"],
          status: "To do",
          assignee: assignee?.name ?? "Unassigned",
          initials: assignee
            ? assignee.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
            : "--",
        },
        ...current,
      ]);
      setGroups((current) =>
        current.map((item) =>
          item.groupId === groupId ? { ...item, taskCount: item.taskCount + 1 } : item,
        ),
      );
      if (selectedTeamId === groupId) {
        setActivePage("Team details");
      } else {
        setActivePage("Tasks");
      }
      showToast(assignee ? `Task assigned to ${assignee.name}.` : "Your task has been added.");
    } else if (modal === "team") {
      const groupName = String(formData.get("title") ?? "").trim();
      if (!groupName) return;
      const groupId = Date.now();
      setGroups((current) => [
        ...current,
        {
          groupId,
          groupName,
          groupDescription: String(formData.get("description") ?? "").trim() || null,
          memberCount: 1,
          taskCount: 0,
          completedTaskCount: 0,
        },
      ]);
      setTeamMembers((current) => ({
        ...current,
        [groupId]: [
          {
            id: `member-${groupId}`,
            name: userName,
            email: "",
            role: "Leader",
            status: "Joined",
          },
        ],
      }));
      setSelectedTeamId(groupId);
      setActivePage("My teams");
      showToast("Your new team is ready.");
    } else if (modal === "meeting") {
      const title = String(formData.get("title") ?? "").trim();
      if (!title) return;
      const rawDate = String(formData.get("date") ?? "");
      const groupId = Number(formData.get("groupId"));
      const group = groups.find((item) => item.groupId === groupId);
      if (!group) {
        showToast("Choose a team before scheduling this meetup.");
        return;
      }
      setMeetings((current) => [
        ...current,
        {
          id: Date.now(),
          groupId,
          title,
          group: group.groupName,
          date: rawDate ? new Date(`${rawDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Date to be set",
          time: formatDisplayTime(String(formData.get("time") ?? "")) || "Time to be set",
          location: String(formData.get("location") ?? "").trim() || "Location to be set",
        },
      ]);
      setActivePage(selectedTeamId === groupId ? "Team details" : "Schedule");
      showToast("Your meeting has been scheduled.");
    } else if (modal === "invite") {
      const groupId = Number(formData.get("groupId"));
      const email = String(formData.get("email") ?? "").trim();
      const name = String(formData.get("name") ?? "").trim() || email.split("@")[0];
      const group = groups.find((item) => item.groupId === groupId);
      if (!group || !email) return;
      const members = teamMembers[groupId] ?? [];
      if (members.some((member) => member.email.toLowerCase() === email.toLowerCase())) {
        showToast("That email is already on this team or has an invite.");
        return;
      }
      const member: TeamMember = {
        id: `invite-${Date.now()}`,
        name,
        email,
        role: "Member",
        status: "Invite pending",
      };
      setTeamMembers((current) => ({ ...current, [groupId]: [...members, member] }));
      showToast(`Invite prepared for ${email}. Email delivery isn’t connected in this preview.`);
    } else if (modal === "availability") {
      const groupId = Number(formData.get("groupId"));
      const memberId = String(formData.get("memberId") ?? "");
      const date = String(formData.get("date") ?? "");
      const start = String(formData.get("start") ?? "");
      const end = String(formData.get("end") ?? "");
      if (!groupId || !memberId || !date || !start || !end || start >= end) {
        showToast("Add a date and a valid time window.");
        return;
      }
      setAvailability((current) => [
        ...current.filter(
          (entry) =>
            entry.groupId !== groupId ||
            entry.memberId !== memberId ||
            entry.date !== date,
        ),
        { groupId, memberId, date, start, end },
      ]);
      showToast("Availability saved. Shared slots have been updated.");
    }
    setModal(null);
  }

  function toggleTask(taskId: number) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    const completing = task.status !== "Completed";
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? { ...item, status: completing ? "Completed" : "To do" }
          : item,
      ),
    );
    setGroups((current) =>
      current.map((group) =>
        group.groupId === task.groupId
          ? {
              ...group,
              completedTaskCount: Math.max(
                0,
                group.completedTaskCount + (completing ? 1 : -1),
              ),
            }
          : group,
      ),
    );
    showToast("Task progress updated.");
  }

  function assignTask(taskId: number, assigneeId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    const assignee = (teamMembers[task.groupId] ?? []).find(
      (member) => member.id === assigneeId && member.status === "Joined",
    );
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? {
              ...item,
              assignee: assignee?.name ?? "Unassigned",
              initials: assignee
                ? assignee.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
                : "--",
            }
          : item,
      ),
    );
    showToast(assignee ? `Task assigned to ${assignee.name}.` : "Task is unassigned.");
  }

  function updateMemberStatus(groupId: number, memberId: string) {
    const member = (teamMembers[groupId] ?? []).find((item) => item.id === memberId);
    if (!member || member.status === "Joined") return;
    setTeamMembers((current) => ({
      ...current,
      [groupId]: (current[groupId] ?? []).map((member) =>
        member.id === memberId ? { ...member, status: "Joined" } : member,
      ),
    }));
    setGroups((current) =>
      current.map((group) =>
        group.groupId === groupId
          ? { ...group, memberCount: group.memberCount + 1 }
          : group,
      ),
    );
    showToast("Invite accepted in the preview. The teammate is now included in availability.");
  }

  if (!signedIn) {
    return (
      <main className="login-page">
        <section className="login-intro">
          <a className="brand login-brand" href="#" aria-label="StudySync home">
            <span className="brand-mark"><Icon name="spark" size={20} /></span>
            <span>studysync<span className="brand-period">.</span></span>
          </a>
          <div className="intro-copy">
            <span className="overline"><Icon name="spark" size={15} /> A little more in sync</span>
            <h1>Better work<br />starts <em>together.</em></h1>
            <p>Your people, projects, and next big ideas — all in one calm, collaborative space.</p>
            <div className="intro-people">
              <div className="avatar-stack" aria-hidden="true">
                <span className="person person-one">A</span>
                <span className="person person-two">R</span>
                <span className="person person-three">P</span>
                <span className="people-count">+</span>
              </div>
              <span>Good things happen when we work together.</span>
            </div>
          </div>
          <div className="intro-bottom">
            <span>Make room for good work.</span>
            <span>01 — 03</span>
          </div>
          <div className="decorative-orbit orbit-one" />
          <div className="decorative-orbit orbit-two" />
        </section>

        <section className="login-panel">
          <div className="mobile-brand brand">
            <span className="brand-mark"><Icon name="spark" size={20} /></span>
            <span>studysync<span className="brand-period">.</span></span>
          </div>
          <div className="login-form-wrap">
            <span className="form-kicker">{creatingAccount ? "YOUR NEXT CHAPTER" : "WELCOME BACK"}</span>
            <h2>{creatingAccount ? "Create your account" : "Sign in to your space"}</h2>
            <p className="form-lede">
              {creatingAccount
                ? "Make a space for all the good work you’ll do together."
                : "Pick up where your team left off."}
            </p>
            <form
              className="login-form"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                if (creatingAccount) {
                  const name = String(formData.get("name") ?? "").trim();
                  const password = String(formData.get("password") ?? "");
                  const confirmPassword = String(formData.get("confirmPassword") ?? "");
                  if (!name) {
                    showToast("Enter your name to create an account.");
                    return;
                  }
                  if (password !== confirmPassword) {
                    showToast("Those passwords don’t match. Give it another try.");
                    return;
                  }
                  setUserName(name);
                }
                setSignedIn(true);
                setActivePage("Overview");
                if (creatingAccount) {
                  showToast("Welcome to the StudySync preview. Your account hasn’t been saved.");
                }
              }}
            >
              {creatingAccount && (
                <>
                  <label htmlFor="name">Your name</label>
                  <div className="input-wrap">
                    <Icon name="users" size={18} />
                    <input id="name" name="name" type="text" placeholder="How should we call you?" autoComplete="name" required maxLength={100} />
                  </div>
                </>
              )}
              <label htmlFor="email">Email address</label>
              <div className="input-wrap">
                <Icon name="mail" size={18} />
                <input id="email" name="email" type="email" placeholder="you@university.edu" autoComplete="email" required />
              </div>
              {creatingAccount ? (
                <label htmlFor="password">Password <span className="optional">(at least 8 characters)</span></label>
              ) : (
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  <a href="#forgot-password" onClick={(event) => { event.preventDefault(); showToast("Password recovery will be available when authentication is connected."); }}>Forgot password?</a>
                </div>
              )}
              <div className="input-wrap">
                <Icon name="lock" size={18} />
                <input id="password" name="password" type="password" placeholder={creatingAccount ? "Create a password" : "Enter your password"} autoComplete={creatingAccount ? "new-password" : "current-password"} required minLength={creatingAccount ? 8 : 6} />
              </div>
              {creatingAccount ? (
                <>
                  <label htmlFor="confirm-password">Confirm password</label>
                  <div className="input-wrap">
                    <Icon name="lock" size={18} />
                    <input id="confirm-password" name="confirmPassword" type="password" placeholder="Enter your password again" autoComplete="new-password" required minLength={8} />
                  </div>
                </>
              ) : (
                <label className="remember-row">
                  <input type="checkbox" name="remember" />
                  <span>Keep me signed in</span>
                </label>
              )}
              <button className="button button-primary login-submit" type="submit">
                {creatingAccount ? "Create account" : "Sign in"} <Icon name="arrow" size={17} />
              </button>
            </form>
            <div className="signup-prompt">
              {creatingAccount ? (
                <>Already have an account? <button type="button" onClick={() => setCreatingAccount(false)}>Sign in</button></>
              ) : (
                <>New to StudySync? <button type="button" onClick={() => setCreatingAccount(true)}>Create an account</button></>
              )}
            </div>
            <div className="demo-note"><span className="demo-dot" /> Frontend preview · {creatingAccount ? "Your account isn’t saved yet" : "Sign-in opens the demo workspace"}</div>
          </div>
          <footer className="login-footer">
            <span>© 2026 StudySync</span>
            <span><Icon name="lock" size={13} /> Your team space, your way</span>
          </footer>
        </section>
        {toast && <div className="toast" role="status">{toast}</div>}
      </main>
    );
  }

  const completedCount = tasks.filter((task) => task.status === "Completed").length;
  const inProgressCount = tasks.filter((task) => task.status === "In progress").length;
  const pendingCount = tasks.filter((task) => task.status === "To do").length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand sidebar-brand" href="#" onClick={(event) => { event.preventDefault(); setActivePage("Overview"); }}>
          <span className="brand-mark"><Icon name="spark" size={19} /></span>
          <span>studysync<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-switcher">
          <span className="workspace-icon">S</span>
          <span className="workspace-text"><strong>Student workspace</strong><small>Personal space</small></span>
          <Icon name="chevron" size={15} />
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-caption">WORKSPACE</span>
          {navItems.map((item) => (
            <button
              className={`nav-link ${activePage === item.label || (item.label === "My teams" && activePage === "Team details") ? "active" : ""}`}
              key={item.label}
              onClick={() => setActivePage(item.label)}
              type="button"
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.label === "Tasks" && <span className="nav-count">{pendingCount}</span>}
            </button>
          ))}
          <span className="nav-caption teams-caption">YOUR TEAMS</span>
          {groups.slice(0, 3).map((group, index) => (
            <button className="team-nav-link" key={group.groupId} onClick={() => openTeam(group.groupId)} type="button">
              <span className={`team-dot team-dot-${index % 3}`} />
              <span>{group.groupName}</span>
            </button>
          ))}
          <button className="team-nav-link add-team-link" onClick={() => setModal("team")} type="button">
            <Icon name="plus" size={16} /><span>Add a team</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon"><Icon name="spark" size={16} /></span>
            <strong>Small steps add up.</strong>
            <p>Make a little progress today. Your future self will thank you.</p>
          </div>
          <button className="profile-button" onClick={() => { setSignedIn(false); setSearch(""); }} type="button">
            <span className="profile-avatar">{userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
            <span className="profile-copy"><strong>{userName}</strong><small>View profile</small></span>
            <Icon name="more" size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{activePage === "Team details" ? selectedTeam?.groupName ?? "Team" : activePage}</strong></div>
          <div className="topbar-actions">
            <label className="global-search">
              <Icon name="search" size={17} />
              <input aria-label="Search tasks" placeholder="Search tasks..." value={search} onChange={(event) => setSearch(event.target.value)} />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => showToast("You’re all caught up — no new notifications.")} type="button"><Icon name="bell" size={19} /><span /></button>
            <button className="top-avatar" aria-label="Sign out" onClick={() => setSignedIn(false)} type="button">SC</button>
          </div>
        </header>

        <div className="page-content">
          {groupNotice && <div className="database-notice" role="status">{groupNotice}</div>}

          {activePage === "Overview" && (
            <>
              <section className="welcome-banner">
                <div className="welcome-content">
                  <span className="overline light-overline">YOUR WEEK <span className="tiny-spark">✳</span> ONE THING AT A TIME</span>
                  <h1>A good week starts<br />with a <em>little clarity.</em></h1>
                  <p>You’ve got this. Here’s what’s happening with your teams.</p>
                  <button className="button button-light" onClick={() => setActivePage("Tasks")} type="button">See my tasks <Icon name="arrow" size={16} /></button>
                </div>
                <div className="welcome-art" aria-hidden="true">
                  <div className="art-sun" />
                  <div className="art-circle art-circle-back" />
                  <div className="art-circle art-circle-front"><Icon name="spark" size={37} /></div>
                  <span className="art-star star-one">✳</span><span className="art-star star-two">✦</span>
                  <span className="art-caption">one thing at a time</span>
                </div>
              </section>

              <section className="stats-grid" aria-label="Task summary">
                <article className="stat-card">
                  <span className="stat-icon violet-icon"><Icon name="check" size={17} /></span>
                  <span className="stat-label">Tasks completed</span><strong>{completedCount}<small> / {tasks.length}</small></strong>
                  <span className="stat-foot"><span className="trend-up">↑ 2</span> from last week</span>
                </article>
                <article className="stat-card">
                  <span className="stat-icon peach-icon"><Icon name="clock" size={17} /></span>
                  <span className="stat-label">In progress</span><strong>{inProgressCount.toString().padStart(2, "0")}</strong>
                  <span className="stat-foot">Across your teams</span>
                </article>
                <article className="stat-card">
                  <span className="stat-icon green-icon"><Icon name="calendar" size={17} /></span>
                  <span className="stat-label">Coming up</span><strong>{meetings.length.toString().padStart(2, "0")}</strong>
                  <span className="stat-foot">Team meetups scheduled</span>
                </article>
                <article className="stat-card">
                  <span className="stat-icon blue-icon"><Icon name="users" size={17} /></span>
                  <span className="stat-label">Your teams</span><strong>{groups.length.toString().padStart(2, "0")}</strong>
                  <span className="stat-foot">Good things grow together</span>
                </article>
              </section>

              <div className="content-grid">
                <section className="panel tasks-panel">
                  <div className="panel-heading">
                    <div><span className="section-eyebrow">KEEP THE MOMENTUM</span><h2>On your plate</h2></div>
                    <button className="text-button" onClick={() => setActivePage("Tasks")} type="button">All tasks <Icon name="arrow" size={15} /></button>
                  </div>
                  <div className="task-list compact-task-list">
                    {tasks.filter((task) => task.status !== "Completed").slice(0, 3).map((task) => (
                      <TaskRow key={task.id} task={task} onToggle={toggleTask} />
                    ))}
                    {pendingCount === 0 && <p className="empty-copy">All caught up. Take a little breather.</p>}
                  </div>
                  <button className="add-inline" onClick={() => setModal("task")} type="button"><Icon name="plus" size={16} /> Add a task</button>
                </section>

                <section className="panel schedule-panel">
                  <div className="panel-heading">
                    <div><span className="section-eyebrow">MAKE TIME TO CONNECT</span><h2>Coming up</h2></div>
                    <button className="text-button" onClick={() => setActivePage("Schedule")} type="button">Full schedule <Icon name="arrow" size={15} /></button>
                  </div>
                  <div className="meeting-list">
                    {meetings.slice(0, 2).map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)}
                    {meetings.length === 0 && <p className="empty-copy">Your calendar is open. Plan a team catch-up?</p>}
                  </div>
                  <button className="add-inline" onClick={() => setModal("meeting")} type="button"><Icon name="plus" size={16} /> Plan a meetup</button>
                </section>
              </div>

              <section className="panel teams-panel">
                <div className="panel-heading">
                  <div><span className="section-eyebrow">BETTER, TOGETHER</span><h2>Your teams</h2></div>
                  <button className="text-button" onClick={() => setActivePage("My teams")} type="button">Explore teams <Icon name="arrow" size={15} /></button>
                </div>
                <div className="team-grid">
                  {groups.slice(0, 3).map((group, index) => <TeamCard group={group} index={index} key={group.groupId} onOpen={() => openTeam(group.groupId)} />)}
                  <button className="team-create-card" onClick={() => setModal("team")} type="button">
                    <span className="create-team-icon"><Icon name="plus" size={20} /></span><strong>Start something new</strong><span>Make a space for your next big idea.</span>
                  </button>
                </div>
              </section>
            </>
          )}

          {activePage === "Tasks" && (
            <PageSection eyebrow="A LITTLE PROGRESS GOES A LONG WAY" title="Your tasks" description="Keep an eye on what’s moving and what needs a little attention." actionLabel="New task" onAction={() => setModal("task")}>
              <div className="filter-bar">
                <div className="filter-tabs" role="group" aria-label="Filter tasks">
                  {["All tasks", "My tasks", "To do", "In progress", "Completed"].map((filter) => (
                    <button className={taskFilter === filter ? "selected" : ""} key={filter} onClick={() => setTaskFilter(filter)} type="button">{filter}</button>
                  ))}
                </div>
                <label className="inline-search"><Icon name="search" size={16} /><input placeholder="Find a task..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              </div>
              <div className="panel full-task-panel">
                <div className="task-table-head"><span>Task</span><span>Team</span><span>Due date</span><span>Priority</span><span>Status</span></div>
                {visibleTasks.map((task) => <TaskTableRow key={task.id} task={task} onToggle={toggleTask} />)}
                {visibleTasks.length === 0 && <div className="empty-state"><span className="empty-state-icon"><Icon name="search" size={22} /></span><strong>No tasks found</strong><p>Try a different search or filter.</p></div>}
              </div>
              <div className="task-summary"><span>{completedCount} completed</span><span>{pendingCount} to do</span><span>{inProgressCount} in progress</span></div>
            </PageSection>
          )}

          {activePage === "My teams" && (
            <PageSection eyebrow="YOUR PEOPLE, YOUR PROJECTS" title="My teams" description="A little teamwork makes the big things feel possible." actionLabel="Create a team" onAction={() => setModal("team")}>
              <div className="team-grid team-grid-page">
                {groups.map((group, index) => <TeamCard group={group} index={index} key={group.groupId} onOpen={() => openTeam(group.groupId)} />)}
                <button className="team-create-card" onClick={() => setModal("team")} type="button"><span className="create-team-icon"><Icon name="plus" size={20} /></span><strong>Start something new</strong><span>Make a space for your next big idea.</span></button>
              </div>
              <div className="panel team-note"><span className="tip-icon"><Icon name="spark" size={17} /></span><div><strong>Good work is shared work.</strong><p>Invite your classmates to a team and keep all your tasks, meetings, and ideas together.</p></div></div>
            </PageSection>
          )}

          {activePage === "Team details" && selectedTeam && (
            <PageSection
              eyebrow="YOUR TEAM WORKSPACE"
              title={selectedTeam.groupName}
              description={selectedTeam.groupDescription || "A shared place to plan work and make progress together."}
              actionLabel="Add a task"
              onAction={() => openTaskModal(selectedTeam.groupId)}
            >
              <section className="team-detail-hero">
                <div>
                  <span className="section-eyebrow">MAKING PROGRESS TOGETHER</span>
                  <p>{selectedTeam.memberCount} teammates · {selectedTeamTasks.length} tasks · {selectedTeamMeetings.length} upcoming meetups</p>
                  <div className="team-detail-progress"><span><span style={{ width: `${selectedTeam.taskCount ? Math.round((selectedTeam.completedTaskCount / selectedTeam.taskCount) * 100) : 0}%` }} /></span><strong>{selectedTeam.taskCount ? Math.round((selectedTeam.completedTaskCount / selectedTeam.taskCount) * 100) : 0}% complete</strong></div>
                </div>
                <div className="team-detail-actions">
                  <button className="button button-quiet" onClick={() => { setModalGroupId(selectedTeam.groupId); setModal("availability"); }} type="button"><Icon name="clock" size={16} /> Add availability</button>
                  <button className="button button-primary" onClick={() => { setModalGroupId(selectedTeam.groupId); setModal("invite"); }} type="button"><Icon name="plus" size={16} /> Invite teammate</button>
                </div>
              </section>

              <div className="team-detail-grid">
                <section className="panel team-detail-tasks">
                  <div className="panel-heading">
                    <div><span className="section-eyebrow">WHO’S DOING WHAT</span><h2>Team tasks</h2></div>
                    <button className="text-button" onClick={() => openTaskModal(selectedTeam.groupId)} type="button"><Icon name="plus" size={15} /> Add task</button>
                  </div>
                  {selectedTeamTasks.map((task) => {
                    const assignedMember = selectedTeamMembers.find(
                      (member) => member.status === "Joined" && member.name === task.assignee,
                    );
                    return (
                      <div className="team-task-row" key={task.id}>
                        <button className={`task-checkbox ${task.status === "Completed" ? "checked" : ""}`} aria-label={task.status === "Completed" ? `Mark ${task.title} as not completed` : `Mark ${task.title} as completed`} onClick={() => toggleTask(task.id)} type="button">{task.status === "Completed" && <Icon name="check" size={13} />}</button>
                        <div className="team-task-copy"><strong>{task.title}</strong><span>{task.status} · Due {task.due}</span></div>
                        <select aria-label={`Assign ${task.title}`} value={assignedMember?.id ?? ""} onChange={(event) => assignTask(task.id, event.target.value)}>
                          <option value="">Unassigned</option>
                          {selectedTeamMembers.filter((member) => member.status === "Joined").map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                        </select>
                      </div>
                    );
                  })}
                  {selectedTeamTasks.length === 0 && <p className="empty-copy">No tasks yet. Add the first next step for this team.</p>}
                </section>

                <section className="panel team-members-panel">
                  <div className="panel-heading">
                    <div><span className="section-eyebrow">THE PEOPLE BEHIND THE PROGRESS</span><h2>Teammates</h2></div>
                    <button className="text-button" onClick={() => { setModalGroupId(selectedTeam.groupId); setModal("invite"); }} type="button"><Icon name="plus" size={15} /> Invite</button>
                  </div>
                  {selectedTeamMembers.map((member) => (
                    <div className="member-list-row" key={member.id}>
                      <span className={`member-avatar member-avatar-${member.status === "Joined" ? "joined" : "pending"}`}>{member.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                      <span className="member-list-copy"><strong>{member.name}</strong><small>{member.email || member.role}</small></span>
                      {member.status === "Invite pending" ? (
                        <span className="member-pending-actions"><span className="member-status pending-label">Invite pending</span><button className="member-status pending" onClick={() => updateMemberStatus(selectedTeam.groupId, member.id)} type="button">Mark joined</button></span>
                      ) : (
                        <span className="member-role">{member.role}</span>
                      )}
                    </div>
                  ))}
                  {selectedTeamMembers.length === 0 && <p className="empty-copy">Invite classmates to start working together.</p>}
                </section>
              </div>

              <section className="panel shared-availability-panel">
                <div className="panel-heading">
                  <div><span className="section-eyebrow">FIND A TIME THAT WORKS FOR EVERYONE</span><h2>Shared free slots</h2></div>
                  <button className="text-button" onClick={() => { setModalGroupId(selectedTeam.groupId); setModal("availability"); }} type="button"><Icon name="plus" size={15} /> Add availability</button>
                </div>
                <p className="availability-explainer">Times below are when every joined teammate is free. Pending invites are included once they join.</p>
                {commonSlots.length > 0 ? (
                  <div className="availability-slot-list">
                    {commonSlots.map((slot) => (
                      <div className="availability-slot" key={`${slot.date}-${slot.start}-${slot.end}`}>
                        <span className="meeting-date"><span>{formatDateLabel(slot.date).split(" ")[0].replace(",", "")}</span><strong>{slot.date.slice(8, 10)}</strong></span>
                        <span className="availability-slot-copy"><strong>{formatDateLabel(slot.date)}</strong><small><Icon name="clock" size={13} /> {formatDisplayTime(slot.start)}–{formatDisplayTime(slot.end)}</small></span>
                        <button className="button button-quiet" onClick={() => openMeetingModal(selectedTeam.groupId, slot)} type="button">Schedule meetup <Icon name="arrow" size={14} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="availability-empty"><Icon name="clock" size={19} /><span>No common slots yet. Add availability for each joined teammate to find an overlap.</span></div>
                )}
                <span className="availability-demo-note">Sample availability is provided for this frontend preview.</span>
              </section>

              {selectedTeamMeetings.length > 0 && (
                <section className="panel team-meetings-panel">
                  <div className="panel-heading"><div><span className="section-eyebrow">TIME TO GET TOGETHER</span><h2>Team meetups</h2></div><button className="text-button" onClick={() => openMeetingModal(selectedTeam.groupId)} type="button"><Icon name="plus" size={15} /> Plan a meetup</button></div>
                  {selectedTeamMeetings.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} roomy />)}
                </section>
              )}
            </PageSection>
          )}

          {activePage === "Schedule" && (
            <PageSection eyebrow="MAKE ROOM FOR EACH OTHER" title="Team schedule" description="Time set aside to think, plan, and get somewhere together." actionLabel="Plan a meetup" onAction={() => setModal("meeting")}>
              <div className="calendar-banner">
                <div className="calendar-date-card"><span>NOV</span><strong>05</strong><small>THU</small></div>
                <div><span className="section-eyebrow">NEXT UP</span><h2>{meetings[0]?.title ?? "An open afternoon"}</h2><p>{meetings[0] ? `${meetings[0].date} · ${meetings[0].time} · ${meetings[0].location}` : "Plan a team meetup whenever it works for you."}</p></div>
                <Icon name="calendar" size={34} />
              </div>
              <section className="panel schedule-page-panel">
                <div className="panel-heading"><div><span className="section-eyebrow">A FEW THINGS ON THE CALENDAR</span><h2>Upcoming meetups</h2></div><span className="count-pill">{meetings.length} scheduled</span></div>
                {meetings.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} roomy />)}
                {meetings.length === 0 && <p className="empty-copy">No meetups just yet. Pick a time to bring everyone together.</p>}
              </section>
            </PageSection>
          )}

          {activePage === "Focus room" && (
            <PageSection eyebrow="A QUIETER KIND OF PRODUCTIVITY" title="Your focus room" description="Take a breath, set a gentle timer, and give one thing your attention." actionLabel="" onAction={() => undefined}>
              <section className="focus-card">
                <span className="focus-orbit"><Icon name="spark" size={30} /></span>
                <span className="section-eyebrow">ONE THING AT A TIME</span>
                <div className="focus-time">{`${Math.floor(focusSeconds / 60).toString().padStart(2, "0")}:${(focusSeconds % 60).toString().padStart(2, "0")}`}</div>
                <p>{focusStarted ? "Your focus session is underway. You’ve got this." : "A little breathing room for your best work."}</p>
                <button className="button button-primary" onClick={() => {
                  if (focusStarted) {
                    setFocusStarted(false);
                    showToast("Focus session paused.");
                  } else {
                    if (focusSeconds === 0) setFocusSeconds(25 * 60);
                    setFocusStarted(true);
                    showToast("Your focus session has started.");
                  }
                }} type="button">
                  {focusStarted ? "Pause session" : focusSeconds < 25 * 60 ? "Resume session" : "Start a focus session"} <Icon name={focusStarted ? "clock" : "arrow"} size={16} />
                </button>
                <span className="focus-footnote">25 minutes of focus · 5 minute break</span>
              </section>
              <div className="focus-tip"><Icon name="spark" size={18} /><span><strong>Make it easy to begin.</strong> Pick one small task and let the rest wait.</span></div>
            </PageSection>
          )}

          <footer className="page-footer"><span>StudySync · Make room for good work.</span><span>Built for better teamwork <span className="footer-heart">✳</span></span></footer>
        </div>
      </main>

      {modal && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <section aria-labelledby="modal-title" aria-modal="true" className="modal-card" role="dialog">
            <button className="modal-close" aria-label="Close dialog" onClick={() => setModal(null)} type="button"><Icon name="close" size={20} /></button>
            <span className="section-eyebrow">{modal === "task" ? "ONE THING AT A TIME" : modal === "team" || modal === "invite" ? "GOOD THINGS GROW TOGETHER" : modal === "availability" ? "A TIME THAT WORKS FOR EVERYONE" : "MAKE TIME TO CONNECT"}</span>
            <h2 id="modal-title">{modal === "task" ? "Add a task" : modal === "team" ? "Start a team" : modal === "invite" ? "Invite a teammate" : modal === "availability" ? "Add availability" : "Plan a meetup"}</h2>
            <p className="modal-description">{modal === "task" ? "Choose a team and teammate so everyone knows what’s next." : modal === "team" ? "Create a shared space for your next project." : modal === "invite" ? "Add a classmate to this team. Invitations are only prepared in this preview." : modal === "availability" ? "Add a teammate’s available time to find slots that overlap." : "Find a little time to get everyone on the same page."}</p>
            <form className="modal-form" onSubmit={handleCreate}>
              {(modal === "task" || modal === "team" || modal === "meeting") && <>
                <label htmlFor="create-title">{modal === "team" ? "Team name" : modal === "meeting" ? "Meetup title" : "Task name"}</label>
                <input id="create-title" name="title" placeholder={modal === "team" ? "e.g. Biology study group" : modal === "meeting" ? "e.g. Weekly project check-in" : "e.g. Review project outline"} required />
              </>}
              {modal === "team" && <><label htmlFor="description">A little about this team <span className="optional">(optional)</span></label><textarea id="description" name="description" placeholder="What are you working on together?" rows={3} /></>}
              {(modal === "task" || modal === "meeting") && <>
                <label htmlFor="groupId">Team</label>
                <select id="groupId" name="groupId" value={modalGroupId} onChange={(event) => setModalGroupId(Number(event.target.value))} required>
                  {groups.map((group) => <option key={group.groupId} value={group.groupId}>{group.groupName}</option>)}
                </select>
              </>}
              {modal === "task" && <>
                <label htmlFor="assigneeId">Assign to <span className="optional">(optional)</span></label>
                <select id="assigneeId" name="assigneeId" defaultValue="">
                  <option value="">Unassigned</option>
                  {(teamMembers[modalGroupId] ?? []).filter((member) => member.status === "Joined").map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
                <div className="form-two-columns"><div><label htmlFor="due">Due date</label><input id="due" name="due" placeholder="e.g. Nov 15" /></div><div><label htmlFor="priority">Priority</label><select id="priority" name="priority"><option>Medium</option><option>High</option><option>Low</option></select></div></div>
              </>}
              {modal === "meeting" && <div className="form-two-columns"><div><label htmlFor="date">Date</label><input id="date" name="date" type="date" value={meetingDate} onChange={(event) => setMeetingDate(event.target.value)} required /></div><div><label htmlFor="time">Start time</label><input id="time" name="time" type="time" value={meetingStart} onChange={(event) => setMeetingStart(event.target.value)} required /></div><div className="full-form-field"><label htmlFor="location">Where <span className="optional">(optional)</span></label><input id="location" name="location" placeholder="Room or meeting link" /></div></div>}
              {modal === "invite" && <>
                <input type="hidden" name="groupId" value={modalGroupId} />
                <label htmlFor="invite-email">Teammate’s email</label><input id="invite-email" name="email" type="email" placeholder="classmate@university.edu" autoComplete="email" required />
                <label htmlFor="invite-name">Name <span className="optional">(optional)</span></label><input id="invite-name" name="name" placeholder="Their name" autoComplete="name" />
              </>}
              {modal === "availability" && <>
                <input type="hidden" name="groupId" value={modalGroupId} />
                <label htmlFor="memberId">Teammate</label>
                <select id="memberId" name="memberId" required>
                  {(teamMembers[modalGroupId] ?? []).filter((member) => member.status === "Joined").map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
                <div className="form-two-columns"><div className="full-form-field"><label htmlFor="availability-date">Date</label><input id="availability-date" name="date" type="date" required /></div><div><label htmlFor="availability-start">Available from</label><input id="availability-start" name="start" type="time" required /></div><div><label htmlFor="availability-end">Available until</label><input id="availability-end" name="end" type="time" required /></div></div>
              </>}
              <div className="modal-actions"><button className="button button-quiet" onClick={() => setModal(null)} type="button">Cancel</button><button className="button button-primary" type="submit">{modal === "task" ? "Add task" : modal === "team" ? "Create team" : modal === "invite" ? "Prepare invite" : modal === "availability" ? "Save availability" : "Schedule meetup"} <Icon name="arrow" size={15} /></button></div>
            </form>
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function findCommonAvailability(
  groupId: number,
  members: TeamMember[],
  entries: AvailabilityEntry[],
): AvailabilitySlot[] {
  const joinedMembers = members.filter((member) => member.status === "Joined");
  if (joinedMembers.length === 0) return [];

  const dates = Array.from(
    new Set(
      entries
        .filter(
          (entry) =>
            entry.groupId === groupId &&
            joinedMembers.some((member) => member.id === entry.memberId),
        )
        .map((entry) => entry.date),
    ),
  );
  const slots: AvailabilitySlot[] = [];

  for (const date of dates) {
    let overlaps = entries
      .filter(
        (entry) =>
          entry.groupId === groupId &&
          entry.memberId === joinedMembers[0].id &&
          entry.date === date,
      )
      .map((entry) => ({
        start: timeToMinutes(entry.start),
        end: timeToMinutes(entry.end),
      }));

    for (const member of joinedMembers.slice(1)) {
      const memberWindows = entries.filter(
        (entry) =>
          entry.groupId === groupId &&
          entry.memberId === member.id &&
          entry.date === date,
      );
      overlaps = overlaps.flatMap((overlap) =>
        memberWindows.flatMap((window) => {
          const start = Math.max(overlap.start, timeToMinutes(window.start));
          const end = Math.min(overlap.end, timeToMinutes(window.end));
          return end > start ? [{ start, end }] : [];
        }),
      );
    }

    overlaps
      .filter((overlap) => overlap.end - overlap.start >= 30)
      .sort((first, second) => first.start - second.start)
      .forEach((overlap) => {
        slots.push({
          date,
          start: minutesToTime(overlap.start),
          end: minutesToTime(overlap.end),
        });
      });
  }

  return slots.sort((first, second) =>
    first.date === second.date
      ? first.start.localeCompare(second.start)
      : first.date.localeCompare(second.date),
  );
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  return `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
}

function formatDisplayTime(time: string): string {
  if (!/^\d{2}:\d{2}$/.test(time)) return time;
  return new Date(`1970-01-01T${time}:00`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: number) => void }) {
  return (
    <div className="task-row">
      <button className={`task-checkbox ${task.status === "Completed" ? "checked" : ""}`} aria-label={task.status === "Completed" ? `Mark ${task.title} as not completed` : `Mark ${task.title} as completed`} onClick={() => onToggle(task.id)} type="button">{task.status === "Completed" && <Icon name="check" size={13} />}</button>
      <div className="task-row-copy"><strong>{task.title}</strong><span>{task.group}</span></div>
      <span className={`priority-dot priority-${task.priority.toLowerCase()}`} title={`${task.priority} priority`} />
      <span className="task-due"><Icon name="clock" size={14} /> {task.due}</span>
    </div>
  );
}

function TaskTableRow({ task, onToggle }: { task: Task; onToggle: (id: number) => void }) {
  return (
    <div className="task-table-row">
      <div className="table-task-title"><button className={`task-checkbox ${task.status === "Completed" ? "checked" : ""}`} aria-label={task.status === "Completed" ? `Mark ${task.title} as not completed` : `Mark ${task.title} as completed`} onClick={() => onToggle(task.id)} type="button">{task.status === "Completed" && <Icon name="check" size={13} />}</button><span className={task.status === "Completed" ? "completed-title" : ""}>{task.title}</span></div>
      <span className="table-team">{task.group}</span>
      <span className="table-due">{task.due}</span>
      <span><span className={`priority-pill priority-pill-${task.priority.toLowerCase()}`}><span />{task.priority}</span></span>
      <span><span className={`status-pill status-${task.status.toLowerCase().replace(" ", "-")}`}><span />{task.status}</span></span>
    </div>
  );
}

function MeetingRow({ meeting, roomy = false }: { meeting: Meeting; roomy?: boolean }) {
  return (
    <article className={`meeting-row ${roomy ? "meeting-roomy" : ""}`}>
      <div className="meeting-date"><span>{meeting.date.split(" ")[0].replace(",", "")}</span><strong>{meeting.date.match(/\d+/)?.[0] ?? "—"}</strong></div>
      <div className="meeting-copy"><strong>{meeting.title}</strong><span>{meeting.group} · {meeting.time}</span><small><Icon name="pin" size={13} /> {meeting.location}</small></div>
      <button className="meeting-arrow" aria-label={`View ${meeting.title}`} type="button"><Icon name="chevron" size={17} /></button>
    </article>
  );
}

function TeamCard({ group, index, onOpen }: { group: Group; index: number; onOpen: () => void }) {
  const palettes = ["team-card-lilac", "team-card-peach", "team-card-green"];
  const initials = group.groupName.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const progress = group.taskCount ? Math.round((group.completedTaskCount / group.taskCount) * 100) : 0;
  return (
    <button className="team-card team-card-button" onClick={onOpen} type="button" aria-label={`Open ${group.groupName} team`}>
      <div className={`team-card-art ${palettes[index % palettes.length]}`}><span>{initials}</span><Icon name="more" size={19} /></div>
      <div className="team-card-body">
        <span className="team-card-kicker">PROJECT TEAM</span>
        <h3>{group.groupName}</h3>
        <p>{group.groupDescription || "A shared space to plan, create, and make progress together."}</p>
        <div className="team-members"><div className="mini-avatars"><span>A</span><span>R</span><span>P</span></div><span>{group.memberCount} members</span><span className="member-divider" /><span>{group.taskCount} tasks</span></div>
        <div className="team-progress"><span><span style={{ width: `${progress}%` }} /></span><strong>{progress}%</strong></div>
      </div>
    </button>
  );
}

function PageSection({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="page-section">
      <div className="page-title-row">
        <div><span className="section-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
        {actionLabel && <button className="button button-primary" onClick={onAction} type="button"><Icon name="plus" size={17} />{actionLabel}</button>}
      </div>
      {children}
    </section>
  );
}
