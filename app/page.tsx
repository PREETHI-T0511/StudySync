"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

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
  estimatedHours: number;
  priority: "High" | "Medium" | "Low";
  status: TaskStatus;
  assignee: string;
  assigneeStudentId?: number | null;
  initials: string;
};

type Group = {
  groupId: number;
  groupName: string;
  groupDescription: string | null;
  estimatedProjectHours: number;
  plannedTaskHours: number;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  pendingTaskCount: number;
  inProgressTaskCount: number;
  assignedTaskCount: number;
  leaderName: string | null;
  isLeader: boolean;
  isCreator: boolean;
};

type DashboardStats = {
  totalGroups: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  upcomingMeetings: number;
};

type Meeting = {
  id: number;
  groupId: number;
  title: string;
  group: string;
  dateISO: string;
  date: string;
  time: string;
  type: "Online" | "In person";
  location: string;
  agenda: string[];
  attendeeIds: string[];
  attendance: "Not marked" | "Attended" | "Did not attend";
};

type TeamMember = {
  id: string;
  userId?: number;
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

type ModalName = "task" | "team" | "teamBudget" | "meeting" | "invite" | "availability" | "profile" | null;
type PageName = "Overview" | "My teams" | "Team details" | "Tasks" | "Schedule" | "Meeting details" | "Focus room";

const noTeamMembers: TeamMember[] = [];

const navItems: { label: PageName; icon: IconName }[] = [
  { label: "Overview", icon: "home" },
  { label: "My teams", icon: "users" },
  { label: "Tasks", icon: "check" },
  { label: "Schedule", icon: "calendar" },
  { label: "Focus room", icon: "clock" },
];

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    credentials: "same-origin",
  });
  const result = (await response.json()) as T & {
    error?: string;
    code?: string;
  };
  if (!response.ok) {
    throw new ApiRequestError(
      result.error ?? `Request failed with status ${response.status}.`,
      response.status,
      result.code,
    );
  }
  return result;
}

class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

function isoDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function taskStatus(value: string): TaskStatus {
  if (value === "Completed") return "Completed";
  if (value === "In Progress") return "In progress";
  return "To do";
}

export default function Home() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [email, setEmail] = useState("");
  const [invitationToken, setInvitationToken] = useState("");
  const [invitationDetails, setInvitationDetails] = useState<{ groupName: string; email: string } | null>(null);
  const [invitationLink, setInvitationLink] = useState("");
  const [inviteCopyStatus, setInviteCopyStatus] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const acceptingInvitationRef = useRef<{
    token: string;
    promise: Promise<{ success: boolean; groupId: number; groupName: string }>;
  } | null>(null);
  const [userName, setUserName] = useState("Student member");
  const [userEmail, setUserEmail] = useState("student@university.edu");
  const [userId, setUserId] = useState<number | null>(null);
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState<number | null>(null);
  const [cgpa, setCgpa] = useState<number | null>(null);
  const [activePage, setActivePage] = useState<PageName>("Overview");
  const [groups, setGroups] = useState<Group[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [groupNotice, setGroupNotice] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [teamMembers, setTeamMembers] = useState<Record<number, TeamMember[]>>({});
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("All tasks");
  const [modal, setModal] = useState<ModalName>(null);
  const [modalGroupId, setModalGroupId] = useState<number>(0);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingStart, setMeetingStart] = useState("");
  const [meetingEnd, setMeetingEnd] = useState("");
  const [meetingType, setMeetingType] = useState<Meeting["type"]>("In person");
  const [budgetEditGroupId, setBudgetEditGroupId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [focusStarted, setFocusStarted] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusSpentSeconds, setFocusSpentSeconds] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("invite");
    if (window.location.pathname === "/create-account") setCreatingAccount(true);
    if (!token) return;

    let active = true;
    setInvitationToken(token);
    setCreatingAccount(true);
    void apiRequest<{ invitation: { groupName: string; email: string } }>(
      `/api/invitations/${encodeURIComponent(token)}`,
    )
      .then(({ invitation }) => {
        if (!active) return;
        setInvitationDetails(invitation);
        setEmail(invitation.email);
      })
      .catch((error: unknown) => {
        if (active) {
          setToast(error instanceof Error ? error.message : "This invitation link is invalid.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadAuthenticatedStudent() {
      try {
        const result = await apiRequest<{ student: { studentId: number; studentName: string; email: string; department: string | null; semester: number | null; cgpa: number | null } }>(
          "/api/auth/me",
        );
        if (!active) return;
        setUserId(result.student.studentId);
        setUserName(result.student.studentName);
        setUserEmail(result.student.email);
        setDepartment(result.student.department ?? "");
        setSemester(result.student.semester);
        setCgpa(result.student.cgpa);
        setSignedIn(true);
      } catch (error) {
        if (active && error instanceof Error && !error.message.includes("Authentication")) {
          setToast(error.message);
        }
      } finally {
        if (active) setAuthLoading(false);
      }
    }
    void loadAuthenticatedStudent();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    let active = true;

    async function loadWorkspace() {
      try {
        setGroupNotice("Loading your workspace...");
        const dashboardPromise = apiRequest<{
          stats: Record<keyof DashboardStats, number | string>;
        }>("/api/dashboard");
        const groupResult = await apiRequest<{ groups: Group[] }>("/api/groups");
        const loadedGroups = groupResult.groups.map((group) => ({
          ...group,
          estimatedProjectHours: Number(group.estimatedProjectHours),
          plannedTaskHours: Number(group.plannedTaskHours),
        }));
        const [memberResults, taskResults, meetingResults, availabilityResults] =
          await Promise.all([
            Promise.all(
              loadedGroups.map((group) =>
                apiRequest<{ members: Array<{ studentId: number; studentName: string; email: string; role: string }> }>(
                  `/api/groups/${group.groupId}/members`,
                ),
              ),
            ),
            Promise.all(
              loadedGroups.map((group) =>
                apiRequest<{ tasks: Array<Record<string, unknown> & { assignments: Array<{ studentId: number; studentName: string; assignedHours: number | string }> }> }>(
                  `/api/groups/${group.groupId}/tasks`,
                ),
              ),
            ),
            Promise.all(
              loadedGroups.map((group) =>
                apiRequest<{ meetings: Array<Record<string, unknown>> }>(
                  `/api/meetings?groupId=${group.groupId}`,
                ),
              ),
            ),
            Promise.all(
              loadedGroups.map((group) =>
                apiRequest<{ availability: Array<Record<string, unknown>> }>(
                  `/api/availability?groupId=${group.groupId}`,
                ),
              ),
            ),
          ]);

        const membersByGroup: Record<number, TeamMember[]> = {};
        memberResults.forEach((result, index) => {
          membersByGroup[loadedGroups[index].groupId] = result.members.map((member) => ({
            id: String(member.studentId),
            userId: member.studentId,
            name: member.studentName,
            email: member.email,
            role: member.role,
            status: "Joined",
          }));
        });

        const loadedTasks: Task[] = taskResults.flatMap((result, index) =>
          result.tasks.map((rawTask) => {
            const assignments = rawTask.assignments ?? [];
            const ownAssignment = assignments.find(
              (assignment) => assignment.studentId === userId,
            );
            const assignment = ownAssignment ?? assignments[0];
            const taskName = String(rawTask.task_title ?? "");
            const assignee = assignment?.studentName ?? "Unassigned";
            return {
              id: Number(rawTask.task_id),
              groupId: loadedGroups[index].groupId,
              title: taskName,
              group: loadedGroups[index].groupName,
              due: isoDate(rawTask.deadline as string | Date | null),
              estimatedHours: Number(rawTask.estimated_hrs),
              priority: String(rawTask.priority) as Task["priority"],
              status: taskStatus(String(rawTask.status)),
              assignee,
              assigneeStudentId: assignment?.studentId ?? null,
              initials: assignee === "Unassigned"
                ? "--"
                : assignee.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
            };
          }),
        );

        const meetingRows = meetingResults.flatMap((result) => result.meetings);
        const loadedMeetings = await Promise.all(
          meetingRows.map(async (meeting) => {
            const detail = await apiRequest<{
              agenda: Array<{ agendaTitle: string }>;
              participants: Array<{ studentId: number }>;
            }>(`/api/meetings/${Number(meeting.meetingId)}`);
            const dateISO = isoDate(meeting.meetingDate as string | Date);
            const startTime = String(meeting.startTime ?? "").slice(0, 5);
            const endTime = String(meeting.endTime ?? "").slice(0, 5);
            const attendanceStatus = String(meeting.attendanceStatus ?? "");
            return {
              id: Number(meeting.meetingId),
              groupId: Number(meeting.groupId),
              title: String(meeting.title),
              group: String(meeting.groupName),
              dateISO,
              date: dateISO
                ? new Date(`${dateISO}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                : "",
              time: `${formatDisplayTime(startTime)} – ${formatDisplayTime(endTime)}`,
              type: String(meeting.location ?? "").startsWith("http") ? "Online" as const : "In person" as const,
              location: String(meeting.location ?? "Location not set"),
              agenda: detail.agenda.map((item) => item.agendaTitle),
              attendeeIds: detail.participants.map((participant) => String(participant.studentId)),
              attendance:
                attendanceStatus === "Attended"
                  ? "Attended" as const
                  : attendanceStatus === "Absent"
                    ? "Did not attend" as const
                    : "Not marked" as const,
            };
          }),
        );

        const loadedAvailability: AvailabilityEntry[] = availabilityResults.flatMap(
          (result, index) =>
            result.availability.map((slot) => ({
              groupId: loadedGroups[index].groupId,
              memberId: String(slot.studentId),
              date: isoDate(slot.availableDate as string | Date),
              start: String(slot.startTime).slice(0, 5),
              end: String(slot.endTime).slice(0, 5),
            })),
        );

        let nextDashboardStats: DashboardStats | null = null;
        let dashboardWarning: string | null = null;
        try {
          const dashboardResult = await dashboardPromise;
          nextDashboardStats = {
            totalGroups: Number(dashboardResult.stats.totalGroups),
            pendingTasks: Number(dashboardResult.stats.pendingTasks),
            inProgressTasks: Number(dashboardResult.stats.inProgressTasks),
            completedTasks: Number(dashboardResult.stats.completedTasks),
            upcomingMeetings: Number(dashboardResult.stats.upcomingMeetings),
          };
        } catch (dashboardError) {
          dashboardWarning =
            dashboardError instanceof Error
              ? `Unable to load dashboard summary: ${dashboardError.message}`
              : "Unable to load dashboard summary.";
        }

        if (!active) return;
        setGroups(loadedGroups);
        setDashboardStats(nextDashboardStats);
        setTeamMembers(membersByGroup);
        setTasks(loadedTasks);
        setMeetings(loadedMeetings);
        setAvailability(loadedAvailability);
        setGroupNotice(dashboardWarning);
      } catch (loadError) {
        if (active) {
          setGroupNotice(
            loadError instanceof Error
              ? `Unable to load workspace data: ${loadError.message}`
              : "Unable to load workspace data.",
          );
        }
      }
    }

    void loadWorkspace();
    return () => {
      active = false;
    };
  }, [signedIn, userId, dataVersion]);

  useEffect(() => {
    if (!signedIn || !invitationToken) return;
    let active = true;
    if (acceptingInvitationRef.current?.token !== invitationToken) {
      acceptingInvitationRef.current = {
        token: invitationToken,
        promise: apiRequest("/api/invitations/accept", {
          method: "POST",
          body: JSON.stringify({ token: invitationToken }),
        }),
      };
    }
    void acceptingInvitationRef.current.promise
      .then(() => {
        if (!active) return;
        setInvitationToken("");
        setInvitationDetails(null);
        window.history.replaceState({}, "", "/workspace");
        setDataVersion((version) => version + 1);
        setToast("You’ve joined the invited team.");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setInvitationToken("");
        setToast(error instanceof Error ? error.message : "Could not accept this invitation.");
      });
    return () => {
      active = false;
    };
  }, [signedIn, invitationToken]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setFormError("");
    setInvitationLink("");
  }, [modal]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    if (!profileOpen && !notificationsOpen) return;

    function closePopovers(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest(".popover-anchor, .profile-button")) {
        return;
      }
      setProfileOpen(false);
      setNotificationsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("click", closePopovers);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closePopovers);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen, notificationsOpen]);

  useEffect(() => {
    if (!focusStarted || focusSeconds === 0) return;
    const timer = window.setTimeout(() => {
      setFocusSeconds((current) => Math.max(0, current - 1));
      setFocusSpentSeconds((current) => current + 1);
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
        (taskFilter === "My tasks" && task.assigneeStudentId === userId) ||
        (taskFilter === "To do" && task.status === "To do") ||
        (taskFilter === "In progress" && task.status === "In progress") ||
        (taskFilter === "Completed" && task.status === "Completed");
      return matchesSearch && matchesFilter;
    });
  }, [search, taskFilter, tasks, userId]);

  const selectedTeam = groups.find((group) => group.groupId === selectedTeamId);
  const modalGroup = groups.find((group) => group.groupId === modalGroupId);
  const budgetEditGroup = groups.find((group) => group.groupId === budgetEditGroupId);
  const modalGroupTaskHours = tasks
    .filter((task) => task.groupId === modalGroupId)
    .reduce((total, task) => total + task.estimatedHours, 0);
  const budgetEditTaskHours = tasks
    .filter((task) => task.groupId === budgetEditGroupId)
    .reduce((total, task) => total + task.estimatedHours, 0);
  const selectedMeeting = meetings.find((meeting) => meeting.id === selectedMeetingId);
  const selectedMeetingGroup = selectedMeeting
    ? groups.find((group) => group.groupId === selectedMeeting.groupId)
    : undefined;
  const selectedMeetingMembers = selectedMeeting
    ? teamMembers[selectedMeeting.groupId] ?? noTeamMembers
    : noTeamMembers;
  const selectedMeetingLead = selectedMeetingMembers.find(
    (member) => member.role === "Leader" && member.status === "Joined",
  );
  const selectedMeetingAttendees = selectedMeeting
    ? selectedMeeting.attendeeIds
        .map((memberId) =>
          selectedMeetingMembers.find((member) => member.id === memberId),
        )
        .filter((member): member is TeamMember => member !== undefined)
    : [];
  const selectedTeamMembers = selectedTeam
    ? teamMembers[selectedTeam.groupId] ?? noTeamMembers
    : noTeamMembers;
  const selectedTeamCurrentMember = selectedTeamMembers.find(
    (member) =>
      member.status === "Joined" &&
      member.email.toLowerCase() === userEmail.toLowerCase(),
  );
  const selectedTeamAvailability = selectedTeam
    ? availability
        .filter((entry) => {
          if (entry.groupId !== selectedTeam.groupId) return false;
          return selectedTeam.isLeader
            ? selectedTeamMembers.some((member) => member.id === entry.memberId)
            : entry.memberId === selectedTeamCurrentMember?.id;
        })
        .sort((first, second) =>
          first.date === second.date
            ? first.start.localeCompare(second.start)
            : first.date.localeCompare(second.date),
        )
    : [];
  const selectedTeamTasks = selectedTeam
    ? tasks.filter(
        (task) =>
          task.groupId === selectedTeam.groupId,
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
  const upcomingMeetings = useMemo(
    () =>
      meetings
        .filter(
          (meeting) =>
            meeting.attendance !== "Attended" &&
            meeting.dateISO >= getTodayISO(),
        )
        .sort((first, second) =>
          first.dateISO === second.dateISO
            ? first.time.localeCompare(second.time)
            : first.dateISO.localeCompare(second.dateISO),
        ),
    [meetings],
  );
  const friends = useMemo(() => {
    const seen = new Set<string>();
    return Object.values(teamMembers)
      .flat()
      .filter((member) => {
        if (member.status !== "Joined") return false;
        if (member.email.toLowerCase() === userEmail.toLowerCase()) return false;
        const key = member.email.toLowerCase() || member.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5);
  }, [teamMembers, userEmail]);
  const projectsWorkedOn = new Set(tasks.map((task) => task.groupId)).size;
  const completedProjects = groups.filter((group) => {
    const projectTasks = tasks.filter((task) => task.groupId === group.groupId);
    return projectTasks.length > 0 && projectTasks.every((task) => task.status === "Completed");
  }).length;

  function openTeam(groupId: number) {
    setSelectedTeamId(groupId);
    setActivePage("Team details");
  }

  function canUpdateTask(task: Task) {
    return groups.find((group) => group.groupId === task.groupId)?.isLeader === true ||
      task.assigneeStudentId === userId;
  }

  function openMeeting(meetingId: number) {
    setSelectedMeetingId(meetingId);
    setActivePage("Meeting details");
    setNotificationsOpen(false);
  }

  async function updateMeetingAttendance(meetingId: number, attendance: Meeting["attendance"]) {
    if (!userId) return;
    try {
      await apiRequest(`/api/meetings/${meetingId}/participants/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          attendanceStatus:
            attendance === "Attended"
              ? "Attended"
              : attendance === "Did not attend"
                ? "Absent"
                : "Invited",
        }),
      });
      setDataVersion((version) => version + 1);
      showToast("Your attendance has been saved.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update attendance.");
    }
  }

  function openTaskModal(groupId = selectedTeamId ?? groups.find((group) => group.isLeader)?.groupId) {
    if (groupId !== undefined && groupId !== null) setModalGroupId(groupId);
    setModal("task");
  }

  function openMeetingModal(groupId = selectedTeamId ?? groups.find((group) => group.isLeader)?.groupId, slot?: AvailabilitySlot) {
    if (groupId !== undefined && groupId !== null) setModalGroupId(groupId);
    setMeetingDate(slot?.date ?? "");
    setMeetingStart(slot?.start ?? "");
    setMeetingEnd(slot?.end ?? "");
    setMeetingType("In person");
    setModal("meeting");
  }

  function openProjectBudgetModal(groupId: number) {
    setFormError("");
    setBudgetEditGroupId(groupId);
    setModal("teamBudget");
  }

  function showToast(message: string) {
    setToast(message);
  }

  async function copyInvitationLink() {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setInviteCopyStatus("Invitation link copied.");
    } catch {
      setInviteCopyStatus("Copy is unavailable. Select the link above and copy it.");
    }
  }

  async function handleApiCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFormError("");
    let keepInviteDialogOpen = false;

    try {
      if (modal === "task") {
        const groupId = Number(formData.get("groupId"));
        const assigneeId = String(formData.get("assigneeId") ?? "");
        const estimatedHours = Number(formData.get("estimatedHours"));
        await apiRequest(`/api/groups/${groupId}/tasks`, {
          method: "POST",
          body: JSON.stringify({
            taskTitle: String(formData.get("title") ?? "").trim(),
            taskDescription: String(formData.get("description") ?? "").trim() || null,
            deadline: String(formData.get("due") ?? "") || null,
            priority: String(formData.get("priority") ?? "Medium"),
            estimatedHrs: estimatedHours,
            ...(assigneeId
              ? { studentId: Number(assigneeId), assignedHours: estimatedHours }
              : {}),
          }),
        });
        setSelectedTeamId(groupId);
        setActivePage(selectedTeamId === groupId ? "Team details" : "Tasks");
        showToast("Task created and saved.");
      } else if (modal === "team") {
        const result = await apiRequest<{ groupId: number }>("/api/groups", {
          method: "POST",
          body: JSON.stringify({
            groupName: String(formData.get("title") ?? "").trim(),
            description: String(formData.get("description") ?? "").trim() || null,
            projectEstimatedHours: Number(formData.get("estimatedProjectHours")),
          }),
        });
        setSelectedTeamId(result.groupId);
        setActivePage("My teams");
        showToast("Your team has been created.");
      } else if (modal === "teamBudget") {
        const groupId = Number(formData.get("groupId"));
        const group = groups.find((item) => item.groupId === groupId);
        if (!group) throw new Error("Choose a team before editing its estimate.");
        await apiRequest(`/api/groups/${groupId}`, {
          method: "PATCH",
          body: JSON.stringify({
            groupName: group.groupName,
            description: group.groupDescription,
            projectEstimatedHours: Number(formData.get("estimatedProjectHours")),
          }),
        });
        setSelectedTeamId(groupId);
        setActivePage("Team details");
        showToast("Project estimate updated.");
      } else if (modal === "meeting") {
        const groupId = Number(formData.get("groupId"));
        const result = await apiRequest<{ meetingId: number }>("/api/meetings", {
          method: "POST",
          body: JSON.stringify({
            groupId,
            meetingTitle: String(formData.get("title") ?? "").trim(),
            meetingDate: String(formData.get("date") ?? ""),
            startTime: String(formData.get("time") ?? ""),
            endTime: String(formData.get("endTime") ?? ""),
            meetingLocation: String(formData.get("location") ?? "").trim(),
            agenda: String(formData.get("agenda") ?? "")
              .split(/\r?\n/)
              .map((item) => item.trim())
              .filter(Boolean),
          }),
        });
        setSelectedMeetingId(result.meetingId);
        setActivePage("Meeting details");
        showToast("Meeting scheduled and saved.");
      } else if (modal === "invite") {
        const groupId = Number(formData.get("groupId"));
        const result = await apiRequest<{ invitationUrl?: string }>(
          `/api/groups/${groupId}/members`,
          {
          method: "POST",
          body: JSON.stringify({
            email: String(formData.get("email") ?? "").trim(),
          }),
          },
        );
        setSelectedTeamId(groupId);
        setActivePage("Team details");
        if (result.invitationUrl) {
          setInvitationLink(new URL(result.invitationUrl, window.location.origin).toString());
          setInviteCopyStatus("");
          keepInviteDialogOpen = true;
          showToast("Invite link created. It expires in 7 days.");
        } else {
          showToast("Student added to the team.");
        }
      } else if (modal === "availability") {
        await apiRequest("/api/availability", {
          method: "POST",
          body: JSON.stringify({
            availableDate: String(formData.get("date") ?? ""),
            startTime: String(formData.get("start") ?? ""),
            endTime: String(formData.get("end") ?? ""),
          }),
        });
        showToast("Availability saved.");
      } else if (modal === "profile") {
        const updatedName = String(formData.get("studentName") ?? "").trim();
        const updatedDepartment = String(formData.get("department") ?? "").trim() || null;
        const updatedSemester = String(formData.get("semester") ?? "") || null;
        const updatedCgpa = String(formData.get("cgpa") ?? "") || null;
        await apiRequest("/api/student/profile", {
          method: "PATCH",
          body: JSON.stringify({
            studentName: updatedName,
            department: updatedDepartment,
            semester: updatedSemester,
            cgpa: updatedCgpa,
          }),
        });
        setUserName(updatedName);
        setDepartment(updatedDepartment ?? "");
        setSemester(updatedSemester === null ? null : Number(updatedSemester));
        setCgpa(updatedCgpa === null ? null : Number(updatedCgpa));
        setProfileOpen(false);
        showToast("Your profile has been updated.");
      }

      if (!keepInviteDialogOpen) setModal(null);
      setDataVersion((version) => version + 1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The request failed.");
    }
  }

  async function toggleTask(taskId: number) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    const group = groups.find((item) => item.groupId === task.groupId);
    if (!group?.isLeader && task.assigneeStudentId !== userId) {
      showToast("Only a team lead or the assigned teammate can update this task.");
      return;
    }
    const status = task.status === "Completed" ? "Pending" : "Completed";
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setDataVersion((version) => version + 1);
      showToast("Task progress updated.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update task.");
    }
  }

  async function assignTask(taskId: number, assigneeId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    const assignee = (teamMembers[task.groupId] ?? []).find(
      (member) => member.id === assigneeId && member.status === "Joined",
    );
    try {
      if (!assigneeId && task.assigneeStudentId) {
        await apiRequest(`/api/tasks/${taskId}/assignments/${task.assigneeStudentId}`, {
          method: "DELETE",
        });
      } else if (assignee && task.assigneeStudentId) {
        await apiRequest(`/api/tasks/${taskId}/assignments/${task.assigneeStudentId}`, {
          method: "PATCH",
          body: JSON.stringify({
            studentId: assignee.userId,
            assignedHours: task.estimatedHours,
          }),
        });
      } else if (assignee) {
        await apiRequest(`/api/tasks/${taskId}/assignments`, {
          method: "POST",
          body: JSON.stringify({
            studentId: assignee.userId,
            assignedHours: task.estimatedHours,
          }),
        });
      }
      setDataVersion((version) => version + 1);
      showToast(assignee ? `Task assigned to ${assignee.name}.` : "Task assignment removed.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update assignment.");
    }
  }

  if (authLoading) {
    return (
      <main className="login-page">
        <section className="login-panel">
          <div className="login-form-wrap">
            <span className="form-kicker">STUDYSYNC</span>
            <h2>Checking your session...</h2>
          </div>
        </section>
      </main>
    );
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
              onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const password = String(formData.get("password") ?? "");
                if (creatingAccount && password !== String(formData.get("confirmPassword") ?? "")) {
                  showToast("Those passwords don’t match.");
                  return;
                }

                setAuthSubmitting(true);
                try {
                  const path = creatingAccount ? "/api/auth/register" : "/api/auth/login";
                  const result = await apiRequest<{
                    student: {
                      studentId: number;
                      studentName: string;
                      email: string;
                      department: string | null;
                      semester: number | null;
                      cgpa: number | null;
                    };
                  }>(path, {
                    method: "POST",
                    body: JSON.stringify(
                      creatingAccount
                        ? {
                            studentName: String(formData.get("name") ?? "").trim(),
                            email: String(formData.get("email") ?? "").trim(),
                            password,
                            department: String(formData.get("department") ?? "").trim() || null,
                            semester: String(formData.get("semester") ?? "") || null,
                            cgpa: String(formData.get("cgpa") ?? "") || null,
                            ...(invitationToken ? { invitationToken } : {}),
                          }
                        : {
                            email: String(formData.get("email") ?? "").trim(),
                            password,
                            rememberMe: formData.get("remember") === "on",
                          },
                    ),
                  });
                  if (!creatingAccount && invitationToken) {
                    await apiRequest("/api/invitations/accept", {
                      method: "POST",
                      body: JSON.stringify({ token: invitationToken }),
                    });
                    setInvitationToken("");
                  }
                  if (creatingAccount && invitationToken) setInvitationToken("");
                  setUserId(result.student.studentId);
                  setUserName(result.student.studentName);
                  setUserEmail(result.student.email);
                  setDepartment(result.student.department ?? "");
                  setSemester(result.student.semester);
                  setCgpa(result.student.cgpa);
                  setSignedIn(true);
                  setActivePage("Overview");
                  window.history.replaceState({}, "", "/workspace");
                  showToast(creatingAccount ? "Your account is ready." : "Welcome back.");
                } catch (error) {
                  if (
                    !creatingAccount &&
                    error instanceof ApiRequestError &&
                    error.code === "ACCOUNT_NOT_FOUND"
                  ) {
                    setCreatingAccount(true);
                    showToast(
                      invitationToken
                        ? "No account exists for this email. Create one to accept the team invitation."
                        : "No account exists for this email. Create a StudySync account to continue.",
                    );
                  } else {
                    showToast(error instanceof Error ? error.message : "Authentication failed.");
                  }
                } finally {
                  setAuthSubmitting(false);
                }
              }}
            >
              {invitationDetails && (
                <p className="invitation-banner">
                  You’ve been invited to join <strong>{invitationDetails.groupName}</strong>.
                  Create your account with {invitationDetails.email} to join the team.
                </p>
              )}
              {creatingAccount && (
                <>
                  <label htmlFor="name">Your name</label>
                  <div className="input-wrap">
                    <Icon name="users" size={18} />
                    <input id="name" name="name" type="text" placeholder="How should we call you?" autoComplete="name" required maxLength={100} />
                  </div>
                  <label htmlFor="department">Department <span className="optional">(optional)</span></label>
                  <div className="input-wrap">
                    <Icon name="book" size={18} />
                    <input id="department" name="department" type="text" placeholder="e.g. Computer Science" maxLength={100} />
                  </div>
                  <div className="form-two-columns">
                    <div><label htmlFor="semester">Semester</label><input id="semester" name="semester" type="number" min="1" max="20" /></div>
                    <div><label htmlFor="cgpa">CGPA</label><input id="cgpa" name="cgpa" type="number" min="0" max="10" step="0.01" /></div>
                  </div>
                </>
              )}
              <label htmlFor="email">Email address</label>
              <div className="input-wrap">
                <Icon name="mail" size={18} />
                <input id="email" name="email" type="email" placeholder="you@university.edu" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
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
                <input id="password" name="password" type="password" placeholder={creatingAccount ? "Create a password" : "Enter your password"} autoComplete={creatingAccount ? "new-password" : "current-password"} required minLength={8} maxLength={128} />
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
                {authSubmitting ? "Please wait..." : creatingAccount ? "Create account" : "Sign in"} <Icon name="arrow" size={17} />
              </button>
            </form>
            <div className="signup-prompt">
              {creatingAccount ? (
                <>Already have an account? <button type="button" onClick={() => setCreatingAccount(false)}>Sign in</button></>
              ) : (
                <>New to StudySync? <button type="button" onClick={() => { setCreatingAccount(true); window.history.replaceState({}, "", "/create-account"); }}>Create an account</button></>
              )}
            </div>
            <div className="demo-note"><span className="demo-dot" /> Secure sign-in · Your project workspace</div>
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
  const overviewCompletedCount = dashboardStats?.completedTasks ?? completedCount;
  const overviewTaskCount =
    dashboardStats
      ? dashboardStats.pendingTasks + dashboardStats.inProgressTasks + dashboardStats.completedTasks
      : tasks.length;
  const overviewInProgressCount =
    dashboardStats?.inProgressTasks ?? inProgressCount;
  const overviewGroupCount = dashboardStats?.totalGroups ?? groups.length;
  const attendedMeetingsCount = meetings.filter(
    (meeting) => meeting.attendance === "Attended",
  ).length;
  const focusMinutes = Math.floor(focusSpentSeconds / 60);
  const profileBadges = [
    { name: "First steps", detail: "Complete your first task", earned: completedCount > 0, icon: "✦" },
    { name: "Team player", detail: "Work with 3 teammates", earned: friends.length >= 3, icon: "♡" },
    { name: "Project finisher", detail: "Complete a team project", earned: completedProjects > 0, icon: "✳" },
    { name: "Focus fan", detail: "Focus for 25 minutes", earned: focusMinutes >= 25, icon: "◷" },
  ];

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
              className={`nav-link ${activePage === item.label || (item.label === "My teams" && activePage === "Team details") || (item.label === "Schedule" && activePage === "Meeting details") ? "active" : ""}`}
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
          <button className="profile-button" aria-label="Open profile" aria-expanded={profileOpen} onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }} type="button">
            <span className="profile-avatar">{userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
            <span className="profile-copy"><strong>{userName}</strong><small>{userEmail}</small></span>
            <Icon name="more" size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{activePage === "Team details" ? selectedTeam?.groupName ?? "Team" : activePage === "Meeting details" ? selectedMeeting?.title ?? "Meetup" : activePage}</strong></div>
          <div className="topbar-actions">
            <label className="global-search">
              <Icon name="search" size={17} />
              <input
                ref={searchInputRef}
                aria-label="Search tasks"
                placeholder="Search tasks..."
                value={search}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearch(value);
                  if (value.trim()) {
                    setTaskFilter("All tasks");
                    setActivePage("Tasks");
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") setActivePage("Tasks");
                }}
              />
              <kbd>⌘ K</kbd>
            </label>
            <div className="popover-anchor">
              <button
                className="icon-button notification-button"
                aria-label={`Notifications${upcomingMeetings.length ? `, ${upcomingMeetings.length} upcoming meetings` : ""}`}
                aria-expanded={notificationsOpen}
                aria-controls="notifications-panel"
                onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }}
                type="button"
              >
                <Icon name="bell" size={19} />{upcomingMeetings.length > 0 && <span className="notification-count">{upcomingMeetings.length}</span>}
              </button>
              {notificationsOpen && (
                <section className="header-popover notification-popover" id="notifications-panel" aria-label="Notifications">
                  <div className="popover-heading"><div><span className="section-eyebrow">YOUR TEAM CALENDAR</span><h2>Notifications</h2></div><span className="count-pill">{upcomingMeetings.length} upcoming</span></div>
                  {upcomingMeetings.length > 0 ? (
                    <div className="notification-list">
                      {upcomingMeetings.map((meeting) => (
                        <button className="notification-item" key={meeting.id} onClick={() => openMeeting(meeting.id)} type="button">
                          <span className="notification-meeting-icon"><Icon name="calendar" size={17} /></span>
                          <span className="notification-item-copy"><strong>Upcoming meetup</strong><span>{meeting.title} · {meeting.group}</span><small>{formatDateLabel(meeting.dateISO)} · {meeting.time}</small></span>
                          <span className="notification-chevron"><Icon name="chevron" size={16} /></span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="no-notifications"><span className="empty-state-icon"><Icon name="bell" size={19} /></span><strong>No notifications</strong><p>You’re all caught up. New meeting reminders will show up here.</p></div>
                  )}
                  <div className="popover-footnote">Meeting reminders are based on your team schedule.</div>
                </section>
              )}
            </div>
            <div className="popover-anchor profile-anchor">
              <button
                className="top-avatar"
                aria-label="Open profile"
                aria-expanded={profileOpen}
                aria-controls="profile-panel"
                onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }}
                type="button"
              >
                {userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
              </button>
              {profileOpen && (
                <section className="header-popover profile-popover" id="profile-panel" aria-label="Your profile">
                  <div className="profile-popover-heading">
                    <span className="profile-avatar profile-avatar-large">{userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                    <span><strong>{userName}</strong><small>{userEmail}</small></span>
                  </div>
                  <div className="profile-stats">
                    <div><strong>{attendedMeetingsCount}</strong><span>Meets attended</span></div>
                    <div><strong>{projectsWorkedOn}</strong><span>Projects worked on</span></div>
                    <div><strong>{formatFocusDuration(focusSpentSeconds)}</strong><span>Focus time</span></div>
                    <div><strong>{completedProjects}</strong><span>Projects completed</span></div>
                  </div>
                  <div className="profile-popover-section">
                    <div className="popover-section-title"><strong>Friends</strong><span>{friends.length}</span></div>
                    {friends.length > 0 ? (
                      <div className="profile-friends">
                        {friends.slice(0, 4).map((friend) => (
                          <div className="profile-friend" key={friend.id}>
                            <span className="friend-avatar">{friend.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                            <span><strong>{friend.name}</strong><small>{friend.role}</small></span>
                            <i aria-label="Joined teammate" />
                          </div>
                        ))}
                        {friends.length > 4 && <span className="more-friends">and {friends.length - 4} more teammates</span>}
                      </div>
                    ) : <p className="profile-empty">Join a team to meet your first study buddy.</p>}
                  </div>
                  <div className="profile-popover-section profile-badges-section">
                    <div className="popover-section-title"><strong>Achievements</strong><span>{profileBadges.filter((badge) => badge.earned).length} / {profileBadges.length} earned</span></div>
                    <div className="profile-badges">
                      {profileBadges.map((badge) => (
                        <div className={`profile-badge ${badge.earned ? "earned" : "locked"}`} key={badge.name} title={badge.detail}>
                          <span>{badge.icon}</span><strong>{badge.name}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="profile-logout" onClick={() => { setProfileOpen(false); setModal("profile"); }} type="button"><Icon name="users" size={15} /> Edit profile</button>
                  <button className="profile-logout" onClick={async () => {
                    try {
                      await apiRequest("/api/auth/logout", { method: "POST" });
                      setSignedIn(false);
                      setUserEmail("");
                      setSearch("");
                      setProfileOpen(false);
                      window.location.assign("/");
                    } catch (error) {
                      setToast(error instanceof Error ? error.message : "Could not log out.");
                    }
                  }} type="button"><Icon name="lock" size={15} /> Log out</button>
                </section>
              )}
            </div>
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
                  <span className="stat-label">Tasks completed</span><strong>{overviewCompletedCount}<small> / {overviewTaskCount}</small></strong>
                  <span className="stat-foot"><span className="trend-up">↑ 2</span> from last week</span>
                </article>
                <article className="stat-card">
                  <span className="stat-icon peach-icon"><Icon name="clock" size={17} /></span>
                  <span className="stat-label">In progress</span><strong>{overviewInProgressCount.toString().padStart(2, "0")}</strong>
                  <span className="stat-foot">Across your teams</span>
                </article>
                <article className="stat-card">
                  <span className="stat-icon green-icon"><Icon name="calendar" size={17} /></span>
                  <span className="stat-label">Coming up</span><strong>{meetings.length.toString().padStart(2, "0")}</strong>
                  <span className="stat-foot">Team meetups scheduled</span>
                </article>
                <article className="stat-card">
                  <span className="stat-icon blue-icon"><Icon name="users" size={17} /></span>
                  <span className="stat-label">Your teams</span><strong>{overviewGroupCount.toString().padStart(2, "0")}</strong>
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
                      <TaskRow key={task.id} task={task} onToggle={toggleTask} canUpdate={canUpdateTask(task)} />
                    ))}
                    {pendingCount === 0 && <p className="empty-copy">All caught up. Take a little breather.</p>}
                  </div>
                  {groups.some((group) => group.isLeader) && <button className="add-inline" onClick={() => openTaskModal()} type="button"><Icon name="plus" size={16} /> Add a task</button>}
                </section>

                <section className="panel schedule-panel">
                  <div className="panel-heading">
                    <div><span className="section-eyebrow">MAKE TIME TO CONNECT</span><h2>Coming up</h2></div>
                    <button className="text-button" onClick={() => setActivePage("Schedule")} type="button">Full schedule <Icon name="arrow" size={15} /></button>
                  </div>
                  <div className="meeting-list">
                    {upcomingMeetings.slice(0, 2).map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} onOpen={() => openMeeting(meeting.id)} />)}
                    {meetings.length === 0 && <p className="empty-copy">Your calendar is open. Plan a team catch-up?</p>}
                  </div>
                  {groups.some((group) => group.isLeader) && <button className="add-inline" onClick={() => openMeetingModal()} type="button"><Icon name="plus" size={16} /> Plan a meetup</button>}
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
            <PageSection eyebrow="A LITTLE PROGRESS GOES A LONG WAY" title="Your tasks" description="Keep an eye on what’s moving and what needs a little attention." actionLabel={groups.some((group) => group.isLeader) ? "New task" : ""} onAction={() => openTaskModal()}>
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
                {visibleTasks.map((task) => <TaskTableRow key={task.id} task={task} onToggle={toggleTask} canUpdate={canUpdateTask(task)} />)}
                {visibleTasks.length === 0 && <div className="empty-state"><span className="empty-state-icon"><Icon name="search" size={22} /></span><strong>No tasks found</strong><p>Try a different search or filter.</p></div>}
              </div>
              <div className="task-summary"><span>{completedCount} completed</span><span>{pendingCount} to do</span><span>{inProgressCount} in progress</span></div>
            </PageSection>
          )}

          {activePage === "My teams" && (
            <PageSection eyebrow="YOUR PEOPLE, YOUR PROJECTS" title="My teams" description="A little teamwork makes the big things feel possible." actionLabel="Create a team" onAction={() => setModal("team")}>
              <section className="panel teams-panel">
                <div className="panel-heading"><div><span className="section-eyebrow">YOUR PROJECTS</span><h2>Teams I lead</h2></div><span className="count-pill">{groups.filter((group) => group.isCreator).length}</span></div>
                <div className="team-grid team-grid-page">
                  {groups.filter((group) => group.isCreator).map((group, index) => <TeamCard group={group} index={index} key={group.groupId} onOpen={() => openTeam(group.groupId)} />)}
                  {groups.every((group) => !group.isCreator) && <p className="empty-copy">You haven’t created a team yet. Start one for your next project.</p>}
                  <button className="team-create-card" onClick={() => setModal("team")} type="button"><span className="create-team-icon"><Icon name="plus" size={20} /></span><strong>Start something new</strong><span>Make a space for your next big idea.</span></button>
                </div>
              </section>
              <section className="panel teams-panel">
                <div className="panel-heading"><div><span className="section-eyebrow">YOUR COLLABORATIONS</span><h2>Teams I’m a member of</h2></div><span className="count-pill">{groups.filter((group) => !group.isCreator).length}</span></div>
                <div className="team-grid team-grid-page">
                  {groups.filter((group) => !group.isCreator).map((group, index) => <TeamCard group={group} index={index} key={group.groupId} onOpen={() => openTeam(group.groupId)} />)}
                  {groups.every((group) => group.isCreator) && <p className="empty-copy">You’re not a member of another team yet.</p>}
                </div>
              </section>
              <div className="panel team-note"><span className="tip-icon"><Icon name="spark" size={17} /></span><div><strong>Good work is shared work.</strong><p>Invite your classmates to a team and keep all your tasks, meetings, and ideas together.</p></div></div>
            </PageSection>
          )}

          {activePage === "Team details" && selectedTeam && (
            <PageSection
              eyebrow="YOUR TEAM WORKSPACE"
              title={selectedTeam.groupName}
              description={selectedTeam.groupDescription || "A shared place to plan work and make progress together."}
              actionLabel={selectedTeam.isLeader ? "Add a task" : ""}
              onAction={() => openTaskModal(selectedTeam.groupId)}
            >
              <section className="team-detail-hero">
                <div>
                  <span className="section-eyebrow">MAKING PROGRESS TOGETHER</span>
                  <p>{selectedTeam.memberCount} teammates · {selectedTeam.taskCount} tasks · {selectedTeam.pendingTaskCount} pending · {selectedTeam.inProgressTaskCount} in progress · {selectedTeamMeetings.length} upcoming meetups</p>
                  <p className="project-estimate-summary">{selectedTeam.plannedTaskHours.toFixed(1)} of {selectedTeam.estimatedProjectHours} estimated project hours planned</p>
                  <div className="team-detail-progress"><span><span style={{ width: `${selectedTeam.taskCount ? Math.round((selectedTeam.completedTaskCount / selectedTeam.taskCount) * 100) : 0}%` }} /></span><strong>{selectedTeam.taskCount ? Math.round((selectedTeam.completedTaskCount / selectedTeam.taskCount) * 100) : 0}% complete</strong></div>
                </div>
                <div className="team-detail-actions">
                  {selectedTeam.isLeader && <button className="button button-quiet" onClick={() => openProjectBudgetModal(selectedTeam.groupId)} type="button"><Icon name="clock" size={16} /> Adjust estimate</button>}
                  <button className="button button-quiet" onClick={() => { setModalGroupId(selectedTeam.groupId); setModal("availability"); }} type="button"><Icon name="clock" size={16} /> Add availability</button>
                  {selectedTeam.isLeader && <button className="button button-primary" onClick={() => { setModalGroupId(selectedTeam.groupId); setModal("invite"); }} type="button"><Icon name="plus" size={16} /> Invite teammate</button>}
                </div>
              </section>

              <div className="team-detail-grid">
                <section className="panel team-detail-tasks">
                  <div className="panel-heading">
                    <div><span className="section-eyebrow">WHO’S DOING WHAT</span><h2>Team tasks</h2></div>
                    {selectedTeam.isLeader && <button className="text-button" onClick={() => openTaskModal(selectedTeam.groupId)} type="button"><Icon name="plus" size={15} /> Add task</button>}
                  </div>
                  {selectedTeamTasks.map((task) => {
                    const assignedMember = selectedTeamMembers.find(
                      (member) => member.status === "Joined" && member.name === task.assignee,
                    );
                    return (
                      <div className="team-task-row" key={task.id}>
                        <button className={`task-checkbox ${task.status === "Completed" ? "checked" : ""}`} aria-label={task.status === "Completed" ? `Mark ${task.title} as not completed` : `Mark ${task.title} as completed`} onClick={() => toggleTask(task.id)} disabled={!canUpdateTask(task)} type="button">{task.status === "Completed" && <Icon name="check" size={13} />}</button>
                        <div className="team-task-copy"><strong>{task.title}</strong><span>{task.status} · {task.estimatedHours} estimated h · Due {formatTaskDueDate(task.due)}</span></div>
                        {selectedTeam.isLeader && <select aria-label={`Assign ${task.title}`} value={assignedMember?.id ?? ""} onChange={(event) => void assignTask(task.id, event.target.value)}>
                          <option value="">Unassigned</option>
                          {selectedTeamMembers.filter((member) => member.status === "Joined").map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                        </select>}
                      </div>
                    );
                  })}
                  {selectedTeamTasks.length === 0 && <p className="empty-copy">No tasks yet. Add the first next step for this team.</p>}
                </section>

                <section className="panel team-members-panel">
                  <div className="panel-heading">
                    <div><span className="section-eyebrow">THE PEOPLE BEHIND THE PROGRESS</span><h2>Teammates</h2></div>
                    {selectedTeam.isLeader && <button className="text-button" onClick={() => { setModalGroupId(selectedTeam.groupId); setModal("invite"); }} type="button"><Icon name="plus" size={15} /> Invite</button>}
                  </div>
                  {selectedTeamMembers.map((member) => (
                    <div className="member-list-row" key={member.id}>
                      <span className={`member-avatar member-avatar-${member.status === "Joined" ? "joined" : "pending"}`}>{member.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                      <span className="member-list-copy"><strong>{member.name}</strong><small>{member.email || member.role}</small></span>
                      <span className="member-role">{member.role}</span>
                    </div>
                  ))}
                  {selectedTeamMembers.length === 0 && <p className="empty-copy">Invite classmates to start working together.</p>}
                </section>
              </div>

              <section className="panel shared-availability-panel">
                <div className="panel-heading">
                  <div><span className="section-eyebrow">FIND A TIME THAT WORKS FOR EVERYONE</span><h2>Team availability</h2></div>
                  <button className="text-button" onClick={() => { setModalGroupId(selectedTeam.groupId); setModal("availability"); }} type="button"><Icon name="plus" size={15} /> Add availability</button>
                </div>
                <p className="availability-explainer">
                  Add your own available times. Your team lead can see each joined teammate’s submissions and use the shared free slots to plan a meetup.
                </p>
                {selectedTeamCurrentMember ? (
                  <div className="availability-submissions">
                    <strong>{selectedTeam.isLeader ? "Submitted by teammates" : "Your submitted times"}</strong>
                    {selectedTeamAvailability.length > 0 ? (
                      <div className="availability-submission-list">
                        {selectedTeamAvailability.map((entry) => {
                          const member = selectedTeamMembers.find((item) => item.id === entry.memberId);
                          return (
                            <div className="availability-submission" key={`${entry.memberId}-${entry.date}-${entry.start}-${entry.end}`}>
                              <span><strong>{selectedTeam.isLeader ? member?.name ?? "Team member" : "You"}</strong><small>{formatDateLabel(entry.date)}</small></span>
                              <span>{formatDisplayTime(entry.start)}–{formatDisplayTime(entry.end)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="availability-submission-empty">No availability has been added yet.</p>
                    )}
                  </div>
                ) : (
                  <p className="availability-explainer">Join this team to submit availability for yourself.</p>
                )}
                <div className="shared-slots-heading"><strong>Common free slots</strong><span>When all joined teammates overlap</span></div>
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
              </section>

                  {selectedTeamMeetings.length > 0 && (
                <section className="panel team-meetings-panel">
                      <div className="panel-heading"><div><span className="section-eyebrow">TIME TO GET TOGETHER</span><h2>Team meetups</h2></div>{selectedTeam.isLeader && <button className="text-button" onClick={() => openMeetingModal(selectedTeam.groupId)} type="button"><Icon name="plus" size={15} /> Plan a meetup</button>}</div>
                  {selectedTeamMeetings.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} roomy onOpen={() => openMeeting(meeting.id)} />)}
                </section>
              )}
            </PageSection>
          )}

          {activePage === "Schedule" && (
            <PageSection eyebrow="MAKE ROOM FOR EACH OTHER" title="Team schedule" description="Time set aside to think, plan, and get somewhere together." actionLabel={groups.some((group) => group.isLeader) ? "Plan a meetup" : ""} onAction={() => openMeetingModal()}>
              <div className="calendar-banner">
                <div className="calendar-date-card"><span>{upcomingMeetings[0]?.dateISO ? formatDateLabel(upcomingMeetings[0].dateISO).split(" ")[1].toUpperCase() : "OPEN"}</span><strong>{upcomingMeetings[0]?.dateISO.slice(8, 10) ?? "—"}</strong><small>{upcomingMeetings[0]?.date.split(" ")[0].replace(",", "").toUpperCase() ?? "DAY"}</small></div>
                <div><span className="section-eyebrow">NEXT UP</span><h2>{upcomingMeetings[0]?.title ?? "An open afternoon"}</h2><p>{upcomingMeetings[0] ? `${formatDateLabel(upcomingMeetings[0].dateISO)} · ${upcomingMeetings[0].time} · ${upcomingMeetings[0].group}` : "Plan a team meetup whenever it works for you."}</p></div>
                <Icon name="calendar" size={34} />
              </div>
              <section className="panel schedule-page-panel">
                <div className="panel-heading"><div><span className="section-eyebrow">A FEW THINGS ON THE CALENDAR</span><h2>Upcoming meetups</h2></div><span className="count-pill">{upcomingMeetings.length} scheduled</span></div>
                {upcomingMeetings.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} roomy onOpen={() => openMeeting(meeting.id)} />)}
                {upcomingMeetings.length === 0 && <p className="empty-copy">No upcoming meetups just yet. Pick a time to bring everyone together.</p>}
              </section>
            </PageSection>
          )}

          {activePage === "Meeting details" && selectedMeeting && (
            <PageSection
              eyebrow="MEETING DETAILS"
              title={selectedMeeting.title}
              description={`${selectedMeeting.group} · ${formatDateLabel(selectedMeeting.dateISO)} · ${selectedMeeting.time}`}
              actionLabel="Back to schedule"
              onAction={() => setActivePage("Schedule")}
            >
              <div className="meeting-detail-grid">
                <section className="panel meeting-agenda-panel">
                  <div className="panel-heading"><div><span className="section-eyebrow">A PLAN FOR OUR TIME</span><h2>Agenda</h2></div><span className="count-pill">{selectedMeeting.agenda.length} items</span></div>
                  {selectedMeeting.agenda.length > 0 ? (
                    <ol className="meeting-agenda-list">
                      {selectedMeeting.agenda.map((item, index) => <li key={`${selectedMeeting.id}-${item}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}
                    </ol>
                  ) : <p className="empty-copy">No agenda yet. Add a few items when planning your next meetup.</p>}
                  <div className="meeting-agenda-note"><Icon name="spark" size={16} /><span>A little plan helps everyone make the most of the time together.</span></div>
                </section>
                <section className="panel meeting-info-panel">
                  <div className="panel-heading"><div><span className="section-eyebrow">THE WHEN & WHERE</span><h2>Meetup info</h2></div><span className={`meeting-type-pill ${selectedMeeting.type === "Online" ? "online" : "in-person"}`}>{selectedMeeting.type}</span></div>
                  <dl className="meeting-info-list">
                    <div><dt>Date</dt><dd><Icon name="calendar" size={15} />{formatDateLabel(selectedMeeting.dateISO)}</dd></div>
                    <div><dt>Time</dt><dd><Icon name="clock" size={15} />{selectedMeeting.time}</dd></div>
                    <div><dt>Project</dt><dd><Icon name="book" size={15} />{selectedMeetingGroup?.groupName ?? selectedMeeting.group}</dd></div>
                    <div><dt>{selectedMeeting.type === "Online" ? "Google Meet link" : "Location"}</dt><dd>{selectedMeeting.type === "Online" ? (
                      /^https?:\/\//i.test(selectedMeeting.location) ? <a className="meeting-location-link" href={selectedMeeting.location} target="_blank" rel="noreferrer"><Icon name="arrow" size={14} />{selectedMeeting.location.replace(/^https?:\/\//i, "")}</a> : <span><Icon name="pin" size={15} />{selectedMeeting.location}</span>
                    ) : <span><Icon name="pin" size={15} />{selectedMeeting.location}</span>}</dd></div>
                    <div><dt>Team lead</dt><dd><span className="lead-avatar">{selectedMeetingLead?.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() ?? "TL"}</span>{selectedMeetingLead?.name ?? "Team lead not set"}</dd></div>
                  </dl>
                </section>
              </div>
              <section className="panel meeting-attendees-panel">
                <div className="panel-heading"><div><span className="section-eyebrow">THE PEOPLE IN THE ROOM</span><h2>Invited teammates</h2></div><span className="count-pill">{selectedMeetingAttendees.length} invited</span></div>
                {selectedMeetingAttendees.length > 0 ? (
                  <div className="meeting-attendee-list">{selectedMeetingAttendees.map((member) => (
                    <div className="meeting-attendee" key={member.id}>
                      <span className={`member-avatar member-avatar-${member.status === "Joined" ? "joined" : "pending"}`}>{member.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                      <span><strong>{member.name}</strong><small>{member.role}</small></span>
                    </div>
                  ))}</div>
                ) : <p className="empty-copy">There are no invitees listed for this meetup.</p>}
              </section>
              <section className="panel meeting-attendance-panel">
                <div><span className="section-eyebrow">KEEP YOUR PROFILE UP TO DATE</span><h2>Did you attend?</h2><p>Marking a meetup as attended updates your total meetings in your profile.</p></div>
                <label className="attendance-select-label" htmlFor="meeting-attendance">Your attendance</label>
                <select id="meeting-attendance" aria-label="Your attendance" value={selectedMeeting.attendance} onChange={(event) => updateMeetingAttendance(selectedMeeting.id, event.target.value as Meeting["attendance"])}>
                  <option>Not marked</option>
                  <option>Attended</option>
                  <option>Did not attend</option>
                </select>
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
            <span className="section-eyebrow">{modal === "task" ? "ONE THING AT A TIME" : modal === "team" || modal === "teamBudget" || modal === "invite" ? "GOOD THINGS GROW TOGETHER" : modal === "availability" ? "A TIME THAT WORKS FOR EVERYONE" : "MAKE TIME TO CONNECT"}</span>
            <h2 id="modal-title">{modal === "task" ? "Add a task" : modal === "team" ? "Start a team" : modal === "teamBudget" ? "Adjust project estimate" : modal === "invite" ? "Add a teammate" : modal === "availability" ? "Add your availability" : modal === "profile" ? "Edit your profile" : "Plan a meetup"}</h2>
            <p className="modal-description">{modal === "task" ? "Choose a team and teammate so everyone knows what’s next." : modal === "team" ? "Create a shared space and set a realistic hour budget for the project." : modal === "teamBudget" ? `Update the total hours for ${budgetEditGroup?.groupName ?? "this project"}. The estimate can’t be lower than hours already planned for tasks.` : modal === "invite" ? "Enter their email. If they don’t have a StudySync account, you’ll get a link to share so they can sign up and join." : modal === "availability" ? "Choose a date and time window when you’re free. Your submission is shared with the team." : modal === "profile" ? "Keep your student details up to date." : "Find a little time to get everyone on the same page."}</p>
            <form className="modal-form"             onSubmit={handleApiCreate}>
              {(modal === "task" || modal === "team" || modal === "meeting") && <>
                <label htmlFor="create-title">{modal === "team" ? "Team name" : modal === "meeting" ? "Meetup title" : "Task name"}</label>
                <input id="create-title" name="title" placeholder={modal === "team" ? "e.g. Biology study group" : modal === "meeting" ? "e.g. Weekly project check-in" : "e.g. Review project outline"} required />
              </>}
              {(modal === "team" || modal === "teamBudget") && <>
                {modal === "teamBudget" && <input type="hidden" name="groupId" value={budgetEditGroupId ?? ""} />}
                <label htmlFor="project-estimate">Estimated project time <span className="optional">(hours)</span></label>
                <input id="project-estimate" name="estimatedProjectHours" type="number" min={modal === "teamBudget" ? Math.max(budgetEditTaskHours, 0.01) : 0.01} step="0.01" defaultValue={modal === "teamBudget" ? budgetEditGroup?.estimatedProjectHours : undefined} placeholder="e.g. 40" required />
                <p className="estimate-help">The team lead sets the total hours available for this project. Task estimates can’t exceed it.</p>
              </>}
              {modal === "team" && <>
                <label htmlFor="description">A little about this team <span className="optional">(optional)</span></label><textarea id="description" name="description" placeholder="What are you working on together?" rows={3} />
              </>}
              {(modal === "task" || modal === "meeting") && <>
                <label htmlFor="groupId">Team</label>
                <select id="groupId" name="groupId" value={modalGroupId} onChange={(event) => setModalGroupId(Number(event.target.value))} required>
                  {groups.filter((group) => group.isLeader).map((group) => <option key={group.groupId} value={group.groupId}>{group.groupName}</option>)}
                </select>
              </>}
              {modal === "task" && <>
                <label htmlFor="task-description">Description <span className="optional">(optional)</span></label>
                <textarea id="task-description" name="description" placeholder="Add a little context for your teammates." rows={3} />
                <label htmlFor="assigneeId">Assign to <span className="optional">(optional)</span></label>
                <select id="assigneeId" name="assigneeId" defaultValue="">
                  <option value="">Unassigned</option>
                  {(teamMembers[modalGroupId] ?? []).filter((member) => member.status === "Joined").map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
                <div className="estimate-budget-note" aria-live="polite">
                  Project estimate: <strong>{modalGroupTaskHours.toFixed(1)} / {modalGroup?.estimatedProjectHours ?? 0} hours planned</strong>
                </div>
                <div className="form-two-columns">
                  <div><label htmlFor="due">Due date</label><input id="due" name="due" type="date" /></div>
                  <div><label htmlFor="task-estimate">Estimated time <span className="optional">(hours)</span></label><input id="task-estimate" name="estimatedHours" type="number" min="0.01" step="0.01" placeholder="e.g. 4" required /></div>
                  <div className="full-form-field"><label htmlFor="priority">Priority</label><select id="priority" name="priority"><option>Medium</option><option>High</option><option>Low</option></select></div>
                </div>
              </>}
              {modal === "meeting" && <>
                <div className="form-two-columns">
                  <div><label htmlFor="date">Date</label><input id="date" name="date" type="date" min={getTodayISO()} value={meetingDate} onChange={(event) => setMeetingDate(event.target.value)} required /></div>
                  <div><label htmlFor="time">Start time</label><input id="time" name="time" type="time" value={meetingStart} onChange={(event) => setMeetingStart(event.target.value)} required /></div>
                  <div><label htmlFor="end-time">End time</label><input id="end-time" name="endTime" type="time" value={meetingEnd} onChange={(event) => setMeetingEnd(event.target.value)} required /></div>
                  <div className="full-form-field"><label htmlFor="meeting-type">Meetup type</label><select id="meeting-type" name="meetingType" value={meetingType} onChange={(event) => setMeetingType(event.target.value as Meeting["type"])}><option>In person</option><option>Online</option></select></div>
                  <div className="full-form-field"><label htmlFor="location">{meetingType === "Online" ? "Google Meet link" : "Location"}</label><input id="location" name="location" type={meetingType === "Online" ? "url" : "text"} placeholder={meetingType === "Online" ? "https://meet.google.com/..." : "e.g. Library · Room 204"} required /></div>
                  <div className="full-form-field"><label htmlFor="agenda">Agenda <span className="optional">(one item per line)</span></label><textarea id="agenda" name="agenda" placeholder={"e.g. Review project progress\nAssign next steps"} rows={3} /></div>
                </div>
              </>}
              {modal === "invite" && <>
                <input type="hidden" name="groupId" value={modalGroupId} />
                {invitationLink ? (
                  <>
                    <label htmlFor="invite-link">Share this account-creation link</label>
                    <input id="invite-link" type="url" value={invitationLink} readOnly onFocus={(event) => event.currentTarget.select()} />
                    <button className="button button-primary" type="button" onClick={() => void copyInvitationLink()}>
                      {inviteCopyStatus === "Invitation link copied." ? "Copied" : "Copy invite link"}
                    </button>
                    <p className="invite-link-note">This link is for the invited email address and expires in 7 days.</p>
                    {inviteCopyStatus && <p className="form-success" role="status">{inviteCopyStatus}</p>}
                  </>
                ) : (
                  <>
                    <label htmlFor="invite-email">Teammate’s email</label>
                    <input id="invite-email" name="email" type="email" placeholder="classmate@university.edu" autoComplete="email" required />
                  </>
                )}
              </>}
              {modal === "availability" && <>
                <input type="hidden" name="groupId" value={modalGroupId} />
                <p className="availability-owner-note">Adding availability as <strong>{userName}</strong>. Only your own account can submit these times.</p>
                <div className="form-two-columns"><div className="full-form-field"><label htmlFor="availability-date">Date</label><input id="availability-date" name="date" type="date" min={getTodayISO()} required /></div><div><label htmlFor="availability-start">Available from</label><input id="availability-start" name="start" type="time" required /></div><div><label htmlFor="availability-end">Available until</label><input id="availability-end" name="end" type="time" required /></div></div>
              </>}
              {modal === "profile" && <>
                <label htmlFor="profile-name">Your name</label><input id="profile-name" name="studentName" defaultValue={userName} maxLength={100} required />
                <label htmlFor="profile-department">Department <span className="optional">(optional)</span></label><input id="profile-department" name="department" defaultValue={department} maxLength={100} />
                <div className="form-two-columns">
                  <div><label htmlFor="profile-semester">Semester <span className="optional">(optional)</span></label><input id="profile-semester" name="semester" type="number" min="1" max="20" defaultValue={semester ?? ""} /></div>
                  <div><label htmlFor="profile-cgpa">CGPA <span className="optional">(optional)</span></label><input id="profile-cgpa" name="cgpa" type="number" min="0" max="10" step="0.01" defaultValue={cgpa ?? ""} /></div>
                </div>
              </>}
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="modal-actions">
                <button className="button button-quiet" onClick={() => setModal(null)} type="button">{invitationLink ? "Done" : "Cancel"}</button>
                {!invitationLink && <button className="button button-primary" type="submit">{modal === "task" ? "Add task" : modal === "team" ? "Create team" : modal === "teamBudget" ? "Save estimate" : modal === "invite" ? "Add teammate" : modal === "availability" ? "Save availability" : modal === "profile" ? "Save profile" : "Schedule meetup"} <Icon name="arrow" size={15} /></button>}
              </div>
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

function getTodayISO(): string {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function formatTaskDueDate(date: string): string {
  if (!date) return "No due date";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFocusDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function TaskRow({ task, onToggle, canUpdate }: { task: Task; onToggle: (id: number) => void; canUpdate: boolean }) {
  return (
    <div className="task-row">
      <button className={`task-checkbox ${task.status === "Completed" ? "checked" : ""}`} aria-label={task.status === "Completed" ? `Mark ${task.title} as not completed` : `Mark ${task.title} as completed`} onClick={() => onToggle(task.id)} disabled={!canUpdate} type="button">{task.status === "Completed" && <Icon name="check" size={13} />}</button>
      <div className="task-row-copy"><strong>{task.title}</strong><span>{task.group}</span></div>
      <span className={`priority-dot priority-${task.priority.toLowerCase()}`} title={`${task.priority} priority`} />
      <span className="task-due"><Icon name="clock" size={14} /> {formatTaskDueDate(task.due)}</span>
    </div>
  );
}

function TaskTableRow({ task, onToggle, canUpdate }: { task: Task; onToggle: (id: number) => void; canUpdate: boolean }) {
  return (
    <div className="task-table-row">
      <div className="table-task-title"><button className={`task-checkbox ${task.status === "Completed" ? "checked" : ""}`} aria-label={task.status === "Completed" ? `Mark ${task.title} as not completed` : `Mark ${task.title} as completed`} onClick={() => onToggle(task.id)} disabled={!canUpdate} type="button">{task.status === "Completed" && <Icon name="check" size={13} />}</button><span className={task.status === "Completed" ? "completed-title" : ""}>{task.title}</span></div>
      <span className="table-team">{task.group}</span>
      <span className="table-due">{formatTaskDueDate(task.due)}</span>
      <span><span className={`priority-pill priority-pill-${task.priority.toLowerCase()}`}><span />{task.priority}</span></span>
      <span><span className={`status-pill status-${task.status.toLowerCase().replace(" ", "-")}`}><span />{task.status}</span></span>
    </div>
  );
}

function MeetingRow({ meeting, roomy = false, onOpen }: { meeting: Meeting; roomy?: boolean; onOpen: () => void }) {
  return (
    <button className={`meeting-row ${roomy ? "meeting-roomy" : ""}`} onClick={onOpen} type="button" aria-label={`View details for ${meeting.title}`}>
      <div className="meeting-date"><span>{meeting.date.split(" ")[0].replace(",", "")}</span><strong>{meeting.date.match(/\d+/)?.[0] ?? "—"}</strong></div>
      <span className="meeting-copy"><strong>{meeting.title}</strong><span>{meeting.group} · {meeting.time}</span><small><Icon name={meeting.type === "Online" ? "arrow" : "pin"} size={13} /> {meeting.type === "Online" ? "Online meetup" : meeting.location}</small></span>
      <span className="meeting-arrow"><Icon name="chevron" size={17} /></span>
    </button>
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
        <div className="team-members"><span>{group.memberCount} members</span><span className="member-divider" /><span>{group.taskCount} tasks</span></div>
        <p className="team-card-leader">{group.isCreator ? "You lead this team" : `Team lead: ${group.leaderName ?? "Not set"}`}</p>
        <p className="team-card-task-summary">{group.completedTaskCount} completed · {group.pendingTaskCount} pending · {group.inProgressTaskCount} in progress</p>
        <div className="team-progress"><span><span style={{ width: `${progress}%` }} /></span><strong>{progress}%</strong></div>
        <span className="team-manage-label">{group.isLeader ? "Manage team" : "View team"} <Icon name="arrow" size={14} /></span>
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
