// COCKPIT's English copy. Each feature adds its own namespaced keys.
export const en = {
  meta: {
    title: "COCKPIT",
    description: "Where every SOFTURE project stands and what waits for your decision.",
  },
  shell: {
    product: "COCKPIT",
    navigationLabel: "Main",
    mobileTitle: "Navigation",
    mobileDescription: "Inbox, projects and settings",
    toggleSidebar: "Toggle sidebar",
    inbox: "Inbox",
    projects: "Projects",
    settings: "Settings",
    projectsEmpty: "No projects watched yet",
    signedInAs: "Signed in as {email}",
  },
  inbox: {
    title: "Inbox",
    description: "Every decision waiting for you, across all watched projects, oldest first.",
    emptyTitle: "Nothing waits for you",
    emptyDescription: "When a watched project needs your word, it shows up here.",
  },
  projects: {
    title: "Projects",
    description: "Where every watched project stands.",
    emptyTitle: "No projects watched yet",
    emptyDescription: "Add a repository in Settings to start watching it.",
  },
  settings: {
    title: "Settings",
    description: "Your account and the repositories COCKPIT watches.",
    accountHeading: "Account",
    changePassword: "Change password",
    signOut: "Sign out",
  },
} as const;

export type AppMessages = typeof en;
