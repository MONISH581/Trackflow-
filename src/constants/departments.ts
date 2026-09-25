export const OFFICIAL_DEPARTMENTS = [
  "Agricultural Engineering",
  "Artificial Intelligence and Data Science",
  "Artificial Intelligence and Machine Learning",
  "Biomedical Engineering",
  "Biotechnology",
  "Civil Engineering",
  "Computer Science and Engineering",
  "Computer Science and Engineering (Cyber Security)",
  "Electrical and Electronics Engineering",
  "Electronics and Communication Engineering",
  "Electronics Engineering (VLSI Design and Technology)",
  "Food Technology",
  "Information Technology",
  "Mechanical Engineering"
] as const;

export const OFFICIAL_LABS = [
  "Artificial Intelligence and Research Lab",
  "Cyber Security / Cloud Computing Lab",
  "AR/VR Lab",
  "IoT (Internet of Things) Lab",
  "PCB Lab",
  "Robotics Lab",
  "VLSI Lab"
] as const;

export type DepartmentType = typeof OFFICIAL_DEPARTMENTS[number];
export type LabType = typeof OFFICIAL_LABS[number];
