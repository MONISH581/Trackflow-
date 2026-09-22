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

export type DepartmentType = typeof OFFICIAL_DEPARTMENTS[number];
